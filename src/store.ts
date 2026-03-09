import type { Span, Trace } from "./types.js";
import { groupSpansByTrace } from "./types.js";

const MAX_SPANS = 1000;

type Listener = (spans: readonly Span[]) => void;

// Module-level state (singleton)
const spans: Span[] = [];
const listeners = new Set<Listener>();

export function addSpans(newSpans: Span[]): void {
  spans.push(...newSpans);

  if (spans.length > MAX_SPANS) {
    spans.splice(0, spans.length - MAX_SPANS);
  }

  for (const listener of listeners) {
    listener(spans);
  }
}

export function getSpans(): readonly Span[] {
  return spans;
}

export function getTraces(): Trace[] {
  return groupSpansByTrace([...spans]);
}

export function getFilteredTraces(query: string): Trace[] {
  const traces = getTraces();
  if (!query) return traces;

  const q = query.toLowerCase();
  return traces.filter((trace) =>
    trace.traceId.toLowerCase().includes(q) ||
    trace.serviceName.toLowerCase().includes(q) ||
    trace.spans.some((span) => span.name.toLowerCase().includes(q)),
  );
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clear(): void {
  spans.length = 0;
  for (const listener of listeners) {
    listener(spans);
  }
}
