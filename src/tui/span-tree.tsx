import React from 'react'
import { Box, Text } from 'ink'
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

export function SpanTree({ trace }: Props) {
  const tree = buildSpanTree(trace.spans)
  const flat = flattenTree(tree)

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">Trace </Text>
        <Text color="gray">{trace.traceId.slice(0, 16)}</Text>
        <Text color="gray">  </Text>
        <Text color="cyan">{formatDuration(trace.durationMs)}</Text>
        <Text color="gray">  {trace.spanCount} spans</Text>
      </Box>

      {flat.map((node) => {
        const indent = '  '.repeat(node.depth)
        const kind = spanKindLabel(node.span.kind)
        const color = statusColor(node.span.status.code)
        const bar = durationBar(node.span.durationMs, trace.durationMs)

        return (
          <Box key={node.span.spanId}>
            <Text>
              <Text color="gray">{indent}</Text>
              <Text color={color} bold>{node.span.name}</Text>
              <Text color="gray"> [{kind}] </Text>
              <Text color={color}>{bar} </Text>
              <Text color="cyan">{formatDuration(node.span.durationMs)}</Text>
              {node.span.serviceName !== trace.serviceName && (
                <Text color="magenta"> ({node.span.serviceName})</Text>
              )}
              {node.span.status.code === 2 && (
                <Text color="red" bold> ERR</Text>
              )}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
