from .openai_compat import OpenAICompatProvider


class OllamaProvider(OpenAICompatProvider):
    """Local Ollama server using its OpenAI-compatible chat endpoint."""

    name = "ollama"

    def __init__(self, base_url: str, model: str, timeout: float):
        super().__init__("", model, timeout)
        self.base_url = base_url.rstrip("/")

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.model)

    async def generate(self, messages, *, temperature=0.2, max_tokens=1024) -> str:
        return await super().generate(messages, temperature=temperature, max_tokens=max_tokens)
