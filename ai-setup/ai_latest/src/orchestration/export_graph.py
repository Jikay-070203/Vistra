"""Export the compiled chat graph without running a turn or opening providers."""

import argparse
from pathlib import Path

from src.orchestration.chat_orchestrator import ChatOrchestrator
from src.utils.utils import load_config, resolve_path


def _unused_service():
    raise RuntimeError("Graph export compiles the workflow without running agent nodes.")


def export_graph(output: str | Path, *, render_png: bool = False) -> Path:
    config = load_config()
    orchestrator = ChatOrchestrator(
        config=config,
        memory_store=None,
        max_messages=config["generation_history_messages"],
        generation_factory=_unused_service,
        search_factory=_unused_service,
        travel_tools_factory=_unused_service,
        checkpointer=None,
    )
    graph = orchestrator.graph.get_graph()
    png_path = resolve_path(output).with_suffix(".png")
    png_path.parent.mkdir(parents=True, exist_ok=True)
    mermaid_path = png_path.with_suffix(".mmd")
    mermaid_path.write_text(graph.draw_mermaid(), encoding="utf-8")
    if not render_png:
        return mermaid_path
    graph.draw_mermaid_png(output_file_path=str(png_path), max_retries=0)
    return png_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="docs/diagrams/current-flow.png")
    parser.add_argument("--png", action="store_true",
                        help="Also render PNG via mermaid.ink; this sends the graph structure to that external service.")
    args = parser.parse_args()
    print(export_graph(args.output, render_png=args.png))


if __name__ == "__main__":
    main()
