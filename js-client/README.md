# FlashIO Log Analysis JavaScript Client

A comprehensive JavaScript client library for interacting with the FlashIO Log Analysis API. This library provides easy-to-use methods for querying logs, setting up alerts, detecting anomalies, correlating logs across services, and monitoring system performance.

## Features

- 🔍 **Natural Language Queries**: Query your logs using natural language with AI-powered analysis
- 🚨 **Alert Management**: Create, manage, and monitor alert rules for critical patterns
- 🔍 **Anomaly Detection**: Real-time anomaly detection with configurable sensitivity
- 🔗 **Log Correlation**: Correlate logs across services and trace request flows
- 📊 **Performance Metrics**: Comprehensive metrics and dashboard data
- 📈 **Trend Analysis**: Analyze trends and patterns in your log data
- 🛡️ **Error Handling**: Robust error handling with detailed error information
- 🔐 **Secure Authentication**: API key-based authentication

## Installation

```bash
npm install @flashio/log-analysis-client
```

## Quick Start

```javascript
import FlashIOClient from '@flashio/log-analysis-client';

// Initialize the client
const client = new FlashIOClient({
  apiKey: 'your-api-key-here',
  baseURL: 'http://localhost:8000', // Your FlashIO API URL
  timeout: 30000
});

// Test connection
const health = await client.testConnection();
console.log('Connected:', health.success);

// Query logs using natural language
const result = await client.queries.queryLogs({
  query: 'Show me all errors from the payment service in the last hour',
  max_logs: 50
});

console.log('Analysis:', result.analysis);
console.log('Found logs:', result.logs.length);
```

## Configuration

### Client Options

```javascript
const client = new FlashIOClient({
  apiKey: 'your-api-key-here',    // Required: Your API key
  baseURL: 'http://localhost:8000', // Optional: API base URL
  timeout: 30000                    // Optional: Request timeout in ms
});
```

### Environment Variables

You can also set configuration through environment variables:

```bash
FLASHIO_API_KEY=your-api-key-here
FLASHIO_BASE_URL=http://localhost:8000
```

## API Reference

### Queries

Query and analyze logs using natural language:

```javascript
// Query logs
const result = await client.queries.queryLogs({
  query: 'Find payment errors in the last hour',
  max_logs: 100,
  analysis_focus: 'error patterns',
  include_context: true
});

// Get system insights
const insights = await client.queries.getInsights();

// Summarize logs
const summary = await client.queries.summarizeLogs(logs, 'error analysis');

// Set AI model
await client.queries.setModel({
  model_id: 'gpt-4',
  provider: 'openai'
});
```

### Alerts

Create and manage alert rules:

```javascript
// Create an alert rule
await client.alerts.createRule({
  name: 'Payment Errors',
  pattern: 'payment.*error|failed.*payment',
  severity: 'high',
  threshold: 5,
  time_window: 300,
  enabled: true
});

// Check logs against alert rules
const alertCheck = await client.alerts.checkAlerts(logs);

// Get active alerts
const activeAlerts = await client.alerts.getActiveAlerts('critical');

// Acknowledge an alert
await client.alerts.acknowledgeAlert('alert-id');

// Get alert summary
const summary = await client.alerts.getSummary();
```

### Anomaly Detection

Detect anomalies in your log data:

```javascript
// Configure anomaly detection
await client.anomalies.updateConfig({
  enabled: true,
  sensitivity: 0.8,
  time_window: 3600,
  min_samples: 10,
  detection_methods: ['volume', 'pattern', 'timing']
});

// Analyze logs for anomalies
const analysis = await client.anomalies.analyzeLogs(logs, true);

// Get detected anomalies
const anomalies = await client.anomalies.getDetected({
  severity: 'high',
  limit: 20
});

// Start real-time monitoring
await client.anomalies.startMonitoring();

// Get anomaly report
const report = await client.anomalies.getReport();
```

### Log Correlation

Correlate logs across services:

```javascript
// Analyze log correlations
const correlation = await client.correlation.analyzeLogs({
  primary_logs: logs,
  time_window: 300,
  correlation_fields: ['user_id', 'request_id', 'session_id'],
  include_cross_service: true
});

// Trace service flows
const flows = await client.correlation.traceFlows(logs);

// Find related logs
const related = await client.correlation.findRelated(
  primaryLog,
  candidateLogs,
  { correlation_fields: ['request_id'], time_window: 300 }
);

// Detect error chains
const chains = await client.correlation.detectChains(logs, 10);
```

### Metrics and Dashboard

Get comprehensive metrics and dashboard data:

```javascript
// Get system metrics
const systemMetrics = await client.metrics.getSystemMetrics(logs);

// Get service metrics
const serviceMetrics = await client.metrics.getServiceMetrics(logs);

// Get performance metrics
const performance = await client.metrics.getPerformanceMetrics(logs, 24);

// Get dashboard data
const dashboard = await client.metrics.getDashboardData(logs);

// Analyze trends
const trends = await client.metrics.analyzeTrends(logs, 'hour');

// Health check
const health = await client.metrics.getHealthCheck();
```

### Log Management

Retrieve and manage logs:

```javascript
// Get logs with filters
const logs = await client.logs.getLogs({
  level: 'ERROR',
  service: 'payment-service',
  start_time: '2023-01-01T00:00:00Z',
  end_time: '2023-01-02T00:00:00Z',
  limit: 100
});

// Get log statistics
const stats = await client.logs.getStats();
```

### Log Ingestion

Ingest logs into the system:

```javascript
// Ingest a single log
await client.ingest.ingestLog({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  service: 'api-service',
  message: 'Request processed successfully',
  user_id: 'user123'
});

// Ingest multiple logs
await client.ingest.ingestLogs([log1, log2, log3]);

// Get ingestion stats
const ingestStats = await client.ingest.getStats();
```

## Error Handling

The client includes comprehensive error handling:

```javascript
try {
  const result = await client.queries.queryLogs({
    query: 'Find errors'
  });
} catch (error) {
  if (error instanceof FlashIOError) {
    console.error('FlashIO API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Examples

### Basic Usage

```javascript
import FlashIOClient from '@flashio/log-analysis-client';

const client = new FlashIOClient({
  apiKey: 'your-api-key',
  baseURL: 'http://localhost:8000'
});

// Query logs
const result = await client.queries.queryLogs({
  query: 'Show me all critical errors from today'
});

console.log(result.analysis);
```

### Real-time Monitoring Setup

```javascript
// Set up alerts
await client.alerts.createRule({
  name: 'Critical Errors',
  pattern: 'critical|fatal',
  severity: 'critical',
  threshold: 1
});

// Configure anomaly detection
await client.anomalies.updateConfig({
  enabled: true,
  sensitivity: 0.8
});

// Start monitoring
await client.anomalies.startMonitoring();

// Process logs in real-time
setInterval(async () => {
  const logs = await getLogs(); // Your log source
  
  // Check alerts
  const alerts = await client.alerts.checkAlerts(logs);
  
  // Detect anomalies
  const anomalies = await client.anomalies.analyzeLogs(logs);
  
  // Handle alerts and anomalies
  if (alerts.triggered_alerts > 0) {
    console.log('Alerts triggered:', alerts.alerts);
  }
  
  if (anomalies.anomalies_detected > 0) {
    console.log('Anomalies detected:', anomalies.anomalies);
  }
}, 60000); // Check every minute
```

### Service Performance Dashboard

```javascript
async function createDashboard(logs) {
  // Get comprehensive dashboard data
  const dashboard = await client.metrics.getDashboardData(logs);
  
  console.log('System Health:', dashboard.real_time_stats.system_status);
  console.log('Active Services:', dashboard.real_time_stats.active_services);
  console.log('Error Rate:', dashboard.current_metrics.error_rate);
  
  // Service status overview
  dashboard.service_status.forEach(service => {
    console.log(`${service.service}: ${service.status} (${service.health_score}/100)`);
  });
  
  // Recent trends
  console.log('Recent Trends:', dashboard.recent_trends);
  
  return dashboard;
}
```

## TypeScript Support

The library includes TypeScript definitions:

```typescript
import FlashIOClient, { FlashIOError } from '@flashio/log-analysis-client';

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  [key: string]: any;
}

const client = new FlashIOClient({
  apiKey: 'your-api-key',
  baseURL: 'http://localhost:8000'
});

const logs: LogEntry[] = [
  // your logs
];

const result = await client.queries.queryLogs({
  query: 'Find errors',
  max_logs: 50
});
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact our support team.

## Changelog

### v1.0.0
- Initial release
- Full API coverage for queries, alerts, anomalies, correlation, and metrics
- Comprehensive error handling
- TypeScript support
- Example implementations
