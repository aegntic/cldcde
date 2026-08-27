# ae-ltd-worktree-mesh

Manage parallel git worktrees safely for isolated task execution.

Install:

```
tmp="$(mktemp -d)" && \
git clone --depth=1 https://github.com/aegntic/cldcde.git "$tmp/cldcde" && \
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \
cp -R "$tmp/cldcde/skills/ae-ltd-worktree-mesh" ~/.codex/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-worktree-mesh" ~/.zeroclaw/workspace/skills/ && \
cp -R "$tmp/cldcde/skills/ae-ltd-worktree-mesh" ~/.clawreform/workspace/skills/ && \
echo "[OK] Installed skills/ae-ltd-worktree-mesh"
```
