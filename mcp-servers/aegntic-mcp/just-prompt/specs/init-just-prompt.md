# Specification for Just Prompt
> We're building a lightweight wrapper mcp server around openai, anthropic, gemini, groq, deepseek, and ollama.

## Implementation details

- First, READ ai_docs/* to understand the providers, models, and to see an example mcp server.
- Mirror the work done inside `of ai_docs/pocket-pick-mcp-server-example.xml`. Here we have a complete example of how to build a mcp server. We also have a complete codebase structure that we want to replicate. With some slight tweaks - see `Codebase Structure` below.
- Don't mock any tests - run simple "What is the capital of France?" tests and expect them to pass case insensitive.
- Be sure to use load_dotenv() in the tests.
- models_prefixed_by_provider look like this:
  - openai:gpt-4o
  - anthropic:claude-3-5-sonnet-20240620
  - gemini:gemini-1.5-flash
  - groq:llama-3.1-70b-versatile
  - deepseek:deepseek-coder
  - ollama:llama3.1
  - or using short names:
    - o:gpt-4o
    - a:claude-3-5-sonnet-20240620
    - g:gemini-1.5-flash
    - q:llama-3.1-70b-versatile
    - d:deepseek-coder
    - l:llama3.1
- Be sure to comment every function and class with clear doc strings.
- Don't explicitly write out the full list of models for a provider. Instead, use the `list_models` function.
- Create a 'magic' function somewhere using the weak_provider_and_model param - make sure this is callable. We're going to take the 'models_prefixed_by_provider' and pass it to this function running a custom prompt where we ask the model to return the right model for this given item. TO be clear the 'models_prefixed_by_provider' will be a natural language query and will sometimes be wrong, so we want to correct it after parsing the provider and update it to the right value by provider this weak model prompt the list_model() call for the provider, then add the to the prompt and ask it to return the right model ONLY IF the model (from the split : call) is not in the providers list_model() already. If we run this functionality be sure to log 'weak_provider_and_model' and the 'models_prefixed_by_provider' and the 'corrected_model' to the console. If we dont just say 'using <provider> and <model>'.
- For tests use these models
  - o:gpt-4o-mini
  - a:claude-3-5-haiku
  - g:gemini-2.0-flash
  - q:qwen-2.5-32b
  - d:deepseek-coder
  - l:gemma3:12b
- To implement list models read `list_models.py`.

## Tools we want to expose
> Here's the tools we want to expose:

prompt(text, models_prefixed_by_provider: List[str]) -> List[str] (return value is list of responses)

prompt_from_file(file, models_prefixed_by_provider: List[str]) -> List[str] (return value is list of responses)

prompt_from_file_to_file(file, models_prefixed_by_provider: List[str], output_dir: str = ".") -> List[str] (return value is a list of file paths)

list_providers() -> List[str]

list_models(provider: str) -> List[str]

## Codebase Structure

- .env.sample
- src/
  - just_prompt/
    - __init__.py
    - __main__.py
    - server.py
      - serve(weak_provider_and_model: str = "o:gpt-4o-mini") -> None
    - atoms/
      - __init__.py
      - llm_providers/
        - __init__.py
        - openai.py
          - prompt(text, model) -> str
          - list_models() -> List[str]
        - anthropic.py
          - ...same as openai.py
        - gemini.py
          - ...
        - groq.py
          - ...
        - deepseek.py
          - ...
        - ollama.py
          - ...
      - shared/
        - __init__.py
        - validator.py
          - validate_models_prefixed_by_provider(models_prefixed_by_provider: List[str]) -> raise error if a model prefix does not match a provider
        - utils.py
          - split_provider_and_model(model: str) -> Tuple[str, str] - be sure this only splits the first : in the model string and leaves the rest of the string as the model name. Models will have additional : in the string and we want to ignore them and leave them for the model name.
        - data_types.py
          - class PromptRequest(BaseModel) {text: str, models_prefixed_by_provider: List[str]}
          - class PromptResponse(BaseModel) {responses: List[str]}
          - class PromptFromFileRequest(BaseModel) {file: str, models_prefixed_by_provider: List[str]}
          - class PromptFromFileResponse(BaseModel) {responses: List[str]}
          - class PromptFromFileToFileRequest(BaseModel) {file: str, models_prefixed_by_provider: List[str], output_dir: str = "."}
          - class PromptFromFileToFileResponse(BaseModel) {file_paths: List[str]}
          - class ListProvidersRequest(BaseModel) {}
          - class ListProvidersResponse(BaseModel) {providers: List[str]} - returns all providers with long and short names
          - class ListModelsRequest(BaseModel) {provider: str}
          - class ListModelsResponse(BaseModel) {models: List[str]} - returns all models for a given provider
          - class ModelAlias(BaseModel) {provider: str, model: str}
          - class ModelProviders(Enum):
              OPENAI = ("openai", "o")
              ANTHROPIC = ("anthropic", "a")
              GEMINI = ("gemini", "g")
              GROQ = ("groq", "q")
              DEEPSEEK = ("deepseek", "d")
              OLLAMA = ("ollama", "l")
              
              def __init__(self, full_name, short_name):
                  self.full_name = full_name
                  self.short_name = short_name
                  
              @classmethod
              def from_name(cls, name):
                  for provider in cls:
                      if provider.full_name == name or provider.short_name == name:
                          return provider
                  return None
        - model_router.py
    - molecules/
      - __init__.py
      - prompt.py
      - prompt_from_file.py
      - prompt_from_file_to_file.py
      - list_providers.py
      - list_models.py
    - tests/
      - __init__.py
      - atoms/
        - __init__.py
        - llm_providers/
          - __init__.py
          - test_openai.py
          - test_anthropic.py
          - test_gemini.py
          - test_groq.py
          - test_deepseek.py
          - test_ollama.py
        - shared/
          - __init__.py
          - test_utils.py
      - molecules/
        - __init__.py
        - test_prompt.py
        - test_prompt_from_file.py
        - test_prompt_from_file_to_file.py
        - test_list_providers.py
        - test_list_models.py

## Per provider documentation

### OpenAI
See: `ai_docs/llm_providers_details.xml`

### Anthropic
See: `ai_docs/llm_providers_details.xml`

### Gemini
See: `ai_docs/llm_providers_details.xml`

### Groq

Quickstart
Get up and running with the Groq API in a few minutes.

Create an API Key
Please visit here to create an API Key.

Set up your API Key (recommended)
Configure your API key as an environment variable. This approach streamlines your API usage by eliminating the need to include your API key in each request. Moreover, it enhances security by minimizing the risk of inadvertently including your API key in your codebase.

In your terminal of choice:

export GROQ_API_KEY=<your-api-key-here>
Requesting your first chat completion
curl
JavaScript
Python
JSON
Install the Groq Python library:

pip install groq
Performing a Chat Completion:

import os

from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Explain the importance of fast language models",
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)
Now that you have successfully received a chat completion, you can try out the other endpoints in the API.

Next Steps
Check out the Playground to try out the Groq API in your browser
Join our GroqCloud developer community on Discord
Chat with our Docs at lightning speed using the Groq API!
Add a how-to on your project to the Groq API Cookbook

### DeepSeek
See: `ai_docs/llm_providers_details.xml`

### Ollama
See: `ai_docs/llm_providers_details.xml`


## Validation (close the loop)

- Run `uv run pytest <path_to_test>` to validate the tests are passing - do this iteratively as you build out the tests.
- After code is written, run `uv run pytest` to validate all tests are passing.
- At the end Use `uv run just-prompt --help` to validate the mcp server works.
