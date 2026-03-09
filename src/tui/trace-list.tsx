import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { Trace } from '../types.js'

type Props = {
  traces: Trace[]
  onSelect: (trace: Trace) => void
}

const SERVICE_COLORS = ['cyan', 'magenta', 'yellow', 'blue', 'green', 'red', 'white'] as const

function serviceColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return SERVICE_COLORS[Math.abs(hash) % SERVICE_COLORS.length]!
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatAgo(startTimeMs: number): string {
  const diff = Date.now() - startTimeMs
  if (diff < 1000) return 'now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}

const MAX_VISIBLE = 20

export function TraceList({ traces, onSelect }: Props) {
  const [cursor, setCursor] = useState(0)

  useInput((_input, key) => {
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    if (key.downArrow) setCursor(c => Math.min(traces.length - 1, c + 1))
    if (key.return && traces.length > 0) onSelect(traces[cursor]!)
  })

  if (traces.length === 0) {
    return (
      <Box>
        <Text color="gray">No traces received yet.</Text>
      </Box>
    )
  }

  const scrollOffset = Math.max(0, Math.min(cursor - Math.floor(MAX_VISIBLE / 2), traces.length - MAX_VISIBLE))
  const visible = traces.slice(scrollOffset, scrollOffset + MAX_VISIBLE)

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="gray">
          {'  SERVICE              OPERATION                    DURATION  SPANS  STATUS  AGO'}
        </Text>
      </Box>

      {visible.map((trace, i) => {
        const idx = scrollOffset + i
        const selected = idx === cursor

        return (
          <Box key={trace.traceId}>
            <Text inverse={selected}>
              <Text color={selected ? undefined : serviceColor(trace.serviceName)}>
                {` ${trace.serviceName.padEnd(20).slice(0, 20)} `}
              </Text>
              <Text>{trace.rootSpan.name.padEnd(28).slice(0, 28)}  </Text>
              <Text color="cyan">{formatDuration(trace.durationMs).padStart(8)}  </Text>
              <Text>{String(trace.spanCount).padStart(5)}  </Text>
              {trace.hasError
                ? <Text color="red" bold>{'ERR'.padEnd(6)}</Text>
                : <Text color="green">{'OK'.padEnd(6)}</Text>
              }
              <Text color="gray">{formatAgo(trace.rootSpan.startTimeMs)}</Text>
            </Text>
          </Box>
        )
      })}

      {traces.length > MAX_VISIBLE && (
        <Box marginTop={1}>
          <Text color="gray">
            Showing {scrollOffset + 1}-{Math.min(scrollOffset + MAX_VISIBLE, traces.length)} of {traces.length}
          </Text>
        </Box>
      )}
    </Box>
  )
}
