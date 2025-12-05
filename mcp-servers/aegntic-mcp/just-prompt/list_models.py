def list_openai_models():
    from openai import OpenAI

    client = OpenAI()

    print(client.models.list())


def list_groq_models():
    import os
    from groq import Groq

    client = Groq(
        api_key=os.environ.get("GROQ_API_KEY"),
    )

    chat_completion = client.models.list()

    print(chat_completion)


def list_anthropic_models():
    import anthropic
    import os
    from dotenv import load_dotenv

    load_dotenv()

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    models = client.models.list()
    print("Available Anthropic models:")
    for model in models.data:
        print(f"- {model.id}")


def list_gemini_models():
    import os
    from google import genai
    from dotenv import load_dotenv

    load_dotenv()

    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    print("List of models that support generateContent:\n")
    for m in client.models.list():
        for action in m.supported_actions:
            if action == "generateContent":
                print(m.name)

    print("List of models that support embedContent:\n")
    for m in client.models.list():
        for action in m.supported_actions:
            if action == "embedContent":
                print(m.name)


def list_deepseek_models():
    from openai import OpenAI

    # for backward compatibility, you can still use `https://api.deepseek.com/v1` as `base_url`.
    client = OpenAI(
        api_key="sk-ds-3f422175ff114212a42d7107c3efd1e4",  # fake
        base_url="https://api.deepseek.com",
    )
    print(client.models.list())


def list_ollama_models():
    import ollama

    print(ollama.list())


# Uncomment to run the functions
# list_openai_models()
# list_groq_models()
# list_anthropic_models()
# list_gemini_models()
# list_deepseek_models()
# list_ollama_models()
