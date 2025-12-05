# Code Review
- Review the diff, report on issues, bugs, and improvements. 
- End with a concise markdown table of any issues found, their solutions, and a risk assessment for each issue if applicable.
- Use emojis to convey the severity of each issue.

## Diff
diff --git a/list_models.py b/list_models.py
index aebb141..0c11e9b 100644
--- a/list_models.py
+++ b/list_models.py
@@ -1,69 +1,81 @@
-# from openai import OpenAI
+def list_openai_models():
+    from openai import OpenAI
 
-# client = OpenAI()
+    client = OpenAI()
 
-# print(client.models.list())
+    print(client.models.list())
 
-# --------------------------------
 
-# import os
+def list_groq_models():
+    import os
+    from groq import Groq
 
-# from groq import Groq
+    client = Groq(
+        api_key=os.environ.get("GROQ_API_KEY"),
+    )
 
-# client = Groq(
-#     api_key=os.environ.get("GROQ_API_KEY"),
-# )
+    chat_completion = client.models.list()
 
-# chat_completion = client.models.list()
+    print(chat_completion)
 
-# print(chat_completion)
 
-# --------------------------------
+def list_anthropic_models():
+    import anthropic
+    import os
+    from dotenv import load_dotenv
 
-import anthropic
-import os
-from dotenv import load_dotenv
+    load_dotenv()
 
-load_dotenv()
+    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
+    models = client.models.list()
+    print("Available Anthropic models:")
+    for model in models.data:
+        print(f"- {model.id}")
 
-client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
-models = client.models.list()
-print("Available Anthropic models:")
-for model in models.data:
-    print(f"- {model.id}")
 
-# --------------------------------
+def list_gemini_models():
+    import os
+    from google import genai
+    from dotenv import load_dotenv
 
-# import os
-# from google import genai
-# from dotenv import load_dotenv
+    load_dotenv()
 
-# load_dotenv()
+    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
 
-# client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
+    print("List of models that support generateContent:\n")
+    for m in client.models.list():
+        for action in m.supported_actions:
+            if action == "generateContent":
+                print(m.name)
 
-# print("List of models that support generateContent:\n")
-# for m in client.models.list():
-#     for action in m.supported_actions:
-#         if action == "generateContent":
-#             print(m.name)
+    print("List of models that support embedContent:\n")
+    for m in client.models.list():
+        for action in m.supported_actions:
+            if action == "embedContent":
+                print(m.name)
 
-# print("List of models that support embedContent:\n")
-# for m in client.models.list():
-#     for action in m.supported_actions:
-#         if action == "embedContent":
-#             print(m.name)
 
-# -------------------------------- deepseek
+def list_deepseek_models():
+    from openai import OpenAI
 
-# from openai import OpenAI
+    # for backward compatibility, you can still use `https://api.deepseek.com/v1` as `base_url`.
+    client = OpenAI(
+        api_key="sk-ds-3f422175ff114212a42d7107c3efd1e4",
+        base_url="https://api.deepseek.com",
+    )
+    print(client.models.list())
 
-# # for backward compatibility, you can still use `https://api.deepseek.com/v1` as `base_url`.
-# client = OpenAI(api_key="<your API key>", base_url="https://api.deepseek.com")
-# print(client.models.list())
 
-# -------------------------------- ollama
+def list_ollama_models():
+    import ollama
 
-import ollama
+    print(ollama.list())
 
-print(ollama.list())
+
+# Uncomment to run the functions
+# list_openai_models()
+# list_groq_models()
+# list_anthropic_models()
+# list_gemini_models()
+# list_deepseek_models()
+# list_ollama_models()
