import { parseArgs } from 'node:util'

import { startServer } from './server.js'

const USAGE = `
otel-dev — Local OpenTelemetry trace viewer

Usage:
  npx otel-dev              Start TUI trace viewer
  npx otel-dev --web        Start Web UI in browser
  npx otel-dev init         Generate OTel setup for your app
  npx otel-dev --help       Show this help

Options:
  --web         Open Web UI instead of TUI
  --port <n>    Port for OTLP receiver (default: 4318)
  -h, --help    Show help
`.trimStart()

const { values, positionals } = parseArgs({
  options: {
    web: { type: 'boolean', default: false },
    port: { type: 'string', default: '4318' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
})

if (values.help) {
  console.log(USAGE)
  process.exit(0)
}

const port = Number(values.port)

if (positionals[0] === 'init') {
  const { initProject } = await import('./init/templates.js')
  initProject()
} else if (values.web) {
  startServer(port)
  console.log(`\n  otel-dev running:\n`)
  console.log(`  OTLP receiver:  http://localhost:${port}/v1/traces`)
  console.log(`  Web UI:         http://localhost:${port}\n`)
} else {
  const { render } = await import('ink')
  const React = await import('react')
  const { App } = await import('./tui/app.js')

  startServer(port)
  render(React.createElement(App))
}
