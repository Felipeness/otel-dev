import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const INSTRUMENT_TS = `import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'my-service', // TODO: change to your service name
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()
`

const DEPS = [
  '@opentelemetry/sdk-node',
  '@opentelemetry/exporter-trace-otlp-http',
  '@opentelemetry/auto-instrumentations-node',
  '@opentelemetry/resources',
  '@opentelemetry/semantic-conventions',
].join(' ')

export function initProject(): void {
  const filePath = join(process.cwd(), 'instrument.ts')

  if (existsSync(filePath)) {
    console.log('\n  instrument.ts already exists. Skipping.\n')
    return
  }

  writeFileSync(filePath, INSTRUMENT_TS, 'utf-8')

  console.log(`
  Created: instrument.ts

  Next steps:
    1. Install dependencies:
       npm install ${DEPS}

    2. Run your app with instrumentation:
       node --import ./instrument.ts your-app.ts

    3. Start otel-dev to see traces:
       npx otel-dev
`)
}
