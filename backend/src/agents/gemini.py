import random
import time

import httpx
from fastapi import HTTPException
from google import genai
from google.genai import errors, types


def create_client(settings, *, http_client=None):
    """One SDK client per app lifespan; retries are bounded explicitly below."""
    return genai.Client(api_key=settings.gemini_api_key, vertexai=False,
                        http_options=types.HttpOptions(
                            timeout=30000, retry_options=types.HttpRetryOptions(attempts=1),
                            httpx_client=http_client))


def generate(settings, contents, instruction, *, tools=None, client=None, json_output=False):
    if not settings.gemini_api_key or not settings.gemini_model:
        raise HTTPException(503, "Cần cấu hình GEMINI_API_KEY và GEMINI_MODEL trên máy chủ để bật trợ lý.")
    config = {"system_instruction": instruction, "temperature": 0.2, "max_output_tokens": 4096,
              "automatic_function_calling": types.AutomaticFunctionCallingConfig(disable=True)}
    if tools:
        config["tools"] = [types.Tool(function_declarations=tools)]
    if json_output:
        config["response_mime_type"] = "application/json"
    owned = client is None
    sdk = client or create_client(settings)
    try:
        for attempt in range(3):
            try:
                response = sdk.models.generate_content(
                    model=settings.gemini_model,
                    contents=[types.Content.model_validate(c) for c in contents],
                    config=types.GenerateContentConfig(**config))
                break
            except errors.APIError as exc:
                if exc.code == 503 and attempt < 2:
                    time.sleep(2 ** (attempt + 1) + random.uniform(0, 1))
                    continue
                if exc.code in (401, 403):
                    raise HTTPException(503, "Google từ chối key Gemini hoặc quyền truy cập. Kiểm tra hoặc thay key trong .env rồi khởi động lại backend.") from None
                if exc.code == 503:
                    raise HTTPException(503, "Gemini đang quá tải sau 3 lần thử. Vui lòng thử lại sau khoảng 1 phút.",
                                        headers={"Retry-After": "60"}) from None
                if exc.code == 429:
                    raise HTTPException(429, "Gemini đã chạm giới hạn yêu cầu hoặc quota. Kiểm tra Google AI Studio.") from None
                if exc.code == 404:
                    raise HTTPException(503, "Model Gemini không khả dụng. Kiểm tra GEMINI_MODEL và quyền truy cập.") from None
                raise HTTPException(502, "Gemini từ chối yêu cầu. Vui lòng thử lại.") from None
        candidate = response.model_dump(mode="json", by_alias=True, exclude_none=True)["candidates"][0]
        if candidate.get("finishReason") not in (None, "STOP"):
            raise ValueError("Incomplete or blocked response")
        content = candidate["content"]
        if not isinstance(content.get("parts"), list) or not content["parts"]:
            raise ValueError("Missing content")
        if any(not isinstance(part, dict) or
               ("functionCall" in part and (not isinstance(part["functionCall"], dict) or
                not isinstance(part["functionCall"].get("name"), str))) for part in content["parts"]):
            raise ValueError("Invalid response parts")
        return content
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError, AttributeError):
        raise HTTPException(502, "Gemini chưa trả về kết quả hợp lệ. Vui lòng thử lại.") from None
    finally:
        if owned:
            sdk.close()
