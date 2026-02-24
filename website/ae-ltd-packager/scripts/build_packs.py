#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import tarfile
import textwrap
import zipfile
from pathlib import Path

IGNORE_NAMES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".DS_Store",
    "dist",
    "target",
    ".venv",
    "venv",
}

CURATED_PROMPTS = [
    "Design a launch loop where each generated artifact recruits one more user.",
    "Convert this feature list into a free wow moment plus paid unlock path.",
    "Generate a seven-post X thread that teaches one hard skill and converts cleanly.",
    "Refactor this MCP toolset so a beginner gets first success in under five minutes.",
    "Turn this changelog into a release story optimized for reposts and quote tweets.",
    "Create a referral mechanic where exports carry tasteful branding and one-click install metadata.",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build AE.LTD platform-compatible pack bundles")
    parser.add_argument(
        "--spec",
        default="pack-spec.json",
        help="Path to pack spec JSON (default: pack-spec.json in packager root)",
    )
    parser.add_argument(
        "--only",
        default=None,
        help="Build only one pack id",
    )
    return parser.parse_args()


def load_spec(spec_path: Path) -> dict:
    with spec_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def ignore_filter(_dir: str, names: list[str]) -> set[str]:
    return {n for n in names if n in IGNORE_NAMES}


def resolve_path(path_str: str, base_dir: Path) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (base_dir / path).resolve()


def as_repo_relative(path: Path, repo_root: Path) -> str:
    try:
        return str(path.resolve().relative_to(repo_root.resolve()))
    except ValueError:
        return str(path)


def copy_dir(src: Path, dst: Path) -> None:
    if not src.exists() or not src.is_dir():
        raise FileNotFoundError(f"Directory not found: {src}")
    shutil.copytree(src, dst, dirs_exist_ok=True, ignore=ignore_filter)


def copy_file(src: Path, dst: Path) -> None:
    if not src.exists() or not src.is_file():
        raise FileNotFoundError(f"File not found: {src}")
    ensure_dir(dst.parent)
    shutil.copy2(src, dst)


def first_heading_and_summary(md_text: str, fallback_title: str) -> tuple[str, str]:
    title = fallback_title
    summary = ""
    lines = md_text.splitlines()

    for line in lines:
        if line.strip().startswith("#"):
            title = line.strip().lstrip("#").strip()
            break

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            continue
        summary = stripped
        break

    if not summary:
        summary = "No summary provided."

    return title, summary


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def extract_skill_meta(skill_dir: Path, repo_root: Path) -> dict:
    md_path = skill_dir / "SKILL.md"
    title = skill_dir.name
    description = ""

    if md_path.exists():
        text = read_text(md_path)
        heading, summary = first_heading_and_summary(text, skill_dir.name)
        title = heading or skill_dir.name
        description = summary

        m = re.search(r"^---\n(.*?)\n---", text, re.DOTALL)
        if m:
            fm = m.group(1)
            d = re.search(r"^description:\s*(.+)$", fm, re.MULTILINE)
            if d:
                description = d.group(1).strip().strip('"').strip("'")

    return {
        "id": skill_dir.name,
        "title": title,
        "description": description or "No description",
        "path": as_repo_relative(skill_dir, repo_root),
    }


def extract_plugin_meta(plugin_dir: Path, repo_root: Path) -> dict:
    config_path = plugin_dir / ".claude-plugin" / "plugin.json"
    meta = {
        "id": plugin_dir.name,
        "name": plugin_dir.name,
        "description": "",
        "commands": [],
        "path": as_repo_relative(plugin_dir, repo_root),
    }

    if config_path.exists():
        try:
            data = json.loads(read_text(config_path))
            meta["name"] = data.get("name", plugin_dir.name)
            meta["description"] = data.get("description", "")
            meta["commands"] = data.get("commands", [])
        except json.JSONDecodeError:
            pass

    return meta


def extract_mcp_meta(mcp_dir: Path, repo_root: Path) -> dict:
    readme = None
    for candidate in ["README.md", "readme.md", "README"]:
        p = mcp_dir / candidate
        if p.exists():
            readme = p
            break

    title = mcp_dir.name
    summary = ""
    if readme:
        text = read_text(readme)
        title, summary = first_heading_and_summary(text, mcp_dir.name)

    return {
        "id": mcp_dir.name,
        "title": title,
        "description": summary,
        "path": as_repo_relative(mcp_dir, repo_root),
    }


def collect_markdown_files(root: Path) -> list[Path]:
    if root.name == "plugins":
        return sorted(root.glob("*/commands/*.md"))
    return sorted(root.rglob("*.md"))


def copy_markdown_bank(kind: str, roots: list[Path], dst_root: Path, repo_root: Path) -> list[dict]:
    entries: list[dict] = []

    for root in roots:
        if not root.exists():
            continue

        files = collect_markdown_files(root)
        source_label = root.name

        for md in files:
            rel = md.relative_to(root)
            out_path = dst_root / kind / "raw" / source_label / rel
            copy_file(md, out_path)
            text = read_text(md)
            title, summary = first_heading_and_summary(text, md.stem)
            entries.append(
                {
                    "id": f"{source_label}:{rel.as_posix()}",
                    "title": title,
                    "summary": summary,
                    "source": as_repo_relative(md, repo_root),
                    "bundle_path": str(Path("bundle") / kind / "raw" / source_label / rel),
                }
            )

    return entries


def write_installers(pack_dir: Path, pack_id: str, version: str) -> None:
    install_dir = pack_dir / "install"
    ensure_dir(install_dir)

    install_py = install_dir / "install.py"
    install_sh = install_dir / "install.sh"
    install_ps1 = install_dir / "install.ps1"

    install_py.write_text(
        textwrap.dedent(
            f"""\
            #!/usr/bin/env python3
            import argparse
            import shutil
            from pathlib import Path

            PACK_ID = "{pack_id}"
            VERSION = "{version}"

            def copy_tree(src: Path, dst: Path) -> None:
                dst.mkdir(parents=True, exist_ok=True)
                for item in src.iterdir():
                    target = dst / item.name
                    if item.is_dir():
                        shutil.copytree(item, target, dirs_exist_ok=True)
                    else:
                        shutil.copy2(item, target)

            def main() -> None:
                parser = argparse.ArgumentParser(description="Install AE.LTD bundle")
                parser.add_argument("--prefix", default=str(Path.home() / ".ae-ltd" / PACK_ID), help="Install prefix")
                parser.add_argument("--install-skills", action="store_true", help="Install bundled skills into ~/.codex/skills")
                parser.add_argument("--install-zeroclaw", action="store_true", help="Install skills into ~/.zeroclaw/workspace/skills and ~/.clawreform/workspace/skills")
                parser.add_argument("--install-agent-zero", action="store_true", help="Install skills into agent-zero skills directory")
                parser.add_argument("--agent-zero-path", default=str(Path.home() / "agent-zero-data" / "skills"), help="Agent Zero skills directory")
                args = parser.parse_args()

                script_dir = Path(__file__).resolve().parent
                pack_root = script_dir.parent
                bundle = pack_root / "bundle"
                prefix = Path(args.prefix)

                if prefix.exists():
                    shutil.rmtree(prefix)
                copy_tree(bundle, prefix)

                print(f"[OK] Installed {{PACK_ID}} v{{VERSION}} to {{prefix}}")

                skills_src = bundle / "skills"

                if args.install_skills and skills_src.exists():
                    codex_skills = Path.home() / ".codex" / "skills"
                    codex_skills.mkdir(parents=True, exist_ok=True)
                    copy_tree(skills_src, codex_skills)
                    print(f"[OK] Installed skills to {{codex_skills}}")

                if args.install_agent_zero and skills_src.exists():
                    agent_zero = Path(args.agent_zero_path).expanduser()
                    agent_zero.mkdir(parents=True, exist_ok=True)
                    copy_tree(skills_src, agent_zero)
                    print(f"[OK] Installed skills to {{agent_zero}}")

                if args.install_zeroclaw and skills_src.exists():
                    targets = [
                        Path.home() / ".zeroclaw" / "workspace" / "skills",
                        Path.home() / ".clawreform" / "workspace" / "skills",
                    ]
                    for target in targets:
                        target.mkdir(parents=True, exist_ok=True)
                        copy_tree(skills_src, target)
                        print(f"[OK] Installed skills to {{target}}")

                print("[DONE] Install complete")

            if __name__ == "__main__":
                main()
            """
        ),
        encoding="utf-8",
    )
    os.chmod(install_py, 0o755)

    install_sh.write_text(
        textwrap.dedent(
            """\
            #!/usr/bin/env bash
            set -euo pipefail
            SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
            exec python3 "$SCRIPT_DIR/install.py" "$@"
            """
        ),
        encoding="utf-8",
    )
    os.chmod(install_sh, 0o755)

    install_ps1.write_text(
        textwrap.dedent(
            """\
            Param(
              [Parameter(ValueFromRemainingArguments = $true)]
              [string[]]$Args
            )

            $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
            $Installer = Join-Path $ScriptDir "install.py"
            python $Installer @Args
            """
        ),
        encoding="utf-8",
    )


def write_funnel_assets(pack_dir: Path, pack: dict, skills_count: int, plugin_count: int) -> None:
    funnel_dir = pack_dir / "funnel"
    launch_dir = pack_dir / "launch"
    ensure_dir(funnel_dir)
    ensure_dir(launch_dir)

    tier = pack["tier"]
    pack_name = pack["name"]
    upgrade_url = pack.get("upgrade_url", "https://ae.ltd/pro")

    pricing = {
        "brand": "AE.LTD",
        "pack": pack_name,
        "tier": tier,
        "free_offer": {
            "price": 0,
            "positioning": "High-leverage starter bundle with production-ready workflows.",
            "what_users_get": [
                f"{skills_count} install-ready skills",
                f"{plugin_count} plugin modules",
                "Cross-platform installers (macOS/Linux/Windows)",
                "Prompt + workflow banks",
            ],
        },
        "pro_upgrade": {
            "url": upgrade_url,
            "positioning": "Advanced scale layer for teams and deeper automation.",
            "value_axes": [
                "Complete plugin and MCP coverage",
                "Extended workflow automation",
                "Team rollout playbooks",
                "Launch analytics and optimization kits",
            ],
        },
    }

    (funnel_dir / "pricing.json").write_text(json.dumps(pricing, indent=2), encoding="utf-8")

    (funnel_dir / "upgrade-path.md").write_text(
        textwrap.dedent(
            f"""\
            # Upgrade Path: {pack_name}

            ## Free-to-Pro Funnel
            1. User installs free pack and gets first win in under 10 minutes.
            2. User shares generated artifacts/workflows on X with pack attribution.
            3. User hits scale limits (team rollout, deeper MCP graph, advanced automation).
            4. User upgrades to pro at: {upgrade_url}

            ## Conversion Triggers
            - Need team-level rollout and governance.
            - Need full plugin and MCP coverage.
            - Need white-label packaging and advanced launch orchestration.
            """
        ),
        encoding="utf-8",
    )

    (launch_dir / "x-thread-kit.md").write_text(
        textwrap.dedent(
            f"""\
            # X Launch Kit: {pack_name}

            ## Thread Hook Options
            1. "I turned advanced AI tooling into a one-command starter stack. Free."
            2. "This AE.LTD pack gives builders instant MCP + workflow leverage."
            3. "Most lists are static. This bundle is installable and production-usable in minutes."

            ## Seven-Post Skeleton
            1. Pain point + why typical stacks fail.
            2. Show one fast first-win workflow.
            3. Show pack architecture snapshot.
            4. Show prompt/workflow/plugin interoperability.
            5. Show before/after productivity proof.
            6. Free install CTA.
            7. Pro roadmap CTA ({pack.get('upgrade_url', 'https://ae.ltd/pro')}).
            """
        ),
        encoding="utf-8",
    )


def write_curated_prompt_pack(pack_dir: Path) -> None:
    prompts_dir = pack_dir / "bundle" / "prompts"
    ensure_dir(prompts_dir)

    lines = [f"{i}. {prompt}" for i, prompt in enumerate(CURATED_PROMPTS, start=1)]
    (prompts_dir / "ae-ltd-viral-prompts.md").write_text(
        "# AE.LTD Viral Prompt Set\n\n" + "\n".join(lines) + "\n",
        encoding="utf-8",
    )


def write_json(path: Path, data) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def build_archives(pack_dir: Path, out_dir: Path) -> tuple[Path, Path]:
    zip_path = out_dir / f"{pack_dir.name}.zip"
    tgz_path = out_dir / f"{pack_dir.name}.tar.gz"

    if zip_path.exists():
        zip_path.unlink()
    if tgz_path.exists():
        tgz_path.unlink()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(pack_dir.rglob("*")):
            zf.write(p, p.relative_to(pack_dir.parent))

    with tarfile.open(tgz_path, "w:gz") as tf:
        tf.add(pack_dir, arcname=pack_dir.name)

    return zip_path, tgz_path


def build_pack(
    pack: dict,
    version: str,
    out_dir: Path,
    spec_dir: Path,
    repo_root: Path,
) -> dict:
    pack_id = pack["id"]
    staged = out_dir / f"{pack_id}-v{version}"
    clean_dir(staged)

    bundle_dir = staged / "bundle"
    ensure_dir(bundle_dir)

    copy_cfg = pack["copy"]

    skills_out = bundle_dir / "skills"
    ensure_dir(skills_out)
    skills_meta = []
    for skill_path_str in copy_cfg.get("skills", []):
        skill_path = resolve_path(skill_path_str, spec_dir)
        dest = skills_out / skill_path.name
        copy_dir(skill_path, dest)
        skills_meta.append(extract_skill_meta(dest, repo_root))

    mcps_out = bundle_dir / "mcps"
    ensure_dir(mcps_out)
    mcps_meta = []
    for mcp_path_str in copy_cfg.get("mcps", []):
        mcp_path = resolve_path(mcp_path_str, spec_dir)
        dest = mcps_out / mcp_path.name
        copy_dir(mcp_path, dest)
        mcps_meta.append(extract_mcp_meta(dest, repo_root))

    plugins_out = bundle_dir / "plugins"
    ensure_dir(plugins_out)
    plugins_root_str = copy_cfg.get("plugins_root", "")
    plugins_root = resolve_path(plugins_root_str, spec_dir) if plugins_root_str else Path(".")
    plugins_select = copy_cfg.get("plugins", [])

    selected_plugins: list[Path] = []
    if plugins_root.exists():
        if plugins_select == "__ALL__":
            selected_plugins = sorted(
                p for p in plugins_root.iterdir() if p.is_dir() and not p.name.startswith(".")
            )
        else:
            selected_plugins = [plugins_root / name for name in plugins_select]

    plugin_meta = []
    for plugin_dir in selected_plugins:
        if not plugin_dir.exists():
            continue
        dest = plugins_out / plugin_dir.name
        copy_dir(plugin_dir, dest)
        plugin_meta.append(extract_plugin_meta(dest, repo_root))

    workflow_roots = [resolve_path(p, spec_dir) for p in copy_cfg.get("workflow_roots", [])]
    prompt_roots = [resolve_path(p, spec_dir) for p in copy_cfg.get("prompt_roots", [])]

    workflow_entries = copy_markdown_bank("workflows", workflow_roots, bundle_dir, repo_root)
    prompt_entries = copy_markdown_bank("prompts", prompt_roots, bundle_dir, repo_root)

    templates_out = bundle_dir / "templates"
    ensure_dir(templates_out)
    template_files = copy_cfg.get("template_files", [])
    template_root = copy_cfg.get("template_root")

    if template_root:
        template_root_path = resolve_path(template_root, spec_dir)
        copy_dir(template_root_path, templates_out / template_root_path.name)
    for file_str in template_files:
        file_path = resolve_path(file_str, spec_dir)
        copy_file(file_path, templates_out / file_path.name)

    extras_out = bundle_dir / "extras"
    ensure_dir(extras_out)
    for extra_dir_str in copy_cfg.get("extra_dirs", []):
        src = resolve_path(extra_dir_str, spec_dir)
        if src.exists():
            copy_dir(src, extras_out / src.name)

    write_curated_prompt_pack(staged)

    catalog_dir = staged / "catalog"
    ensure_dir(catalog_dir)
    write_json(catalog_dir / "skills.json", skills_meta)
    write_json(catalog_dir / "mcps.json", mcps_meta)
    write_json(catalog_dir / "plugins.json", plugin_meta)
    write_json(catalog_dir / "workflows.json", workflow_entries)
    write_json(catalog_dir / "prompts.json", prompt_entries)

    write_installers(staged, pack_id, version)
    write_funnel_assets(staged, pack, len(skills_meta), len(plugin_meta))

    manifest = {
        "id": pack_id,
        "name": pack["name"],
        "tier": pack["tier"],
        "tagline": pack.get("tagline", ""),
        "version": version,
        "built_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "upgrade_url": pack.get("upgrade_url"),
        "counts": {
            "skills": len(skills_meta),
            "mcps": len(mcps_meta),
            "plugins": len(plugin_meta),
            "workflow_docs": len(workflow_entries),
            "prompt_docs": len(prompt_entries),
        },
        "install": {
            "shell": "install/install.sh",
            "powershell": "install/install.ps1",
            "python": "install/install.py",
        },
        "catalog": {
            "skills": "catalog/skills.json",
            "mcps": "catalog/mcps.json",
            "plugins": "catalog/plugins.json",
            "workflows": "catalog/workflows.json",
            "prompts": "catalog/prompts.json",
        },
    }
    write_json(staged / "manifest.json", manifest)

    zip_path, tgz_path = build_archives(staged, out_dir)
    manifest_copy = out_dir / f"{staged.name}-manifest.json"
    shutil.copy2(staged / "manifest.json", manifest_copy)
    shutil.rmtree(staged)

    return {
        "id": pack_id,
        "name": pack["name"],
        "tier": pack["tier"],
        "tagline": pack.get("tagline", ""),
        "upgrade_url": pack.get("upgrade_url"),
        "artifacts": {
            "zip": zip_path.name,
            "tar_gz": tgz_path.name,
            "zip_sha256": hash_file(zip_path),
            "tar_gz_sha256": hash_file(tgz_path),
            "manifest": manifest_copy.name,
        },
        "manifest": manifest,
    }


def main() -> None:
    args = parse_args()

    packager_root = Path(__file__).resolve().parents[1]
    repo_root = packager_root.parents[1]

    spec_path = Path(args.spec)
    if not spec_path.is_absolute():
        spec_path = packager_root / spec_path
    spec_path = spec_path.resolve()

    spec = load_spec(spec_path)
    spec_dir = spec_path.parent
    version = spec["version"]

    output_dir = resolve_path(spec["output_dir"], spec_dir)
    ensure_dir(output_dir)

    web_prefix = spec.get("web_prefix", "/static/downloads")

    results = []
    for pack in spec["packs"]:
        if args.only and pack["id"] != args.only:
            continue
        results.append(build_pack(pack, version, output_dir, spec_dir, repo_root))

    if not results:
        raise SystemExit("No packs were built. Check --only value.")

    checksums_lines = []
    for result in results:
        checksums_lines.append(f"{result['artifacts']['zip_sha256']}  {result['artifacts']['zip']}")
        checksums_lines.append(f"{result['artifacts']['tar_gz_sha256']}  {result['artifacts']['tar_gz']}")
    (output_dir / "checksums.txt").write_text("\n".join(checksums_lines) + "\n", encoding="utf-8")

    build_report = {
        "brand": spec.get("brand", "AE.LTD"),
        "affiliations": spec.get("affiliations", []),
        "version": version,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "packs": results,
    }
    write_json(output_dir / "build-report.json", build_report)

    latest = {
        "brand": spec.get("brand", "AE.LTD"),
        "affiliations": spec.get("affiliations", []),
        "version": version,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "packs": [],
    }

    for result in results:
        latest["packs"].append(
            {
                "id": result["id"],
                "name": result["name"],
                "tier": result["tier"],
                "tagline": result["tagline"],
                "upgrade_url": result.get("upgrade_url"),
                "counts": result["manifest"]["counts"],
                "downloads": {
                    "zip": f"{web_prefix}/{result['artifacts']['zip']}",
                    "tar_gz": f"{web_prefix}/{result['artifacts']['tar_gz']}",
                    "manifest": f"{web_prefix}/{result['artifacts']['manifest']}",
                },
            }
        )

    write_json(output_dir / "latest.json", latest)

    print("Build complete:")
    for result in results:
        print(f"- {result['id']}")
        print(f"  zip:    {output_dir / result['artifacts']['zip']}")
        print(f"  tar.gz: {output_dir / result['artifacts']['tar_gz']}")


if __name__ == "__main__":
    main()
