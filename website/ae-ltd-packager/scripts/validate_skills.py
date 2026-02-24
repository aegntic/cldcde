#!/usr/bin/env python3
import sys
from pathlib import Path

try:
    import yaml
except Exception as exc:
    raise SystemExit(f"Missing PyYAML: {exc}")


def load_toml(path: Path):
    data = path.read_text(encoding="utf-8")
    try:
        import tomllib

        return tomllib.loads(data)
    except ModuleNotFoundError:
        import toml

        return toml.loads(data)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    skills_dir = repo_root / "skills"

    if not skills_dir.exists():
        print(f"No skills dir found at {skills_dir}")
        return 1

    errors: list[str] = []
    checked = 0

    for skill in sorted(p for p in skills_dir.iterdir() if p.is_dir()):
        checked += 1
        required = [
            skill / "SKILL.md",
            skill / "SKILL.toml",
            skill / "agents" / "openai.yaml",
        ]

        for req in required:
            if not req.exists():
                errors.append(f"{skill.name}: missing {req.relative_to(skill)}")

        toml_path = skill / "SKILL.toml"
        if toml_path.exists():
            try:
                load_toml(toml_path)
            except Exception as exc:
                errors.append(f"{skill.name}: invalid TOML ({exc})")

        yaml_path = skill / "agents" / "openai.yaml"
        if yaml_path.exists():
            try:
                yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
            except Exception as exc:
                errors.append(f"{skill.name}: invalid YAML ({exc})")

    if errors:
        print("SKILL_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"SKILL_VALIDATION_OK ({checked} skills)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
