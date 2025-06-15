import FlashIOClient from '../src/index.js';

// Example: Advanced monitoring and alerting system
async function advancedMonitoringExample() {
  console.log('=== FlashIO Advanced Monitoring Example ===\n');

  const client = new FlashIOClient({
    apiKey: 'your-api-key-here',
    baseURL: 'http://localhost:8000'
  });

  try {
    // Simulate a stream of logs with various patterns
    const logStream = generateLogStream(100);

    // Set up comprehensive alerting
    console.log('1. Setting up alert rules...');
    
    const alertRules = [
      {
        name: 'Critical Errors',
        pattern: 'critical|fatal|exception',
        severity: 'critical',
        threshold: 1,
        time_window: 60
      },
      {
        name: 'High Error Rate',
        pattern: 'error',
        severity: 'high',
        threshold: 5,
        time_window: 300
      },
      {
        name: 'Slow Response Times',
        pattern: 'response_time.*[5-9][0-9][0-9][0-9]ms',
        severity: 'medium',
        threshold: 3,
        time_window: 600
      },
      {
        name: 'Database Connection Issues',
        pattern: 'database.*connection.*failed|db.*timeout',
        severity: 'high',
        threshold: 2,
        time_window: 180
      }
    ];

    for (const rule of alertRules) {
      await client.alerts.createRule(rule);
      console.log(`Created alert rule: ${rule.name}`);
    }
    console.log();

    // Configure anomaly detection
    console.log('2. Configuring anomaly detection...');
    await client.anomalies.updateConfig({
      enabled: true,
      sensitivity: 0.7,
      time_window: 3600,
      min_samples: 20,
      detection_methods: ['volume', 'pattern', 'timing']
    });
    console.log('Anomaly detection configured');
    console.log();

    // Start real-time monitoring
    console.log('3. Starting real-time monitoring...');
    await client.anomalies.startMonitoring();
    console.log('Real-time monitoring started');
    console.log();

    // Process logs in batches (simulating real-time ingestion)
    console.log('4. Processing log batches...');
    const batchSize = 20;
    const batches = [];
    
    for (let i = 0; i < logStream.length; i += batchSize) {
      batches.push(logStream.slice(i, i + batchSize));
    }

    let allDetectedAnomalies = [];
    let allTriggeredAlerts = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} logs)`);

      // Check for alerts
      const alertCheck = await client.alerts.checkAlerts(batch);
      if (alertCheck.triggered_alerts > 0) {
        console.log(`  ⚠️  ${alertCheck.triggered_alerts} alerts triggered`);
        allTriggeredAlerts.push(...alertCheck.alerts);
      }

      // Analyze for anomalies
      const anomalyAnalysis = await client.anomalies.analyzeLogs(batch, i === 0);
      if (anomalyAnalysis.anomalies_detected > 0) {
        console.log(`  🔍 ${anomalyAnalysis.anomalies_detected} anomalies detected`);
        allDetectedAnomalies.push(...anomalyAnalysis.anomalies);
      }

      // Correlate logs if there are errors
      const errorLogs = batch.filter(log => 
        ['error', 'critical', 'fatal'].includes(log.level.toLowerCase())
      );
      
      if (errorLogs.length > 0) {
        const errorChains = await client.correlation.detectChains(batch);
        if (errorChains.chains_detected > 0) {
          console.log(`  🔗 ${errorChains.chains_detected} error chains detected`);
        }
      }

      // Small delay to simulate real-time processing
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log();

    // Generate comprehensive reports
    console.log('5. Generating comprehensive reports...');

    // Alert summary
    const alertSummary = await client.alerts.getSummary();
    console.log('Alert Summary:');
    console.log(`  Total alerts: ${alertSummary.total_alerts}`);
    console.log(`  Critical: ${alertSummary.critical_alerts}, High: ${alertSummary.high_alerts}`);
    console.log(`  Medium: ${alertSummary.medium_alerts}, Low: ${alertSummary.low_alerts}`);
    console.log();

    // Anomaly report
    const anomalyReport = await client.anomalies.getReport();
    console.log('Anomaly Report:');
    console.log(`  Total anomalies: ${anomalyReport.total_anomalies}`);
    console.log(`  System health score: ${anomalyReport.system_health_score.toFixed(1)}/100`);
    console.log(`  Anomalies by type:`, anomalyReport.anomalies_by_type);
    console.log();

    // Performance metrics
    const performanceMetrics = await client.metrics.getPerformanceMetrics(logStream);
    console.log('Performance Metrics:');
    console.log(`  Logs per second: ${performanceMetrics.throughput.logs_per_second.toFixed(2)}`);
    console.log(`  System health: ${performanceMetrics.system_health_score.toFixed(1)}/100`);
    console.log(`  Top performing services:`, 
      performanceMetrics.service_performance.slice(0, 3).map(s => 
        `${s.service_name} (${s.health_score.toFixed(1)}/100)`
      )
    );
    console.log();

    // Service flow analysis
    console.log('6. Analyzing service flows...');
    const serviceFlows = await client.correlation.traceFlows(logStream);
    console.log(`Found ${serviceFlows.length} service flows`);
    
    if (serviceFlows.length > 0) {
      const longestFlow = serviceFlows[0]; // Already sorted by duration
      console.log(`Longest flow: ${longestFlow.request_id}`);
      console.log(`  Duration: ${longestFlow.total_duration.toFixed(2)}s`);
      console.log(`  Services: ${longestFlow.services.join(' → ')}`);
      console.log(`  Errors: ${longestFlow.errors.length}, Warnings: ${longestFlow.warnings.length}`);
    }
    console.log();

    // Dashboard data
    console.log('7. Final dashboard overview...');
    const dashboardData = await client.metrics.getDashboardData(logStream);
    console.log('Current System Status:');
    console.log(`  Status: ${dashboardData.real_time_stats.system_status.toUpperCase()}`);
    console.log(`  Active services: ${dashboardData.real_time_stats.active_services}`);
    console.log(`  Recent errors: ${dashboardData.real_time_stats.recent_errors}`);
    console.log(`  Logs per minute: ${dashboardData.real_time_stats.current_rate.toFixed(1)}`);
    console.log();

    // Service health overview
    console.log('Service Health Overview:');
    dashboardData.service_status.forEach(service => {
      const statusEmoji = {
        healthy: '✅',
        degraded: '⚠️',
        warning: '⚠️',
        critical: '❌'
      }[service.status] || '❓';
      
      console.log(`  ${statusEmoji} ${service.service}: ${service.status} (${service.health_score.toFixed(1)}/100)`);
    });
    console.log();

    // Cleanup - stop monitoring
    console.log('8. Stopping monitoring...');
    await client.anomalies.stopMonitoring();
    console.log('Monitoring stopped');

  } catch (error) {
    console.error('Error in advanced monitoring example:', error.message);
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
  }
}

// Helper function to generate realistic log data
function generateLogStream(count) {
  const services = ['user-service', 'payment-service', 'order-service', 'notification-service', 'inventory-service'];
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'CRITICAL'];
  const users = ['user123', 'user456', 'user789', 'user012', 'user345'];
  
  const logs = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (count - i) * 1000); // Spread over time
    const service = services[Math.floor(Math.random() * services.length)];
    const level = getWeightedLevel();
    const userId = users[Math.floor(Math.random() * users.length)];
    const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
    
    const log = {
      timestamp: timestamp.toISOString(),
      level,
      service,
      user_id: userId,
      request_id: requestId,
      message: generateMessage(service, level, i)
    };
    
    // Add response time for some logs
    if (Math.random() > 0.7) {
      const responseTime = getWeightedResponseTime();
      log.response_time = `${responseTime}ms`;
      log.message += ` response_time:${responseTime}ms`;
    }
    
    logs.push(log);
  }
  
  return logs;
}

function getWeightedLevel() {
  const rand = Math.random();
  if (rand < 0.6) return 'INFO';
  if (rand < 0.8) return 'DEBUG';
  if (rand < 0.92) return 'WARN';
  if (rand < 0.98) return 'ERROR';
  return 'CRITICAL';
}

function getWeightedResponseTime() {
  const rand = Math.random();
  if (rand < 0.7) return Math.floor(Math.random() * 500) + 50; // 50-550ms (normal)
  if (rand < 0.9) return Math.floor(Math.random() * 2000) + 500; // 500-2500ms (slow)
  return Math.floor(Math.random() * 5000) + 2500; // 2500-7500ms (very slow)
}

function generateMessage(service, level, index) {
  const messages = {
    'user-service': {
      'INFO': ['User login successful', 'User profile updated', 'Password changed successfully'],
      'WARN': ['Login attempt with invalid credentials', 'User session expiring soon'],
      'ERROR': ['Database connection failed', 'User authentication failed'],
      'CRITICAL': ['User database is unreachable', 'Critical authentication service failure']
    },
    'payment-service': {
      'INFO': ['Payment processed successfully', 'Refund initiated', 'Payment method verified'],
      'WARN': ['Payment retry attempt', 'High transaction volume detected'],
      'ERROR': ['Payment processing failed', 'Invalid payment method', 'Transaction timeout'],
      'CRITICAL': ['Payment gateway is down', 'Critical payment processing failure']
    },
    'order-service': {
      'INFO': ['Order created successfully', 'Order status updated', 'Order shipped'],
      'WARN': ['Inventory running low', 'Order processing delayed'],
      'ERROR': ['Order creation failed', 'Inventory check failed'],
      'CRITICAL': ['Order database corruption detected', 'Critical inventory system failure']
    },
    'notification-service': {
      'INFO': ['Email sent successfully', 'Push notification delivered', 'SMS sent'],
      'WARN': ['Email delivery delayed', 'Push notification retry'],
      'ERROR': ['Email delivery failed', 'SMS gateway error'],
      'CRITICAL': ['Notification system overload', 'Critical messaging service failure']
    },
    'inventory-service': {
      'INFO': ['Inventory updated', 'Stock level checked', 'Product availability confirmed'],
      'WARN': ['Low stock warning', 'Inventory sync delayed'],
      'ERROR': ['Inventory update failed', 'Stock level calculation error'],
      'CRITICAL': ['Inventory database failure', 'Critical stock management error']
    }
  };
  
  const serviceMessages = messages[service] || messages['user-service'];
  const levelMessages = serviceMessages[level] || serviceMessages['INFO'];
  const message = levelMessages[Math.floor(Math.random() * levelMessages.length)];
  
  return `${message} [${service}:${index}]`;
}

// Run the example
advancedMonitoringExample();
