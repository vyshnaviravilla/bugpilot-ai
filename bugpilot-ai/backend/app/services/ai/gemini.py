from .base import AIProvider, ProviderError

BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiProvider(AIProvider):
    name = "gemini"

    async def generate(self, messages, *, temperature=0.2, max_tokens=1024) -> str:
        system = "\n\n".join(m["content"] for m in messages if m["role"] == "system")
        contents = [
            {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
            for m in messages if m["role"] != "system"
        ]
        payload = {
            "contents": contents,
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}
        data = await self._post(
            f"{BASE}/{self.model}:generateContent",
            headers={"x-goog-api-key": self.api_key},  # header, so the key never lands in a URL/log
            json=payload,
        )
        try:
            parts = data["candidates"][0]["content"]["parts"]
            text = "".join(p.get("text", "") for p in parts)
        except (KeyError, IndexError, TypeError):
            text = ""
        if not text.strip():
            raise ProviderError(self.name, "Empty or blocked response", kind="bad_response", retryable=False)
        return text.strip()
