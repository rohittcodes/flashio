import FlashIOClient from '../src/index.js';

// Example: Basic usage of the FlashIO client
async function basicUsageExample() {
  console.log('=== FlashIO Client Basic Usage Example ===\n');

  // Initialize the client
  const client = new FlashIOClient({
    apiKey: 'your-api-key-here',
    baseURL: 'http://localhost:8000', // Your FlashIO API URL
    timeout: 30000
  });

  try {
    // Test connection
    console.log('1. Testing connection...');
    const healthCheck = await client.testConnection();
    console.log('Connection status:', healthCheck.success ? 'Connected' : 'Failed');
    console.log('Response:', healthCheck);
    console.log();

    // Example log data
    const sampleLogs = [
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'user-service',
        message: 'User login successful',
        user_id: 'user123',
        request_id: 'req-456'
      },
      {
        timestamp: new Date(Date.now() - 5000).toISOString(),
        level: 'ERROR',
        service: 'payment-service',
        message: 'Payment processing failed: Invalid card',
        user_id: 'user123',
        request_id: 'req-789'
      },
      {
        timestamp: new Date(Date.now() - 10000).toISOString(),
        level: 'WARNING',
        service: 'user-service',
        message: 'High response time detected: 2.5s',
        response_time: '2500ms',
        request_id: 'req-101'
      }
    ];

    // Query logs using natural language
    console.log('2. Querying logs with natural language...');
    const queryResponse = await client.queries.queryLogs({
      query: 'Find any errors related to payments',
      max_logs: 50,
      include_context: true
    });
    console.log('Query analysis:', queryResponse.analysis);
    console.log('Found logs:', queryResponse.logs.length);
    console.log();

    // Get system metrics
    console.log('3. Getting system metrics...');
    const systemMetrics = await client.metrics.getSystemMetrics(sampleLogs);
    console.log('Total logs:', systemMetrics.total_logs);
    console.log('Error rate:', (systemMetrics.error_rate * 100).toFixed(2) + '%');
    console.log('Top services:', systemMetrics.top_services);
    console.log();

    // Create an alert rule
    console.log('4. Creating alert rule...');
    const alertRule = await client.alerts.createRule({
      name: 'Payment Errors',
      pattern: 'payment.*error|failed.*payment',
      severity: 'high',
      threshold: 1,
      time_window: 300,
      enabled: true
    });
    console.log('Alert rule created:', alertRule);
    console.log();

    // Check alerts against sample logs
    console.log('5. Checking alerts...');
    const alertCheck = await client.alerts.checkAlerts(sampleLogs);
    console.log('Triggered alerts:', alertCheck.triggered_alerts);
    console.log();

    // Analyze for anomalies
    console.log('6. Analyzing for anomalies...');
    const anomalyAnalysis = await client.anomalies.analyzeLogs(sampleLogs, true);
    console.log('Anomalies detected:', anomalyAnalysis.anomalies_detected);
    if (anomalyAnalysis.anomalies_detected > 0) {
      console.log('Anomalies:', anomalyAnalysis.anomalies);
    }
    console.log();

    // Correlate logs
    console.log('7. Correlating logs...');
    const correlation = await client.correlation.analyzeLogs({
      primary_logs: sampleLogs,
      time_window: 300,
      correlation_fields: ['user_id', 'request_id', 'service']
    });
    console.log('Correlation groups found:', correlation.total_groups);
    console.log('Services involved:', correlation.services_involved);
    console.log();

    // Get dashboard data
    console.log('8. Getting dashboard data...');
    const dashboardData = await client.metrics.getDashboardData(sampleLogs);
    console.log('System health score:', dashboardData.performance_metrics.system_health_score);
    console.log('Real-time stats:', dashboardData.real_time_stats);
    console.log();

  } catch (error) {
    console.error('Error in basic usage example:', error.message);
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

// Run the example
basicUsageExample();
