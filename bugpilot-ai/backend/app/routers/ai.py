from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_current_user
from ..models import User
from ..schemas import AITestIn
from ..services.ai import AINotConfiguredError, AllProvidersFailedError, get_ai_manager, test_provider

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status")
def ai_status(_: User = Depends(get_current_user)):
    """Which providers are configured. Never returns keys."""
    return get_ai_manager().status()


@router.post("/test")
async def ai_test(data: AITestIn, _: User = Depends(get_current_user)):
    """Small connectivity check through the fallback chain."""
    try:
        result = await get_ai_manager().generate(
            [{"role": "user", "content": data.prompt}], max_tokens=64
        )
    except AINotConfiguredError as e:
        raise HTTPException(503, str(e))
    except AllProvidersFailedError as e:
        raise HTTPException(502, str(e))
    return {"text": result.text, "provider": result.provider, "model": result.model}


@router.get("/test/{provider}")
async def test_single_provider(provider: str, _: User = Depends(get_current_user)):
    """Test a single AI provider independently."""
    return await test_provider(provider)
