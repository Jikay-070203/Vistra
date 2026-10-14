"""Observable application tool calls, with no request bodies or credentials."""

from contextlib import contextmanager
from contextvars import ContextVar
from datetime import datetime, timezone
from functools import wraps

from src.orchestration.progress import _progress


_agent = ContextVar("tool_agent", default=None)
_call = ContextVar("active_tool_call", default=None)


@contextmanager
def agent_activity(name: str):
    token = _agent.set(name)
    try:
        yield
    finally:
        _agent.reset(token)


class ToolCall:
    def __init__(self, tracker, name: str, operation: str, agent: str | None):
        tracker.tool_count += 1
        self.tracker = tracker
        self.step = f"tool_{tracker.tool_count}"
        self.name, self.operation = name, operation
        self.fields = {"kind": "tool", "tool_name": name, "operation": operation,
                       "agent": agent or _agent.get(), "call_number": tracker.tool_count,
                       "started_at": datetime.now(timezone.utc).isoformat()}

    def report(self, status: str):
        self.fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.tracker.report(self.step, f"{self.name} · {self.operation}", status=status, **self.fields)


@contextmanager
def tool_call(name: str, operation: str, *, agent: str | None = None):
    tracker = _progress.get()
    if tracker is None:
        yield None
        return
    call = ToolCall(tracker, name, operation, agent)
    token = _call.set(call)
    agent_token = _agent.set(agent) if agent is not None else None
    try:
        call.report("running")
        try:
            yield call
        except Exception:
            # Provider exception messages can contain URLs, request data or credentials.
            call.report("skipped" if call.fields.get("skipped_reason") else "error")
            raise
        else:
            call.report("skipped" if call.fields.get("skipped_reason") else "done")
    finally:
        _call.reset(token)
        if agent_token is not None:
            _agent.reset(agent_token)


def tool_metadata(*, cache_hit: bool | None = None, http_status: int | None = None,
                  execution: str | None = None, skipped_reason: str | None = None):
    """Only explicitly allowed transport metadata may enter the activity stream."""
    call = _call.get()
    if call is not None:
        if cache_hit is not None:
            call.fields["cache_hit"] = cache_hit
            call.fields["execution"] = "cache" if cache_hit else "network"
        if http_status is not None:
            call.fields["http_status"] = http_status
        if execution in {"local", "network", "cache"}:
            call.fields["execution"] = execution
        if skipped_reason is not None:
            call.fields["skipped_reason"] = skipped_reason


def tracked_tool(name: str, operation, *, agent: str | None = None):
    def decorate(function):
        @wraps(function)
        def invoke(*args, **kwargs):
            # Outside a chat turn, indexing and utilities keep their original behavior.
            if _progress.get() is None:
                return function(*args, **kwargs)
            label = operation(*args, **kwargs) if callable(operation) else operation
            with tool_call(name, label, agent=agent):
                return function(*args, **kwargs)
        return invoke
    return decorate
