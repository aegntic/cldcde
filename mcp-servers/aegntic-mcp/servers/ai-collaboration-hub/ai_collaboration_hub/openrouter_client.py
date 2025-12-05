"""
AI Collaboration Hub - OpenRouter Client
Created by: Mattae Cooper <human@mattaecooper.org> and '{ae}'aegntic.ai <contact@aegntic.ai>
License: Dual License (Free for non-commercial use, commercial license required)
"""
import os
from typing import Optional
import httpx
from .types import GeminiConfig


class OpenRouterClient:
    def __init__(self, config: Optional[GeminiConfig] = None):
        self.config = config or GeminiConfig()
        self.api_key = self.config.api_key or os.getenv("OPENROUTER_API_KEY")
        
        if not self.api_key:
            raise ValueError("OpenRouter API key required. Set OPENROUTER_API_KEY env var.")

    async def send_message(self, content: str, context: Optional[str] = None) -> str:
        """Send message to Gemini via OpenRouter API"""
        async with httpx.AsyncClient() as client:
            messages = []
            
            if context:
                messages.append({"role": "system", "content": f"Context: {context}"})
            
            messages.append({"role": "user", "content": content})

            payload = {
                "model": self.config.model,
                "messages": messages,
                "max_tokens": self.config.max_tokens
            }

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ai-collaboration-hub.local",
                "X-Title": "AI Collaboration Hub"
            }

            try:
                response = await client.post(
                    f"{self.config.base_url}/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=60.0
                )
                response.raise_for_status()
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
            except httpx.HTTPError as e:
                raise Exception(f"Failed to communicate with Gemini: {e}")

    async def test_connection(self) -> bool:
        """Test OpenRouter API connection"""
        try:
            await self.send_message("Hello, this is a connection test.")
            return True
        except Exception:
            return False