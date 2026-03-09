import React, { useState, useEffect } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import { getTraces, getFilteredTraces, subscribe, clear } from '../store.js'
import { Trace } from '../types.js'
import { TraceList } from './trace-list.js'
import { SpanTree } from './span-tree.js'

export function App() {
  const { exit } = useApp()
  const [traces, setTraces] = useState(getTraces())
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const unsub = subscribe(() => setTraces(getTraces()))
    return unsub
  }, [])

  const filteredTraces = searchQuery
    ? getFilteredTraces(searchQuery)
    : traces

  useInput((input, key) => {
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false)
        setSearchQuery('')
        return
      }
      if (key.return) {
        setSearchMode(false)
        return
      }
      if (key.backspace || key.delete) {
        setSearchQuery(q => q.slice(0, -1))
        return
      }
      if (input && !key.ctrl && !key.meta) {
        setSearchQuery(q => q + input)
      }
      return
    }

    if (input === 'q') exit()
    if (key.escape) {
      if (selectedTrace) {
        setSelectedTrace(null)
      } else if (searchQuery) {
        setSearchQuery('')
      }
      return
    }
    if (input === '/' && !selectedTrace) {
      setSearchMode(true)
      return
    }
    if (input === 'c' && !selectedTrace) {
      clear()
      setSearchQuery('')
      return
    }
  })

  const totalSpans = filteredTraces.reduce((sum, t) => sum + t.spanCount, 0)

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="green">otel-dev</Text>
        <Text color="gray">  </Text>
        {traces.length === 0
          ? <Text color="yellow">Waiting for traces...</Text>
          : <Text color="white">{filteredTraces.length} traces ({totalSpans} spans)</Text>
        }
        {searchQuery && !searchMode && (
          <Text color="gray">  filtered by: <Text color="yellow">{searchQuery}</Text></Text>
        )}
      </Box>

      {searchMode && (
        <Box marginBottom={1}>
          <Text color="yellow">/ </Text>
          <Text>{searchQuery}</Text>
          <Text color="gray">_</Text>
        </Box>
      )}

      {selectedTrace
        ? <SpanTree trace={selectedTrace} />
        : <TraceList traces={filteredTraces} onSelect={setSelectedTrace} searchQuery={searchQuery} />
      }

      <Box marginTop={1}>
        <Text color="gray">
          {selectedTrace
            ? 'j/k: navigate  enter: detail  esc: back  q: quit'
            : 'j/k: navigate  enter: select  /: search  c: clear  q: quit  esc: back'
          }
        </Text>
      </Box>
    </Box>
  )
}
