import React, { useState, useMemo } from 'react'
import { Box, Text, useInput } from 'ink'
import { Trace, Span, spanKindLabel } from '../types.js'

type Props = {
  trace: Trace
}

type TreeNode = {
  span: Span
  children: TreeNode[]
  depth: number
}

function buildSpanTree(spans: Span[]): TreeNode[] {
  const byParent = new Map<string, Span[]>()

  for (const span of spans) {
    const parentId = span.parentSpanId ?? ''
    const group = byParent.get(parentId)
    if (group) group.push(span)
    else byParent.set(parentId, [span])
  }

  function buildChildren(parentId: string, depth: number): TreeNode[] {
    const children = byParent.get(parentId) ?? []
    return children
      .sort((a, b) => a.startTimeMs - b.startTimeMs)
      .map(span => ({
        span,
        depth,
        children: buildChildren(span.spanId, depth + 1),
      }))
  }

  const roots = byParent.get('') ?? []
  const orphans = spans.filter(s => !s.parentSpanId && !roots.includes(s))
  const allRoots = [...roots, ...orphans]

  return allRoots
    .sort((a, b) => a.startTimeMs - b.startTimeMs)
    .map(span => ({
      span,
      depth: 0,
      children: buildChildren(span.spanId, 1),
    }))
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []
  for (const node of nodes) {
    result.push(node)
    result.push(...flattenTree(node.children))
  }
  return result
}

function statusColor(code: number): string {
  if (code === 1) return 'green'
  if (code === 2) return 'red'
  return 'gray'
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const BAR_MAX_WIDTH = 30

function durationBar(spanMs: number, traceMs: number): string {
  if (traceMs === 0) return ''
  const width = Math.max(1, Math.round((spanMs / traceMs) * BAR_MAX_WIDTH))
  return '\u2588'.repeat(width)
}

function SpanDetail({ span }: { span: Span }) {
  const attrEntries = Object.entries(span.attributes)
  const hasStatus = span.status.message
  const hasEvents = span.events.length > 0
  const hasAttrs = attrEntries.length > 0

  if (!hasAttrs && !hasEvents && !hasStatus) {
    return (
      <Box marginLeft={2} marginBottom={1}>
        <Text color="gray" italic>No attributes, events, or status message.</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" marginLeft={2} marginBottom={1}>
      {hasStatus && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">Status</Text>
          <Text color="gray">  message=</Text>
          <Text color="white">{span.status.message}</Text>
        </Box>
      )}

      {hasAttrs && (
        <Box flexDirection="column" marginBottom={hasEvents ? 1 : 0}>
          <Text bold color="yellow">Attributes</Text>
          {attrEntries.map(([key, value]) => (
            <Box key={key}>
              <Text color="gray">  {key}</Text>
              <Text color="white">=</Text>
              <Text color="cyan">{String(value)}</Text>
            </Box>
          ))}
        </Box>
      )}

      {hasEvents && (
        <Box flexDirection="column">
          <Text bold color="yellow">Events</Text>
          {span.events.map((event, i) => {
            const eventAttrs = Object.entries(event.attributes)
            return (
              <Box key={`${event.name}-${i}`} flexDirection="column">
                <Box>
                  <Text color="gray">  </Text>
                  <Text color="magenta" bold>{event.name}</Text>
                </Box>
                {eventAttrs.map(([key, value]) => (
                  <Box key={key}>
                    <Text color="gray">    {key}</Text>
                    <Text color="white">=</Text>
                    <Text color="cyan">{String(value)}</Text>
                  </Box>
                ))}
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

export function SpanTree({ trace }: Props) {
  const [cursor, setCursor] = useState(0)
  const [expandedSpanId, setExpandedSpanId] = useState<string | null>(null)

  const flat = useMemo(() => {
    const tree = buildSpanTree(trace.spans)
    return flattenTree(tree)
  }, [trace.spans])

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setCursor(c => Math.max(0, c - 1))
    }
    if (key.downArrow || input === 'j') {
      setCursor(c => Math.min(flat.length - 1, c + 1))
    }
    if (key.return && flat.length > 0) {
      const currentSpanId = flat[cursor]!.span.spanId
      setExpandedSpanId(prev => prev === currentSpanId ? null : currentSpanId)
    }
  })

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">Trace </Text>
        <Text color="gray">{trace.traceId.slice(0, 16)}</Text>
        <Text color="gray">  </Text>
        <Text color="cyan">{formatDuration(trace.durationMs)}</Text>
        <Text color="gray">  {trace.spanCount} spans</Text>
      </Box>

      {flat.map((node, i) => {
        const selected = i === cursor
        const expanded = expandedSpanId === node.span.spanId
        const indent = '  '.repeat(node.depth)
        const kind = spanKindLabel(node.span.kind)
        const color = statusColor(node.span.status.code)
        const bar = durationBar(node.span.durationMs, trace.durationMs)

        return (
          <Box key={node.span.spanId} flexDirection="column">
            <Box>
              <Text inverse={selected}>
                <Text color="gray">{indent}</Text>
                <Text color={selected ? undefined : color} bold>{node.span.name}</Text>
                <Text color="gray"> [{kind}] </Text>
                <Text color={selected ? undefined : color}>{bar} </Text>
                <Text color="cyan">{formatDuration(node.span.durationMs)}</Text>
                {node.span.serviceName !== trace.serviceName && (
                  <Text color="magenta"> ({node.span.serviceName})</Text>
                )}
                {node.span.status.code === 2 && (
                  <Text color="red" bold> ERR</Text>
                )}
                {selected && <Text color="gray"> {expanded ? '\u25BC' : '\u25B6'}</Text>}
              </Text>
            </Box>
            {expanded && <SpanDetail span={node.span} />}
          </Box>
        )
      })}
    </Box>
  )
}
