# Data Quality Assessment Prompt

Data quality assessment prompt implementation.

Install:

```
target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}" && \
mkdir -p "$target" && \
curl -fsSL "https://raw.githubusercontent.com/aegntic/cldcde/main/mcp-servers/quick-data/src/mcp_server/prompts/data_quality_assessment_prompt.py" -o "$target/data_quality_assessment_prompt.py" && \
echo "[OK] Installed prompt data_quality_assessment_prompt.py to $target"
```
