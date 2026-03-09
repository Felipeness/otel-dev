import http from 'node:http'

import type { OtlpExportRequest } from './types.js'
import { parseOtlpRequest } from './types.js'
import { addSpans, clear, getFilteredTraces, subscribe } from './store.js'
import { serveHtml } from './web/handler.js'

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const

function json(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    ...CORS_HEADERS,
  })
  res.end(payload)
}

async function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  if (url.pathname === '/v1/traces' && req.method === 'POST') {
    try {
      const body = await readBody(req)
      const payload = JSON.parse(body) as OtlpExportRequest
      const spans = parseOtlpRequest(payload)
      addSpans(spans)
      json(res, 200, {})
    } catch {
      json(res, 400, { error: 'Invalid JSON payload' })
    }
    return
  }

  if (url.pathname === '/v1/traces' && req.method === 'GET') {
    const q = url.searchParams.get('q') ?? ''
    json(res, 200, getFilteredTraces(q))
    return
  }

  if (url.pathname === '/v1/traces' && req.method === 'DELETE') {
    clear()
    json(res, 200, {})
    return
  }

  if (url.pathname === '/sse' && req.method === 'GET') {
    const q = url.searchParams.get('q') ?? ''
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...CORS_HEADERS,
    })

    const send = (): void => {
      res.write(`data: ${JSON.stringify(getFilteredTraces(q))}\n\n`)
    }

    send()
    const unsubscribe = subscribe(send)

    req.on('close', () => {
      unsubscribe()
    })
    return
  }

  if (url.pathname === '/' && req.method === 'GET') {
    serveHtml(res)
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json', ...CORS_HEADERS })
  res.end(JSON.stringify({ error: 'Not found' }))
}

export function startServer(port: number): void {
  const server = http.createServer(handler)
  server.listen(port, () => {
    console.log(`OTLP receiver listening on http://localhost:${port}`)
  })
}
