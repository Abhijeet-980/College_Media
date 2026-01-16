const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const logger = require('../utils/logger'); // Assuming this exists

const JAEGER_ENDPOINT = process.env.JAEGER_ENDPOINT || 'http://localhost:4318/v1/traces';

// Initialize the SDK
const sdk = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'college-media-backend',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter: new OTLPTraceExporter({
        // OTLP Trace endpoint (Jaeger accepts OTLP over HTTP on 4318)
        url: JAEGER_ENDPOINT,
    }),
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': { enabled: false },
            '@opentelemetry/instrumentation-net': { enabled: false },
            '@opentelemetry/instrumentation-http': {
                ignoreIncomingPaths: ['/metrics', '/health'] // Ignore noisy endpoints
            }
        })
    ],
});

// Start the SDK
try {
    sdk.start();
    // Using console here because logger might not be fully ready globally or recursing? 
    // But using imported logger for consistency.
    logger.info('🔭 OpenTelemetry Tracing Initialized');
} catch (error) {
    console.error('Failed to initialize OpenTelemetry:', error);
}

// Graceful Custom Shutdown
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => process.exit(0));
});

module.exports = sdk;
