from contextvars import ContextVar
from time import perf_counter
from src.guardrails.policy import CredentialRedactor


class TurnProgress:
    def __init__(
        self,
        writer=None
    ):
        self.writer = writer
        self.activity = []
        self.started = {}
        self.tool_count = 0
        self.redactor = CredentialRedactor()


    def report(
        self,
        step: str,
        title: str,
        detail: str = "",
        status: str = "done",
        **data
    ):
        if status == "running":
            self.started[step] = perf_counter()

        event = self.redactor.data({
            "step": step, 
            "title": title, 
            "detail": detail, 
            "status": status, 
            **data
        })

        if status in {"done", "error", "skipped"} and step in self.started:
            event["seconds"] = round(perf_counter() - self.started.pop(step), 1)

        index = next((index for index, item in enumerate(self.activity) if item["step"] == step), None)

        if index is None:
            self.activity.append(event)
        else:
            self.activity[index] = event

        if self.writer is not None:
            self.writer(event)


_progress = ContextVar("chat_progress", default=None)


def progress(
    step: str,
    title: str,
    detail: str = "",
    status: str = "done",
    **data
):
    
    tracker = _progress.get()
    if tracker is not None:
        tracker.report(step, title, detail, status, **data)


def current_activity(
    *,
    snapshot: bool = True
) -> list[dict]:
    
    tracker = _progress.get()
    if tracker is None:
        return []
    return list(tracker.activity) if snapshot else tracker.activity
