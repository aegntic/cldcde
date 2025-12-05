# Code snippet of using thinking tokens

response = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=8192,
    thinking={
        "type": "enabled",
        "budget_tokens": 4000,
    },
    messages=[{"role": "user", "content": args.prompt}],
)