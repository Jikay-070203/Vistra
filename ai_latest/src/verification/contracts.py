"""Constrain structured model references to this turn's evidence snapshot."""

from typing import Literal

from pydantic import Field, create_model

from src.schema.verification import AnswerBlock, BlockReview, EvidenceQuote, GroundedAnswer, SemanticReview


def reference_list(values):
    # An empty registry permits only an empty list, rather than a fabricated ID.
    values = tuple(sorted(set(values)))
    return (list[Literal[values]], Field()) if values else (list[str], Field(max_length=0))


def answer_contract(evidence):
    block = create_model("EvidenceBoundBlock", __base__=AnswerBlock,
        source_ids=reference_list(evidence["records"]), entity_ids=reference_list(evidence["entity_ids"]))
    return create_model("GroundedAnswer", __base__=GroundedAnswer, blocks=(list[block], Field()))


def review_contract(draft, evidence):
    quote = create_model("EvidenceBoundQuote", __base__=EvidenceQuote,
        source_id=(Literal[tuple(sorted(evidence["records"]))], Field()))
    block = create_model("EvidenceBoundReview", __base__=BlockReview,
        block_id=(Literal[tuple(item.block_id for item in draft.blocks)], Field()),
        evidence=(list[quote], Field()))
    return create_model("SemanticReview", __base__=SemanticReview, blocks=(list[block], Field()))
