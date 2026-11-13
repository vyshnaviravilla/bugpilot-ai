from abc import ABC, abstractmethod

import httpx

QUOTA_HINTS = ("quota", "credit", "billing", "insufficient", "exhausted", "payment")


class ProviderError(Exception):
    """A failure from one provider. `retryable` means retrying the same provider may help."""

    def __init__(self, provider: str, message: str, *, kind: str = "unknown",
                 retryable: bool = False, retry_after: float | None = None):
        super().__init__(message)
        self.provider = provider
        self.kind = kind  # rate_limit | quota | server | timeout | network | auth | bad_request | bad_response
        self.retryable = retryable
        self.retry_after = retry_after


class AIProvider(ABC):
    name = "base"

    def __init__(self, api_key: str, model: str, timeout: float):
        self.api_key = api_key.strip()
        self.model = model.strip()
        self.timeout = timeout

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.model)

    @abstractmethod
    async def generate(self, messages: list[dict], *, temperature: float = 0.2,
                       max_tokens: int = 1024) -> str:
        """messages: [{"role": "system"|"user"|"assistant", "content": str}]"""

    async def _post(self, url: str, *, headers: dict, json: dict) -> dict:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, headers=headers, json=json)
        except httpx.TimeoutException:
            raise ProviderError(self.name, "Request timed out", kind="timeout", retryable=True)
        except httpx.HTTPError as e:
            raise ProviderError(self.name, f"Network error ({type(e).__name__})", kind="network", retryable=True)
        if resp.status_code >= 400:
            raise self._http_error(resp)
        try:
            return resp.json()
        except ValueError:
            raise ProviderError(self.name, "Provider returned invalid JSON", kind="bad_response", retryable=True)

    def _http_error(self, resp: httpx.Response) -> ProviderError:
        code = resp.status_code
        body = resp.text[:300].lower()
        retry_after = None
        try:
            retry_after = float(resp.headers.get("retry-after", ""))
        except ValueError:
            pass
        if code == 402 or (code == 429 and any(h in body for h in QUOTA_HINTS)):
            return ProviderError(self.name, "Credits or quota exhausted. Check your provider account.", kind="quota", retryable=False)
        if code == 429:
            return ProviderError(self.name, "Rate limited. Will retry with backoff.", kind="rate_limit", retryable=True, retry_after=retry_after)
        if code in (408, 409) or code >= 500:
            return ProviderError(self.name, f"Provider server error (HTTP {code}). Will retry.", kind="server", retryable=True, retry_after=retry_after)
        if code in (401, 403):
            return ProviderError(self.name, "Authentication failed. Check your API key.", kind="auth", retryable=False)
        if code == 404:
            return ProviderError(self.name, f"Model not found (HTTP {code}). Check the model name in .env.", kind="bad_request", retryable=False)
        return ProviderError(self.name, f"Request rejected (HTTP {code}). Check the model name and API key.", kind="bad_request", retryable=False)
