from .base import AIProvider, ProviderError


class OpenAICompatProvider(AIProvider):
    """Shared by providers that expose an OpenAI-style /chat/completions API."""

    base_url = ""
    extra_headers: dict = {}

    async def generate(self, messages, *, temperature=0.2, max_tokens=1024) -> str:
        headers = {**self.extra_headers}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        data = await self._post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json={"model": self.model, "messages": messages,
                  "temperature": temperature, "max_tokens": max_tokens},
        )
        if not data.get("choices") and isinstance(data.get("error"), dict):
            # Some gateways return HTTP 200 with an error body.
            code = data["error"].get("code")
            kind = "quota" if code == 402 else "rate_limit" if code == 429 else "server"
            raise ProviderError(self.name, f"Provider error ({code})", kind=kind,
                                retryable=code in (408, 429, 500, 502, 503, 504))
        try:
            text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            text = None
        if not text:
            raise ProviderError(self.name, "Empty response from provider", kind="bad_response", retryable=True)
        return text.strip()
