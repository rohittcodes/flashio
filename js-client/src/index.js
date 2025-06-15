import axios from 'axios';

/**
 * FlashIO Log Analysis API Client
 * 
 * A comprehensive JavaScript client for interacting with the FlashIO Log Analysis API.
 * Supports queries, alerts, anomaly detection, log correlation, and metrics.
 */
class FlashIOClient {
  /**
   * Create a new FlashIO client instance
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Your API key for authentication
   * @param {string} config.baseURL - The base URL of the FlashIO API (default: http://localhost:8000)
   * @param {number} config.timeout - Request timeout in milliseconds (default: 30000)
   */
  constructor(config) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'http://localhost:8000';
    this.timeout = config.timeout || 30000;

    // Create axios instance with default config
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
        const statusCode = error.response?.status || 500;
        
        throw new FlashIOError(errorMessage, statusCode, error.response?.data);
      }
    );

    // Initialize endpoint modules
    this.queries = new QueriesAPI(this.httpClient);
    this.alerts = new AlertsAPI(this.httpClient);
    this.anomalies = new AnomaliesAPI(this.httpClient);
    this.correlation = new CorrelationAPI(this.httpClient);
    this.metrics = new MetricsAPI(this.httpClient);
    this.logs = new LogsAPI(this.httpClient);
    this.ingest = new IngestAPI(this.httpClient);
  }

  /**
   * Test the connection to the API
   * @returns {Promise<Object>} Health check response
   */
  async testConnection() {
    try {
      const response = await this.httpClient.get('/health');
      return {
        success: true,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update the API key
   * @param {string} newApiKey - The new API key
   */
  updateApiKey(newApiKey) {
    this.apiKey = newApiKey;
    this.httpClient.defaults.headers['X-API-Key'] = newApiKey;
  }

  /**
   * Update the base URL
   * @param {string} newBaseURL - The new base URL
   */
  updateBaseURL(newBaseURL) {
    this.baseURL = newBaseURL;
    this.httpClient.defaults.baseURL = newBaseURL;
  }
}

/**
 * Custom error class for FlashIO API errors
 */
class FlashIOError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = 'FlashIOError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Queries API endpoint methods
 */
class QueriesAPI {
  constructor(httpClient) {
    this.client = httpClient;
  }

  /**
   * Query logs using natural language
   * @param {Object} request - Query request object
   * @param {string} request.query - The natural language query
   * @param {number} [request.max_logs=100] - Maximum number of logs to return
   * @param {string} [request.analysis_focus] - Specific aspect to focus analysis on
   * @param {boolean} [request.include_context=true] - Include historical context
   * @returns {Promise<Object>} Query response with analysis and logs
   */
  async queryLogs(request) {
    return this.client.post('/queries/', request);
  }

  /**
   * Get system insights and patterns
   * @returns {Promise<Object>} System insights data
   */
  async getInsights() {
    return this.client.get('/queries/insights');
  }

  /**
   * Summarize provided logs
   * @param {Array} logs - Array of log objects to summarize
   * @param {string} [focus] - Optional focus for the summary
   * @returns {Promise<Object>} Summary response
   */
  async summarizeLogs(logs, focus = null) {
    return this.client.post('/queries/summarize', { logs, focus });
  }

  /**
   * Set the LLM model for queries
   * @param {Object} config - Model configuration
   * @param {string} config.model_id - The model ID (e.g., 'gpt-4', 'claude-3-opus')
   * @param {string} config.provider - The provider ('openai', 'anthropic', 'google', 'groq')
   * @param {string} [config.api_key] - Optional API key override
   * @returns {Promise<Object>} Success response
   */
  async setModel(config) {
    return this.client.post('/queries/set-model', config);
  }

  /**
   * Get current model information
   * @returns {Promise<Object>} Current model configuration
   */
  async getCurrentModel() {
    return this.client.get('/queries/current-model');
  }

  /**
   * Reinitialize the query agent
   * @returns {Promise<Object>} Success response
   */
  async reinitialize() {
    return this.client.post('/queries/reinitialize');
  }
}

/**
 * Alerts API endpoint methods
 */
class AlertsAPI {
  constructor(httpClient) {
    this.client = httpClient;
  }

  /**
   * Create a new alert rule
   * @param {Object} rule - Alert rule configuration
   * @param {string} rule.name - Name of the alert rule
   * @param {string} rule.pattern - Pattern to match (regex or keywords)
   * @param {string} [rule.severity='medium'] - Alert severity (low, medium, high, critical)
   * @param {boolean} [rule.enabled=true] - Whether the alert is enabled
   * @param {number} [rule.threshold=1] - Number of matches before triggering
   * @param {number} [rule.time_window=300] - Time window in seconds
   * @param {Array} [rule.notification_channels=[]] - Notification channels
   * @returns {Promise<Object>} Creation response with rule ID
   */
  async createRule(rule) {
    return this.client.post('/alerts/rules', rule);
  }

  /**
   * Get all alert rules
   * @returns {Promise<Array>} Array of alert rules
   */
  async getRules() {
    return this.client.get('/alerts/rules');
  }

  /**
   * Delete an alert rule
   * @param {string} ruleId - The ID of the rule to delete
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteRule(ruleId) {
    return this.client.delete(`/alerts/rules/${ruleId}`);
  }

  /**
   * Manually check logs against alert rules
   * @param {Array} logs - Array of log objects to check
   * @returns {Promise<Object>} Alert check results
   */
  async checkAlerts(logs) {
    return this.client.post('/alerts/check', { logs });
  }

  /**
   * Get active alerts
   * @param {string} [severity] - Filter by severity (optional)
   * @returns {Promise<Array>} Array of active alerts
   */
  async getActiveAlerts(severity = null) {
    const params = severity ? { severity } : {};
    return this.client.get('/alerts/active', { params });
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - The ID of the alert to acknowledge
   * @returns {Promise<Object>} Acknowledgment confirmation
   */
  async acknowledgeAlert(alertId) {
    return this.client.post(`/alerts/acknowledge/${alertId}`);
  }

  /**
   * Get alert summary and statistics
   * @returns {Promise<Object>} Alert summary data
   */
  async getSummary() {
    return this.client.get('/alerts/summary');
  }

  /**
   * Clear acknowledged alerts
   * @returns {Promise<Object>} Clear operation results
   */
  async clearAcknowledged() {
    return this.client.delete('/alerts/clear');
  }
}

/**
 * Anomalies API endpoint methods
 */
class AnomaliesAPI {
  constructor(httpClient) {
    this.client = httpClient;
  }

  /**
   * Update anomaly detection configuration
   * @param {Object} config - Anomaly detection configuration
   * @param {boolean} [config.enabled=true] - Whether detection is enabled
   * @param {number} [config.sensitivity=0.8] - Detection sensitivity (0.0-1.0)
   * @param {number} [config.time_window=3600] - Time window for analysis in seconds
   * @param {number} [config.min_samples=10] - Minimum samples required
   * @param {Array} [config.detection_methods=['volume', 'pattern', 'timing']] - Detection methods
   * @returns {Promise<Object>} Configuration update response
   */
  async updateConfig(config) {
    return this.client.post('/anomalies/config', config);
  }

  /**
   * Get current anomaly detection configuration
   * @returns {Promise<Object>} Current configuration
   */
  async getConfig() {
    return this.client.get('/anomalies/config');
  }

  /**
   * Analyze logs for anomalies
   * @param {Array} logs - Array of log objects to analyze
   * @param {boolean} [updateBaseline=false] - Whether to update baseline metrics
   * @returns {Promise<Object>} Anomaly analysis results
   */
  async analyzeLogs(logs, updateBaseline = false) {
    return this.client.post('/anomalies/analyze', { logs, update_baseline: updateBaseline });
  }

  /**
   * Get detected anomalies
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.severity] - Filter by severity
   * @param {string} [filters.anomaly_type] - Filter by anomaly type
   * @param {number} [filters.limit=50] - Maximum number of results
   * @returns {Promise<Array>} Array of detected anomalies
   */
  async getDetected(filters = {}) {
    const params = {};
    if (filters.severity) params.severity = filters.severity;
    if (filters.anomaly_type) params.anomaly_type = filters.anomaly_type;
    if (filters.limit) params.limit = filters.limit;
    
    return this.client.get('/anomalies/detected', { params });
  }

  /**
   * Get comprehensive anomaly report
   * @returns {Promise<Object>} Anomaly report with statistics and health score
   */
  async getReport() {
    return this.client.get('/anomalies/report');
  }

  /**
   * Start real-time anomaly monitoring
   * @returns {Promise<Object>} Monitoring start confirmation
   */
  async startMonitoring() {
    return this.client.post('/anomalies/start-monitoring');
  }

  /**
   * Stop real-time anomaly monitoring
   * @returns {Promise<Object>} Monitoring stop confirmation
   */
  async stopMonitoring() {
    return this.client.post('/anomalies/stop-monitoring');
  }

  /**
   * Get monitoring status
   * @returns {Promise<Object>} Current monitoring status
   */
  async getMonitoringStatus() {
    return this.client.get('/anomalies/monitoring-status');
  }

  /**
   * Clear old anomalies
   * @param {number} [olderThanHours=24] - Clear anomalies older than this many hours
   * @returns {Promise<Object>} Clear operation results
   */
  async clearAnomalies(olderThanHours = 24) {
    return this.client.delete('/anomalies/clear', {
      params: { older_than_hours: olderThanHours }
    });
  }
}

/**
 * Correlation API endpoint methods
 */
class CorrelationAPI {
  constructor(httpClient) {
    this.client = httpClient;
  }

  /**
   * Analyze logs for correlations
   * @param {Object} request - Correlation request
   * @param {Array} request.primary_logs - Primary logs to correlate
   * @param {number} [request.time_window=300] - Time window for correlation in seconds
   * @param {Array} [request.correlation_fields] - Fields to use for correlation
   * @param {boolean} [request.include_cross_service=true] - Include cross-service correlations
   * @returns {Promise<Object>} Correlation analysis results
   */
  async analyzeLogs(request) {
    return this.client.post('/correlation/analyze', request);
  }

  /**
   * Trace request flows across services
   * @param {Array} logs - Array of log objects to trace
   * @returns {Promise<Array>} Array of service flows
   */
  async traceFlows(logs) {
    return this.client.post('/correlation/trace-flows', { logs });
  }

  /**
   * Find logs related to a specific primary log
   * @param {Object} primaryLog - The primary log to find relations for
   * @param {Array} candidateLogs - Candidate logs to check for relations
   * @param {Object} [options] - Search options
   * @param {Array} [options.correlation_fields] - Fields to use for correlation
   * @param {number} [options.time_window=300] - Time window in seconds
   * @returns {Promise<Object>} Related logs and correlation scores
   */
  async findRelated(primaryLog, candidateLogs, options = {}) {
    return this.client.post('/correlation/find-related', {
      primary_log: primaryLog,
      candidate_logs: candidateLogs,
      ...options
    });
  }

  /**
   * Detect chains of related errors or events
   * @param {Array} logs - Array of log objects to analyze
   * @param {number} [maxChainLength=10] - Maximum length of error chains
   * @returns {Promise<Object>} Detected error chains
   */
  async detectChains(logs, maxChainLength = 10) {
    return this.client.post('/correlation/detect-chains', {
      logs,
      max_chain_length: maxChainLength
    });
  }
}

/**
 * Metrics API endpoint methods
 */
class MetricsAPI {
  constructor(httpClient) {
    this.client = httpClient;
  }

  /**
   * Get current system metrics
   * @param {Array} logs - Array of log objects to analyze
   * @param {number} [timeWindow=3600] - Time window for analysis in seconds
   * @returns {Promise<Object>} System metrics data
   */
  async getSystemMetrics(logs, timeWindow = 3600) {
    return this.client.post('/metrics/system', { logs, time_window: timeWindow });
  }

  /**
   * Get metrics for each service
   * @param {Array} logs - Array of log objects to analyze
   * @returns {Promise<Array>} Array of service metrics
   */
  async getServiceMetrics(logs) {
    return this.client.post('/metrics/services', { logs });
  }

  /**
   * Get performance metrics over time
   * @param {Array} logs - Array of log objects to analyze
   * @param {number} [timeRangeHours=24] - Time range for analysis in hours
   * @returns {Promise<Object>} Performance metrics data
   */
  async getPerformanceMetrics(logs, timeRangeHours = 24) {
    return this.client.post('/metrics/performance', {
      logs,
      time_range_hours: timeRangeHours
    });
  }

  /**
   * Get comprehensive dashboard data
   * @param {Array} logs - Array of log objects to analyze
   * @returns {Promise<Object>} Complete dashboard data
   */
  async getDashboardData(logs) {
    return this.client.post('/metrics/dashboard', { logs });
  }

  /**
   * Get system health check
   * @returns {Promise<Object>} System health status
   */
  async getHealthCheck() {
    return this.client.get('/metrics/health');
  }

  /**
   * Analyze trends in log data
   * @param {Array} logs - Array of log objects to analyze
   * @param {string} [timeBucket='hour'] - Time bucket for grouping (hour, day, week)
   * @returns {Promise<Object>} Trend analysis results
   */
  async analyzeTrends(logs, timeBucket = 'hour') {
    return this.client.post('/metrics/trends', {
      logs,
      time_bucket: timeBucket
    });
  }
}

/**
 * Logs API endpoint methods
 */
class LogsAPI {
  constructor(httpClient) {
    this.client = httpClient;
  }

  /**
   * Get logs with filtering options
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.level] - Filter by log level
   * @param {string} [filters.service] - Filter by service name
   * @param {string} [filters.start_time] - Start time for filtering
   * @param {string} [filters.end_time] - End time for filtering
   * @param {number} [filters.limit=100] - Maximum number of logs to return
   * @returns {Promise<Array>} Array of log objects
   */
  async getLogs(filters = {}) {
    return this.client.get('/logs/', { params: filters });
  }

  /**
   * Get log statistics
   * @returns {Promise<Object>} Log statistics and counts
   */
  async getStats() {
    return this.client.get('/logs/stats');
  }
}

/**
 * Ingest API endpoint methods
 */
class IngestAPI {
  constructor(httpClient) {
    this.client = httpClient;
  }

  /**
   * Ingest a single log entry
   * @param {Object} logEntry - The log entry to ingest
   * @returns {Promise<Object>} Ingestion response
   */
  async ingestLog(logEntry) {
    return this.client.post('/ingest/log', logEntry);
  }

  /**
   * Ingest multiple log entries
   * @param {Array} logs - Array of log entries to ingest
   * @returns {Promise<Object>} Batch ingestion response
   */
  async ingestLogs(logs) {
    return this.client.post('/ingest/logs', { logs });
  }

  /**
   * Get ingestion statistics
   * @returns {Promise<Object>} Ingestion statistics
   */
  async getStats() {
    return this.client.get('/ingest/stats');
  }
}

// Export the main client class and error class
export { FlashIOClient, FlashIOError };
export default FlashIOClient;
