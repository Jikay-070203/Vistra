import random
import time
import json
import logging

import httpx
from fastapi import HTTPException
from google import genai
from google.genai import errors, types


logger = logging.getLogger(__name__)


def _openai_messages(contents):
    messages = []
    for item in contents:
        role = "user" if item.get("role") == "user" else "assistant"
        text_parts, tool_calls, tool_results = [], [], []
        for part in item.get("parts", []):
            if "text" in part:
                text_parts.append(str(part["text"]))
            if "functionCall" in part:
                call = part["functionCall"]
                tool_calls.append({"id": part.get("id", f"call_{len(tool_calls)}"), "type": "function",
                                   "function": {"name": call.get("name"), "arguments": json.dumps(call.get("args", {}))}})
            if "functionResponse" in part:
                response = part["functionResponse"]
                tool_results.append({"role": "tool", "tool_call_id": response.get("id", ""),
                                     "content": json.dumps(response.get("response", {}), ensure_ascii=False)})
        message = {"role": role, "content": "\n".join(text_parts) or None}
        if tool_calls:
            # OpenAI requires the assistant tool-call message to immediately
            # precede the corresponding tool messages.
            message["tool_calls"] = tool_calls
            messages.append(message)
        if tool_results:
            messages.extend(tool_results)
        elif not tool_calls:
            messages.append(message)
    return messages


def _openai_schema(value):
    """Convert the Gemini tool schema spelling to OpenAI JSON Schema."""
    if isinstance(value, dict):
        return {key: (_openai_schema(item).lower() if key == "type" and isinstance(item, str)
                      else _openai_schema(item)) for key, item in value.items()}
    if isinstance(value, list):
        return [_openai_schema(item) for item in value]
    return value


def _generate_openai(settings, contents, instruction, *, tools=None, json_output=False):
    if not settings.openai_api_key or not settings.openai_model:
        raise HTTPException(503, "Cần cấu hình OpenAI provider, API key và model.")
    payload = {"model": settings.openai_model, "messages": [{"role": "system", "content": instruction},
              *_openai_messages(contents)], "temperature": 0.2, "max_tokens": 4096}
    if tools:
        payload["tools"] = [{"type": "function", "function": {"name": tool["name"],
                         "description": tool.get("description", ""),
                         "parameters": _openai_schema(tool.get("parameters", {}))}}
                         for tool in tools]
    if json_output:
        payload["response_format"] = {"type": "json_object"}
    try:
        response = httpx.post("https://api.openai.com/v1/chat/completions", headers={
            "Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"},
            json=payload, timeout=30)
        if response.status_code in (401, 403):
            raise HTTPException(503, "OpenAI từ chối API key hoặc quyền truy cập.")
        if response.status_code == 429:
            raise HTTPException(429, "OpenAI đã chạm giới hạn quota.")
        if response.is_error:
            logger.warning("OpenAI chat request failed: status=%s body=%s", response.status_code,
                           response.text[:1000])
        response.raise_for_status()
        message = response.json()["choices"][0]["message"]
        parts = []
        if message.get("content"):
            parts.append({"text": message["content"]})
        for call in message.get("tool_calls", []):
            parts.append({"id": call["id"], "functionCall": {"name": call["function"]["name"],
                         "args": json.loads(call["function"].get("arguments", "{}"))}})
        return {"role": "model", "parts": parts}
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        logger.warning("OpenAI chat response was invalid: status=%s", response.status_code)
        if True:
                raise HTTPException(502, "OpenAI không chấp nhận yêu cầu hội thoại. Kiểm tra model, key hoặc quota.") from None


def create_client(settings, *, http_client=None):
    """One SDK client per app lifespan; retries are bounded explicitly below."""
    return genai.Client(api_key=settings.gemini_api_key, vertexai=False,
                        http_options=types.HttpOptions(
                            timeout=30000, retry_options=types.HttpRetryOptions(attempts=1),
                            httpx_client=http_client))


def generate(settings, contents, instruction, *, tools=None, client=None, json_output=False):
    if getattr(settings, "ai_provider", "gemini") == "openai":
        return _generate_openai(settings, contents, instruction, tools=tools, json_output=json_output)
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
                logger.warning("Gemini API rejected chat request: code=%s message=%s", exc.code, exc)
                raise HTTPException(502, "Gemini từ chối yêu cầu hội thoại. Vui lòng thử lại.") from None
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
