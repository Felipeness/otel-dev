import React, { useState, useEffect } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import { getTraces, subscribe } from '../store.js'
import { Trace } from '../types.js'
import { TraceList } from './trace-list.js'
import { SpanTree } from './span-tree.js'

export function App() {
  const { exit } = useApp()
  const [traces, setTraces] = useState(getTraces())
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null)

  useEffect(() => {
    const unsub = subscribe(() => setTraces(getTraces()))
    return unsub
  }, [])

  useInput((input, key) => {
    if (input === 'q') exit()
    if (key.escape && selectedTrace) setSelectedTrace(null)
  })

  const totalSpans = traces.reduce((sum, t) => sum + t.spanCount, 0)

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="green">otel-dev</Text>
        <Text color="gray">  </Text>
        {traces.length === 0
          ? <Text color="yellow">Waiting for traces...</Text>
          : <Text color="white">{traces.length} traces ({totalSpans} spans)</Text>
        }
      </Box>

      {selectedTrace
        ? <SpanTree trace={selectedTrace} />
        : <TraceList traces={traces} onSelect={setSelectedTrace} />
      }

      <Box marginTop={1}>
        <Text color="gray">q: quit</Text>
        {selectedTrace && <Text color="gray">  esc: back</Text>}
      </Box>
    </Box>
  )
}
