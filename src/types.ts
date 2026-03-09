// ── OTLP/JSON wire types (POST /v1/traces) ──────────────────────────

export type SpanKind = 0 | 1 | 2 | 3 | 4 | 5;
// 0=UNSPECIFIED, 1=INTERNAL, 2=SERVER, 3=CLIENT, 4=PRODUCER, 5=CONSUMER

export type StatusCode = 0 | 1 | 2;
// 0=UNSET, 1=OK, 2=ERROR

export type KeyValue = {
  key: string;
  value: {
    stringValue?: string;
    intValue?: string;
    doubleValue?: number;
    boolValue?: boolean;
  };
};

export type SpanEvent = {
  name: string;
  timeUnixNano: string;
  attributes: KeyValue[];
};

export type OtlpSpan = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: KeyValue[];
  status: { code: StatusCode; message?: string };
  events: SpanEvent[];
};

export type ScopeSpans = {
  scope: { name: string; version?: string };
  spans: OtlpSpan[];
};

export type ResourceSpans = {
  resource: { attributes: KeyValue[] };
  scopeSpans: ScopeSpans[];
};

export type OtlpExportRequest = {
  resourceSpans: ResourceSpans[];
};

// ── Internal processed types ─────────────────────────────────────────

export type Span = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTimeMs: number;
  durationMs: number;
  serviceName: string;
  attributes: Record<string, string | number | boolean>;
  status: { code: StatusCode; message?: string };
  events: {
    name: string;
    timeMs: number;
    attributes: Record<string, string | number | boolean>;
  }[];
};

export type Trace = {
  traceId: string;
  rootSpan: Span;
  spans: Span[];
  durationMs: number;
  spanCount: number;
  serviceName: string;
  hasError: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────

const SPAN_KIND_LABELS: Record<SpanKind, string> = {
  0: "UNSPECIFIED",
  1: "INTERNAL",
  2: "SERVER",
  3: "CLIENT",
  4: "PRODUCER",
  5: "CONSUMER",
} as const;

export function spanKindLabel(kind: SpanKind): string {
  return SPAN_KIND_LABELS[kind];
}

function flattenAttributes(
  attrs: KeyValue[],
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const { key, value } of attrs) {
    if (value.stringValue !== undefined) result[key] = value.stringValue;
    else if (value.intValue !== undefined) result[key] = Number(value.intValue);
    else if (value.doubleValue !== undefined) result[key] = value.doubleValue;
    else if (value.boolValue !== undefined) result[key] = value.boolValue;
  }
  return result;
}

function nanoToMs(nano: string): number {
  return Number(BigInt(nano) / 1_000_000n);
}

function extractServiceName(attributes: KeyValue[]): string {
  const attr = attributes.find((a) => a.key === "service.name");
  return attr?.value.stringValue ?? "unknown";
}

export function parseOtlpRequest(req: OtlpExportRequest): Span[] {
  const spans: Span[] = [];

  for (const rs of req.resourceSpans) {
    const serviceName = extractServiceName(rs.resource.attributes);

    for (const ss of rs.scopeSpans) {
      for (const otlp of ss.spans) {
        const startTimeMs = nanoToMs(otlp.startTimeUnixNano);
        const endTimeMs = nanoToMs(otlp.endTimeUnixNano);

        spans.push({
          traceId: otlp.traceId,
          spanId: otlp.spanId,
          parentSpanId: otlp.parentSpanId || undefined,
          name: otlp.name,
          kind: otlp.kind,
          startTimeMs,
          durationMs: endTimeMs - startTimeMs,
          serviceName,
          attributes: flattenAttributes(otlp.attributes),
          status: otlp.status,
          events: otlp.events.map((e) => ({
            name: e.name,
            timeMs: nanoToMs(e.timeUnixNano),
            attributes: flattenAttributes(e.attributes),
          })),
        });
      }
    }
  }

  return spans;
}

export function groupSpansByTrace(spans: Span[]): Trace[] {
  const byTrace = new Map<string, Span[]>();

  for (const span of spans) {
    const group = byTrace.get(span.traceId);
    if (group) group.push(span);
    else byTrace.set(span.traceId, [span]);
  }

  const traces: Trace[] = [];

  for (const [traceId, traceSpans] of byTrace) {
    traceSpans.sort((a, b) => a.startTimeMs - b.startTimeMs);

    const rootSpan =
      traceSpans.find((s) => !s.parentSpanId) ?? traceSpans[0]!;

    const earliest = traceSpans[0]!.startTimeMs;
    const latest = Math.max(...traceSpans.map((s) => s.startTimeMs + s.durationMs));

    traces.push({
      traceId,
      rootSpan,
      spans: traceSpans,
      durationMs: latest - earliest,
      spanCount: traceSpans.length,
      serviceName: rootSpan.serviceName,
      hasError: traceSpans.some((s) => s.status.code === 2),
    });
  }

  traces.sort((a, b) => b.rootSpan.startTimeMs - a.rootSpan.startTimeMs);
  return traces;
}
