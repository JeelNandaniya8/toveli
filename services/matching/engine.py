"""Dependency-free matching primitives for the future FastAPI service.

This module is tested locally, not connected to the deployed alpha. A real
embedding model must supply vectors with a fixed, versioned dimension.
"""
from dataclasses import dataclass
from math import sqrt, isfinite
from typing import Sequence


def normalized(vector: Sequence[float]) -> tuple[float, ...]:
    if not vector or any(not isfinite(x) for x in vector):
        raise ValueError('A finite nonempty vector is required')
    norm = sqrt(sum(x*x for x in vector))
    return tuple(x/norm for x in vector) if norm > 1e-12 else tuple(0.0 for _ in vector)


def cosine(a: Sequence[float], b: Sequence[float]) -> float:
    if len(a) != len(b):
        raise ValueError('Embedding dimensions differ')
    return max(0.0, min(1.0, sum(x*y for x,y in zip(normalized(a), normalized(b)))))


@dataclass(frozen=True)
class Signal:
    vector: tuple[float, ...]
    weight: float


def update_behavior(current: Sequence[float], signals: Sequence[Signal], decay: float = 0.9) -> tuple[float, ...]:
    """Only consented, non-sensitive positive signals reach this function.

    Dismissals should exclude items separately; they are not negative evidence
    about a person's values. Sentiment and private messages are never inputs.
    """
    if not 0 <= decay <= 1:
        raise ValueError('Decay must be in [0,1]')
    old = normalized(current)
    delta = [0.0]*len(old)
    total = 0.0
    for signal in signals:
        if len(signal.vector) != len(old):
            raise ValueError('Embedding dimensions differ')
        if not isfinite(signal.weight) or signal.weight < 0:
            raise ValueError('Weights must be finite and nonnegative')
        if signal.weight == 0:
            continue
        weight = min(signal.weight, 2.0)
        vector = normalized(signal.vector)
        if not any(vector):
            continue
        total += weight
        for i, value in enumerate(vector):
            delta[i] += weight*value
    if total == 0:
        return old
    candidate = normalized([decay*x+(1-decay)*d/total for x,d in zip(old,delta)])
    return candidate if any(candidate) else old


def effective_vector(declared: Sequence[float], behavior: Sequence[float], consent: bool, signal_count: int) -> tuple[float, ...]:
    if len(declared) != len(behavior):
        raise ValueError('Embedding dimensions differ')
    d, b = normalized(declared), normalized(behavior)
    if not consent or not any(b):
        return d
    alpha = min(0.3, max(0,signal_count)/100*0.3)
    return normalized([(1-alpha)*x+alpha*y for x,y in zip(d,b)])


def score(a: Sequence[float], b: Sequence[float], same_hub: bool, same_city: bool, same_intent: bool) -> dict[str,float]:
    parts = {'interest':0.5*cosine(a,b),'hub':0.3*(1 if same_hub else 0.5 if same_city else 0),'intent':0.2*int(same_intent)}
    return {**parts,'total':sum(parts.values())}
