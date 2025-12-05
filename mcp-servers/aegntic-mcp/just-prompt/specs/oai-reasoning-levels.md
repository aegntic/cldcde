Feature Request: Add low, medium, high reasoning levels to the OpenAI o-series reasoning models
> Models; o3-mini, o4-mini, o3
>
> Implement every detail below end to end and validate your work with tests.

## Implementation Notes

- Just like how claude-3-7-sonnet has budget tokens in src/just_prompt/atoms/llm_providers/anthropic.py, OpenAI has a similar feature with the low, medium, high suffix. We want to support o4-mini:low, o4-mini:medium, o4-mini:high, ...repeat for o3-mini and o3.
- If this suffix is present, we should trigger a prompt_with_thinking function in src/just_prompt/atoms/llm_providers/openai.py. Use the example code in ai_docs/openai-reasoning-effort.md. If suffix is not present, use the existing prompt function.
- Update tests to verify the feature works, specifically in test_openai.py. Test with o4-mini:low, o4-mini:medium, o4-mini:high on a simple puzzle.
- After you implement and test, update the README.md file to detail the new feature.
- We're using 'uv' to run code and test. You won't need to install anything just testing.

## Relevant Files (Context)
> Read these files before implementing the feature.
README.md
pyproject.toml
src/just_prompt/molecules/prompt.py
src/just_prompt/atoms/llm_providers/anthropic.py
src/just_prompt/atoms/llm_providers/openai.py
src/just_prompt/tests/atoms/llm_providers/test_openai.py

## Self Validation (Close the loop)
> After implementing the feature, run the tests to verify it works.
>
> All env variables are in place - run tests against real apis.
- uv run pytest src/just_prompt/tests/atoms/llm_providers/test_openai.py
- uv run pytest src/just_prompt/tests/molecules/test_prompt.py