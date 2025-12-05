# Gemini 2.5 Flash Reasoning
> Implement reasoning for Gemini 2.5 Flash.
>
> Implement every detail below end to end and validate your work with tests.

## Implementation Notes

- We're adding support for `gemini-2.5-flash-preview-04-17` with thinking_budget for gemini.
- Just like how claude-3-7-sonnet has budget tokens in src/just_prompt/atoms/llm_providers/anthropic.py, Gemini has a similar feature with the thinking_budget. We want to support this.
- If this parameter is present, we should trigger a prompt_with_thinking function in src/just_prompt/atoms/llm_providers/gemini.py. Use the example code in ai_docs/gemini-2-5-flash-reasoning.md. If parameter is not present, use the existing prompt function.
- Update tests to verify the feature works, specifically in test_gemini.py. Test with gemini-2.5-flash-preview-04-17 with and without the thinking_budget parameter.
- This only works with the gemini-2.5-flash-preview-04-17 model but assume more models like this will be added in the future and check against the model name from a list so we can easily add them later.
- After you implement and test, update the README.md file to detail the new feature.
- We're using 'uv run pytest <file>' to run tests. You won't need to run any other commands or install anything only testing.
- Keep all the essential logic surrounding this change in gemini.py just like how anthropic.py sets this up for it's version (thinking_budget).
- No need to update any libraries or packages.
- So if we pass in something like: `gemini:gemini-2.5-flash-preview-04-17`, run the normal prompt function. If we pass in: `gemini:gemini-2.5-flash-preview-04-17:4k`, run the prompt_with_thinking function with 4000 thinking budget. Mirror anthropic.py's logic.
- Update gemini.py to use the new import and client setup via `from google import genai` and `client = genai.Client(api_key="GEMINI_API_KEY")`.

## Relevant Files (Context)
> Read these files before implementing the feature.
README.md
pyproject.toml
src/just_prompt/molecules/prompt.py
src/just_prompt/atoms/llm_providers/anthropic.py
src/just_prompt/atoms/llm_providers/gemini.py
src/just_prompt/tests/atoms/llm_providers/test_gemini.py

## Example Reasoning Code

```python
from google import genai

client = genai.Client(api_key="GEMINI_API_KEY")

response = client.models.generate_content(
  model="gemini-2.5-flash-preview-04-17",
  contents="You roll two dice. What’s the probability they add up to 7?",
  config=genai.types.GenerateContentConfig(
    thinking_config=genai.types.ThinkingConfig(
      thinking_budget=1024 # 0 - 24576
    )
  )
)

print(response.text)
```

## Self Validation (Close the loop)
> After implementing the feature, run the tests to verify it works.
>
> All env variables are in place - run tests against real apis.
- uv run pytest src/just_prompt/tests/atoms/llm_providers/test_gemini.py
- uv run pytest src/just_prompt/tests/molecules/test_prompt.py
