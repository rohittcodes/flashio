function showTab(tabName) {
    console.log(`Switching to tab: ${tabName}`);
    
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show the selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        console.log(`Tab ${tabName} is now visible`);
    } else {
        console.error(`Tab ${tabName}-tab not found!`);
    }
    
    // Update navigation styling
    document.querySelectorAll('nav a').forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(tabName)) {
            link.classList.add('text-gray-900', 'border-indigo-500');
            link.classList.remove('text-white', 'border-transparent', 'hover:border-gray-300');
        } else {
            link.classList.remove('text-gray-900', 'border-indigo-500');
            link.classList.add('text-white', 'border-transparent', 'hover:border-gray-300');
        }
    });

    // Handle WebSocket connection for live tab
    if (tabName === 'live') {
        if (!logWebSocket) {
            logWebSocket = new LogWebSocket();
            logWebSocket.connect();
        }
    }
    
    // Load data for specific tabs
    switch(tabName) {
        case 'agent':
            if (typeof refreshAgentState === 'function') {
                refreshAgentState();
            }
            break;
        case 'dashboard':
            if (typeof refreshDashboard === 'function') {
                refreshDashboard();
            }
            break;
        case 'alerts':
            if (typeof refreshAlerts === 'function') {
                refreshAlerts();
            }
            break;
        case 'anomalies':
            if (typeof refreshAnomalies === 'function') {
                refreshAnomalies();
            }
            break;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const titleElement = document.getElementById('notification-title');
    const messageElement = document.getElementById('notification-message');
    const iconElement = notification.querySelector('.notification-icon i');
    
    // Update content
    titleElement.textContent = type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Info';
    messageElement.textContent = message;
    
    // Update styling based on type
    const borderColor = type === 'success' ? 'border-green-500' : type === 'error' ? 'border-red-500' : 'border-blue-500';
    const bgColor = type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-blue-100';
    const textColor = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600';
    const icon = type === 'success' ? 'fa-check' : type === 'error' ? 'fa-times' : 'fa-info';
    
    // Reset classes
    notification.querySelector('.bg-white').className = `bg-white border-l-4 ${borderColor} rounded-lg shadow-2xl p-4 max-w-sm`;
    notification.querySelector('.notification-icon').className = `notification-icon w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`;
    iconElement.className = `fas ${icon} ${textColor} text-sm`;
    
    // Show notification
    notification.classList.remove('translate-x-full');
    notification.classList.add('translate-x-0');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('translate-x-0');
    notification.classList.add('translate-x-full');
}

function updateFileName(input) {
    const filenameElement = document.getElementById('selected-filename');
    if (input.files && input.files[0]) {
        filenameElement.textContent = `Selected file: ${input.files[0].name}`;
        filenameElement.classList.remove('hidden');
    } else {
        filenameElement.classList.add('hidden');
    }
}

function setUploadingState(isUploading) {
    const button = document.getElementById('upload-button');
    const spinner = document.getElementById('upload-spinner');
    const text = document.getElementById('upload-text');
    
    button.disabled = isUploading;
    if (isUploading) {
        spinner.classList.remove('hidden');
        text.textContent = 'Uploading...';
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        spinner.classList.add('hidden');
        text.textContent = 'Upload and Process';
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        setUploadingState(true);
        const response = await fetch('/ingest/file', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification(result.message);
            e.target.reset();
            document.getElementById('selected-filename').classList.add('hidden');
        } else {
            showNotification(result.detail || 'Error uploading file', 'error');
        }
    } catch (error) {
        showNotification('Error uploading file: ' + error.message, 'error');
    } finally {
        setUploadingState(false);
    }
});

marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false,
    sanitize: true
});

function renderMarkdown(text) {
    try {
        return marked.parse(text);
    } catch (error) {
        console.error('Error parsing markdown:', error);
        return text;
    }
}

// Query form submission handling
document.getElementById('query-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    updateAgentStateIndicator('analyzing');
    
    const query = e.target.query.value;
    const includeContext = document.getElementById('include-context').checked;
    const includeLogs = document.getElementById('include-logs').checked;
    const resultsDiv = document.getElementById('query-results');
    
    const queryButton = document.getElementById('query-button');
    const querySpinner = document.getElementById('query-spinner');
    const queryText = document.getElementById('query-text');
    
    queryButton.disabled = true;
    querySpinner.classList.remove('hidden');
    queryText.textContent = 'Analyzing...';
    
    resultsDiv.innerHTML = '<div class="text-center py-6"><div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div><p class="mt-2 text-gray-600">AI is analyzing your query...</p></div>';    try {
        const response = await fetch('/queries/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                max_logs: 100,
                include_context: includeContext
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            let html = `
                <div class="mb-4 p-4 bg-gray-50 rounded-md">
                    <h3 class="font-medium text-gray-900">Analysis</h3>
                    <div class="mt-2 text-gray-600 markdown-content">${renderMarkdown(result.analysis)}</div>
                </div>
            `;
            
            if (includeLogs && result.logs && result.logs.length > 0) {
                html += `
                    <div>
                        <h3 class="font-medium text-gray-900 mb-2">Logs (${result.logs.length})</h3>
                        <div class="space-y-2">
                `;
                
                result.logs.forEach(log => {
                    const level = log.level || 'INFO';
                    const levelClass = {
                        'ERROR': 'text-red-600',
                        'WARN': 'text-yellow-600',
                        'INFO': 'text-blue-600',
                        'DEBUG': 'text-gray-600'
                    }[level] || 'text-gray-600';
                    
                    html += `
                        <div class="p-3 bg-white shadow-sm rounded-md">
                            <div class="flex justify-between items-start">
                                <span class="${levelClass} font-medium">${level}</span>
                                <div class="flex flex-col items-end">
                                    <span class="text-white text-sm">${new Date(log.timestamp).toLocaleString()}</span>
                                    <span class="text-gray-400 text-xs">${log.service || 'unknown'}</span>
                                </div>
                            </div>
                            <div class="mt-1 text-gray-900 markdown-content">${renderMarkdown(log.message)}</div>
                        </div>
                    `;
                });
                
                html += '</div></div>';
            }
            
            resultsDiv.innerHTML = html;
            
            // After query completes, refresh agent state
            setTimeout(refreshAgentState, 1000);
        } else {
            resultsDiv.innerHTML = `<div class="text-red-600">${result.detail || 'Error querying logs'}</div>`;
            updateAgentStateIndicator('error');
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="text-red-600">Error querying logs: ${error.message}</div>`;
        updateAgentStateIndicator('error');
    } finally {
        queryButton.disabled = false;
        querySpinner.classList.add('hidden');
        queryText.textContent = 'Search';
    }
});

class LogWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.msgCount = 0;
        this.isReconnecting = false;
    }

    connect() {
        if (this.socket?.readyState === WebSocket.OPEN) {
            console.log("WebSocket already connected, reusing connection");
            return;
        }
        
        if (this.isReconnecting) {
            console.log("Already attempting to reconnect, skipping duplicate request");
            return;
        }

        this.isReconnecting = true;
        
        try {
            // Clear the logs div first, but only if there are no logs yet
            const logsDiv = document.getElementById('live-logs');
            if (logsDiv && (logsDiv.children.length === 0 || !this.msgCount)) {
                logsDiv.innerHTML = '<div class="text-center py-6"><div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div><p class="mt-2 text-gray-400">Connecting to log stream...</p></div>';
            }
            
            // Create a new WebSocket connection
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/logs/ws`;
            console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = this._onOpen.bind(this);
            this.socket.onclose = this._onClose.bind(this);
            this.socket.onerror = this._onError.bind(this);
            this.socket.onmessage = this._onMessage.bind(this);
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this._handleError(error);
            this._scheduleReconnect();
        } finally {
            this.isReconnecting = false;
        }
    }

    disconnect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log("Explicitly closing WebSocket connection");
            // Use a clean close reason
            this.socket.close(1000, "Normal closure");
            this.socket = null;
        }
        this.reconnectAttempts = 0;
    }

    _onOpen(event) {
        console.log('WebSocket connected successfully');
        const logsDiv = document.getElementById('live-logs');
        logsDiv.innerHTML = '<div class="text-sm text-gray-400 mb-4">Connected to log stream. Waiting for logs...</div>';
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Add a status indicator
        const statusDiv = document.createElement('div');
        statusDiv.id = 'ws-status';
        statusDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-3 py-1 text-xs rounded-full';
        statusDiv.textContent = 'Live: Connected';
        document.body.appendChild(statusDiv);
    }

    _onClose(event) {
        console.log(`WebSocket closed, code: ${event.code}, reason: ${event.reason}`);
        const statusDiv = document.getElementById('ws-status');
        if (statusDiv) {
            statusDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs rounded-full';
            statusDiv.textContent = 'Live: Disconnected';
        }
        this._scheduleReconnect();
    }

    _onError(error) {
        console.error('WebSocket error:', error);
        this._handleError(error);
        this._scheduleReconnect();
    }

    _onMessage(event) {
        this.msgCount++;
        try {
            console.log(`Received WebSocket message #${this.msgCount}: ${event.data.substring(0, 50)}...`);
            const log = JSON.parse(event.data);
            const logsDiv = document.getElementById('live-logs');
            
            // Remove the "waiting for logs" message on first log
            if (this.msgCount === 1) {
                logsDiv.innerHTML = '';
            }
            
            // Update the status indicator
            const statusDiv = document.getElementById('ws-status');
            if (statusDiv) {
                statusDiv.textContent = `Live: ${this.msgCount} logs`;
            }
            
            const level = log.level || 'INFO';
            const levelClass = {
                'ERROR': 'text-red-500',
                'WARN': 'text-yellow-500',
                'INFO': 'text-blue-500',
                'DEBUG': 'text-white'
            }[level] || 'text-white';
            
            const logEntry = document.createElement('div');
            logEntry.className = 'mb-4 p-2 border-l-4 border-gray-700';
            
            // Determine if this is a markdown-formatted log or a simple log
            const isMarkdownLog = log.message && (
                log.message.includes('#') || 
                log.message.includes('```') || 
                log.message.includes('|') ||
                log.message.includes('- ') ||
                log.message.includes('> ')
            );
            
            // Create header with metadata
            const header = document.createElement('div');
            header.className = 'flex justify-between items-start mb-2';
            
            // Left side: level and service
            const leftSide = document.createElement('div');
            leftSide.className = 'flex items-center';
            leftSide.innerHTML = `
                <span class="${levelClass} font-medium mr-2">[${level}]</span>
                <span class="text-gray-300">${log.service || 'unknown'}</span>
            `;
            
            // Right side: timestamp and producer
            const rightSide = document.createElement('div');
            rightSide.className = 'text-right';
            rightSide.innerHTML = `
                <div class="text-gray-400 text-xs">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="text-white text-xs">${log.producer_id || 'unknown'}</div>
            `;
            
            header.appendChild(leftSide);
            header.appendChild(rightSide);
            logEntry.appendChild(header);
            
            // Content with special handling for markdown
            const content = document.createElement('div');
            if (isMarkdownLog) {
                content.className = 'text-white markdown-content bg-gray-800 p-3 rounded-md overflow-auto';
                content.innerHTML = renderMarkdown(log.message);
                
                // Add a special indicator for markdown logs
                const markdownBadge = document.createElement('div');
                markdownBadge.className = 'text-xs text-gray-400 mt-1 mb-2';
                markdownBadge.textContent = '✨ Markdown formatted log';
                logEntry.insertBefore(markdownBadge, content);
            } else {
                content.className = 'text-white';
                content.textContent = log.message;
            }
            
            logEntry.appendChild(content);
            
            // Add metadata section if present
            if (log.metadata && Object.keys(log.metadata).length > 0) {
                const metadataToggle = document.createElement('button');
                metadataToggle.className = 'text-xs text-gray-400 mt-2 hover:text-gray-300';
                metadataToggle.textContent = 'Show metadata';
                
                const metadataContent = document.createElement('pre');
                metadataContent.className = 'text-xs text-gray-400 mt-1 hidden';
                metadataContent.textContent = JSON.stringify(log.metadata, null, 2);
                
                metadataToggle.addEventListener('click', () => {
                    if (metadataContent.classList.contains('hidden')) {
                        metadataContent.classList.remove('hidden');
                        metadataToggle.textContent = 'Hide metadata';
                    } else {
                        metadataContent.classList.add('hidden');
                        metadataToggle.textContent = 'Show metadata';
                    }
                });
                
                logEntry.appendChild(metadataToggle);
                logEntry.appendChild(metadataContent);
            }
            
            logsDiv.appendChild(logEntry);
            
            // Scroll to the bottom if we're already at the bottom
            const isAtBottom = logsDiv.scrollHeight - logsDiv.clientHeight <= logsDiv.scrollTop + 50;
            if (isAtBottom) {
                logsDiv.scrollTop = logsDiv.scrollHeight;
            }
            
            // Limit the number of logs to keep memory usage reasonable
            while (logsDiv.children.length > 300) {
                logsDiv.removeChild(logsDiv.firstChild);
            }
        } catch (error) {
            console.error('Error processing log message:', error, event.data);
            this._handleError(error);
        }
    }
    
    _handleError(error) {
        const logsDiv = document.getElementById('live-logs');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 p-2 mb-2 bg-red-100 bg-opacity-20 rounded';
        errorDiv.textContent = `WebSocket error: ${error.message || 'Unknown error'}`;
        logsDiv.appendChild(errorDiv);
        
        // Add "Retry" button
        const retryBtn = document.createElement('button');
        retryBtn.className = 'mt-2 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm';
        retryBtn.textContent = 'Retry Connection';
        retryBtn.onclick = () => this.connect();
        errorDiv.appendChild(document.createElement('br'));
        errorDiv.appendChild(retryBtn);
    }

    _scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
                this.connect();
                this.reconnectAttempts++;
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000); // Exponential backoff, max 10 seconds
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
            const logsDiv = document.getElementById('live-logs');
            logsDiv.innerHTML += `
                <div class="text-red-500 p-4 border border-red-300 rounded-md my-4">
                    <p class="font-medium">Connection lost</p>
                    <p class="text-sm mt-1">Max reconnection attempts reached (${this.maxReconnectAttempts}).</p>
                    <button id="force-reconnect" class="mt-2 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm">
                        Try Again
                    </button>
                </div>
            `;
            
            document.getElementById('force-reconnect').addEventListener('click', () => {
                this.reconnectAttempts = 0;
                this.connect();
            });
        }
    }
}

let logWebSocket = null;

document.addEventListener('visibilitychange', () => {
    // Only reconnect if the page becomes visible and we're on the live tab
    const liveTab = document.getElementById('live-tab');
    
    // Check if live tab exists before accessing it
    if (document.visibilityState === 'visible' && liveTab && !liveTab.classList.contains('hidden')) {
        if (!logWebSocket) {
            logWebSocket = new LogWebSocket();
            logWebSocket.connect();
        }
    }
    // Don't disconnect when the page becomes hidden - this keeps the connection alive
    // when switching tabs in the browser
});

// Agent state management
let currentAgentState = null;
let isAgentStateRefreshing = false;

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize toggle button for raw state
    document.getElementById('toggle-raw-state').addEventListener('click', (e) => {
        const rawStateDiv = document.getElementById('raw-agent-state');
        const button = e.target;
        
        if (rawStateDiv.classList.contains('hidden')) {
            rawStateDiv.classList.remove('hidden');
            button.textContent = 'Hide';
        } else {
            rawStateDiv.classList.add('hidden');
            button.textContent = 'Show';
        }
    });
    
    // Set up model selector dropdown
    setupModelSelector();
    
    // Initial agent state fetch
    refreshAgentState();
});

// Model selector functionality
function setupModelSelector() {
    const modelButton = document.getElementById('model-selector-button');
    const modelDropdown = document.getElementById('model-selector-dropdown');
    
    // Toggle dropdown when button is clicked
    modelButton.addEventListener('click', () => {
        modelDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!modelButton.contains(e.target) && !modelDropdown.contains(e.target)) {
            modelDropdown.classList.add('hidden');
        }
    });
    
    // Add click handlers to all model options
    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', async (e) => {
            e.preventDefault();
            modelDropdown.classList.add('hidden');
            
            const provider = option.dataset.provider;
            const model = option.dataset.model;
            
            await switchModel(provider, model);
        });
    });
    
    // Get current model on load
    getCurrentModel();
}

async function getCurrentModel() {
    try {
        const response = await fetch('/queries/current-model');
        if (!response.ok) {
            throw new Error('Failed to get current model');
        }
        
        const data = await response.json();
        updateCurrentModelDisplay(data.provider, data.model);
    } catch (error) {
        console.error('Error getting current model:', error);
        showNotification('Error getting current model', 'error');
    }
}

async function switchModel(provider, model) {
    const button = document.getElementById('model-selector-button');
    const originalContent = button.innerHTML;
    
    try {
        // Show loading state
        button.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Switching...
        `;
        button.disabled = true;        const response = await fetch('/queries/set-model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model_id: model,
                provider: provider
            })
        });
        
        // Parse response but don't throw yet
        const result = await response.json();
        
        if (!response.ok) {
            // Handle API error
            throw new Error(result.detail || 'Failed to switch model');
        }
        
        // If successful, update the UI
        updateCurrentModelDisplay(provider, model);
        showNotification(`Model switched to ${getModelDisplayName(provider, model)}`);
        
        // After model change, refresh agent state
        await refreshAgentState();
        
    } catch (error) {
        console.error('Error switching model:', error);
        
        // Check if it's an authentication error
        if (error.message.includes('API key') || error.message.includes('Authentication')) {
            // Show error notification with fallback message
            showNotification(`Error with ${provider} API key. System will fall back to Google provider for queries.`, 'error');
            
            // Update UI to indicate fallback behavior
            const displayElement = document.getElementById('current-model-display');
            if (displayElement) {
                displayElement.innerHTML = `<span class="text-yellow-600">⚠️ ${getModelDisplayName(provider, model)}</span>
                                           <span class="text-xs block">(Will use Google for queries)</span>`;
            }
        } else {
            // Generic error
            showNotification(`Error switching model: ${error.message}`, 'error');
        }
        
        // Refresh the agent state to make sure UI is in sync with backend
        await refreshAgentState();
    } finally {
        // Restore button
        button.innerHTML = originalContent;
        button.disabled = false;
    }
}

function updateCurrentModelDisplay(provider, model) {
    const displayElement = document.getElementById('current-model-display');
    
    // Check if display element exists before trying to update it
    if (!displayElement) {
        console.warn('Model display element not found. This may happen if switching models from a different tab.');
        return;
    }
    
    displayElement.textContent = getModelDisplayName(provider, model);
    
    // Update the active class on the selected model in the dropdown
    document.querySelectorAll('.model-option').forEach(option => {
        if (option.dataset.provider === provider && option.dataset.model === model) {
            option.classList.add('bg-indigo-50', 'text-indigo-700');
        } else {
            option.classList.remove('bg-indigo-50', 'text-indigo-700');
        }
    });
}

function getModelDisplayName(provider, model) {
    // Map of provider+model to display names
    const modelDisplayNames = {
        'google:gemini-1.5-pro': 'Gemini 1.5 Pro',
        'google:gemini-pro': 'Gemini Pro',
        'openai:gpt-4o': 'GPT-4o',
        'openai:gpt-4-turbo': 'GPT-4 Turbo',
        'openai:gpt-3.5-turbo': 'GPT-3.5 Turbo',
        'anthropic:claude-3-opus-20240229': 'Claude 3 Opus',
        'anthropic:claude-3-sonnet-20240229': 'Claude 3 Sonnet',
        'anthropic:claude-3-haiku-20240307': 'Claude 3 Haiku',
        'groq:llama3-70b-8192': 'Llama 3 70B',
        'groq:llama3-8b-8192': 'Llama 3 8B',
        'groq:mixtral-8x7b-32768': 'Mixtral 8x7B'
    };
    
    return modelDisplayNames[`${provider}:${model}`] || `${provider} ${model}`;
}

async function refreshAgentState() {
    if (isAgentStateRefreshing) return;
    
    try {        isAgentStateRefreshing = true;
        updateAgentStateIndicator('refreshing');
        
        const response = await fetch('/queries/insights');
        if (!response.ok) {
            throw new Error(`Failed to fetch agent state: ${response.status}`);
        }
        
        const agentState = await response.json();
        currentAgentState = agentState;
        
        // Update the UI with the new state
        updateAgentStateUI(agentState);
        updateAgentStateIndicator('idle');
    } catch (error) {
        console.error('Error fetching agent state:', error);
        updateAgentStateIndicator('error');
    } finally {
        isAgentStateRefreshing = false;
    }
}

function updateAgentStateUI(state) {
    // Update the raw state JSON view
    const rawStateElement = document.querySelector('#raw-agent-state pre');
    if (rawStateElement) {
        rawStateElement.textContent = JSON.stringify(state, null, 2);
    }
    
    // Update agent status
    const lastActivity = state.conversation_history && state.conversation_history.length > 0 
        ? new Date(state.conversation_history[state.conversation_history.length - 1].timestamp)
        : new Date();
    
    document.getElementById('agent-last-activity').textContent = formatTimeAgo(lastActivity);
    document.getElementById('agent-memory-usage').textContent = calculateMemoryUsage(state);
    
    // Update knowledge stats
    const knownIssuesCount = (state.known_issues || []).length;
    document.getElementById('known-issues-count').textContent = knownIssuesCount;
    
    const patternsCount = Object.keys(state.patterns || {}).length;
    document.getElementById('patterns-count').textContent = patternsCount;
    
    const conversationCount = (state.conversation_history || []).length;
    document.getElementById('conversation-count').textContent = conversationCount;
    
    // Update system health insights
    updateSystemHealthFromState(state);
    
    // Update findings timeline
    updateFindingsTimeline(state);
}

function updateAgentStateIndicator(state) {
    const indicator = document.getElementById('agent-state-indicator');
    const statusDot = indicator.querySelector('span:first-child');
    const statusText = indicator.querySelector('span:last-child');
    
    indicator.classList.remove(
        'bg-blue-100', 'text-blue-800',
        'bg-green-100', 'text-green-800',
        'bg-yellow-100', 'text-yellow-800',
        'bg-red-100', 'text-red-800'
    );
    
    statusDot.classList.remove(
        'bg-blue-600', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'
    );
    
    switch (state) {
        case 'idle':
            indicator.classList.add('bg-blue-100', 'text-blue-800');
            statusDot.classList.add('bg-blue-600');
            statusText.textContent = 'Idle';
            
            // Also update the agent tab status indicator
            document.getElementById('agent-status-indicator').className = 'h-3 w-3 rounded-full bg-blue-500 mr-2';
            document.getElementById('agent-status-text').textContent = 'Idle';
            break;
            
        case 'analyzing':
            indicator.classList.add('bg-green-100', 'text-green-800');
            statusDot.classList.add('bg-green-500');
            statusText.textContent = 'Analyzing';
            
            // Also update the agent tab status indicator
            document.getElementById('agent-status-indicator').className = 'h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse';
            document.getElementById('agent-status-text').textContent = 'Analyzing';
            break;
            
        case 'refreshing':
            indicator.classList.add('bg-yellow-100', 'text-yellow-800');
            statusDot.classList.add('bg-yellow-500');
            statusText.textContent = 'Refreshing...';
            break;
            
        case 'error':
            indicator.classList.add('bg-red-100', 'text-red-800');
            statusDot.classList.add('bg-red-500');
            statusText.textContent = 'Error';
            
            // Also update the agent tab status indicator
            document.getElementById('agent-status-indicator').className = 'h-3 w-3 rounded-full bg-red-500 mr-2';
            document.getElementById('agent-status-text').textContent = 'Error';
            break;
    }
}

function updateSystemHealthFromState(state) {
    // Count errors and warnings from the findings
    let criticalErrors = 0;
    let warningCount = 0;
    const serviceHealth = {};
    
    // Extract system health information from findings
    if (state.findings && state.findings.length > 0) {
        state.findings.forEach(finding => {
            const lowercaseAnalysis = finding.analysis.toLowerCase();
            
            // Count critical errors
            if (
                lowercaseAnalysis.includes('critical error') || 
                lowercaseAnalysis.includes('severe issue') ||
                lowercaseAnalysis.includes('urgent problem')
            ) {
                criticalErrors++;
            }
            
            // Count warnings
            if (
                lowercaseAnalysis.includes('warning') || 
                lowercaseAnalysis.includes('potential issue') ||
                lowercaseAnalysis.includes('might be problematic')
            ) {
                warningCount++;
            }
            
            // Extract service names and track health
            const serviceMatches = finding.analysis.match(/service[:\s]+([a-zA-Z0-9-_]+)/gi);
            if (serviceMatches) {
                serviceMatches.forEach(match => {
                    const service = match.replace(/service[:\s]+/i, '').trim();
                    if (lowercaseAnalysis.includes('error') && service) {
                        serviceHealth[service] = 'error';
                    } else if (lowercaseAnalysis.includes('warning') && service) {
                        serviceHealth[service] !== 'error' ? 'warning' : serviceHealth[service];
                    } else if (service) {
                        serviceHealth[service] = serviceHealth[service] || 'healthy';
                    }
                });
            }
        });
    }
    
    // Update the UI
    document.getElementById('critical-errors').textContent = criticalErrors;
    document.getElementById('warning-count').textContent = warningCount;
    
    const healthyServices = Object.values(serviceHealth).filter(health => health === 'healthy').length;
    document.getElementById('healthy-services').textContent = 
        healthyServices + '/' + Object.keys(serviceHealth).length;
}

function updateFindingsTimeline(state) {
    const timelineEl = document.getElementById('findings-timeline');
    
    // No findings available
    if (!state.findings || state.findings.length === 0) {
        timelineEl.innerHTML = '<div class="text-sm text-white text-center py-6">No findings available yet.</div>';
        return;
    }
    
    // Sort findings by timestamp (newest first)
    const sortedFindings = [...state.findings].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    let timelineHTML = '';
    
    sortedFindings.forEach((finding, index) => {
        // Extract a title from the analysis (first line or sentence)
        let title = finding.query;
        if (title.length > 70) {
            title = title.substring(0, 70) + '...';
        }
        
        const timestamp = new Date(finding.timestamp);
        
        // Create a finding card with time and analysis excerpt
        timelineHTML += `
            <div class="relative pb-4 ${index < sortedFindings.length - 1 ? 'border-l-2 border-gray-200 pl-6' : 'pl-6'}">
                <div class="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500"></div>
                <div class="bg-white rounded-lg shadow-sm p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="text-sm font-medium text-gray-900">${title}</h4>
                        <span class="text-xs text-white">${formatTimeAgo(timestamp)}</span>
                    </div>
                    <div class="text-sm text-gray-600 markdown-content">
                        ${renderMarkdown(truncateAnalysis(finding.analysis, 150))}
                    </div>
                </div>
            </div>
        `;
    });
    
    timelineEl.innerHTML = timelineHTML;
}

function truncateAnalysis(analysis, maxLength) {
    if (analysis.length <= maxLength) return analysis;
    
    // Find a convenient break point
    const breakPoint = analysis.lastIndexOf('.', maxLength);
    if (breakPoint > maxLength * 0.7) {
        return analysis.substring(0, breakPoint + 1) + ' [...]';
    }
    
    return analysis.substring(0, maxLength) + ' [...]';
}

function calculateMemoryUsage(state) {
    let count = 0;
    
    // Count conversation history
    count += (state.conversation_history || []).length;
    
    // Count findings
    count += (state.findings || []).length;
    
    // Count known issues
    count += (state.known_issues || []).length;
    
    // Count patterns
    count += Object.keys(state.patterns || {}).length;
    
    return count;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
}

// Initialize the active tab based on URL hash or default to ingest
function initializeActiveTab() {
    const hash = window.location.hash.substring(1);
    if (hash && ['ingest', 'query', 'agent', 'live'].includes(hash)) {
        showTab(hash);
    } else {
        showTab('ingest');
    }
}

// Call on page load
window.addEventListener('DOMContentLoaded', initializeActiveTab);
window.addEventListener('hashchange', initializeActiveTab);

// Database connection and log streaming functionality
class DatabaseLogStreamer {
    constructor() {
        this.connected = false;
        this.paused = false;
        this.connectionConfig = null;
        this.streamInterval = null;
        this.logCount = 0;
        this.lastTimestamp = null;
        this.savedConnections = this.loadSavedConnections();
        this.availableTables = [];
    }

    // Connect to database and start streaming logs
    async connect(config) {
        try {
            this.connectionConfig = config;
            
            // Show connecting state
            const logsContainer = document.getElementById('db-logs-container');
            logsContainer.innerHTML = '<div class="text-center py-6"><div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div><p class="mt-2 text-white">Connecting to database...</p></div>';
            
            // Test connection first
            const testResponse = await fetch('/ingest/database/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!testResponse.ok) {
                const error = await testResponse.json();
                throw new Error(error.detail || 'Failed to connect to database');
            }
            
            // Connection successful, set up streaming
            this.connected = true;
            this.paused = false;
            this.logCount = 0;
            this.lastTimestamp = null;
            
            // Start the polling/streaming interval
            this.startStreaming();
            
            // Update UI
            this.updateUIForConnectedState();
            
            // Save the connection if requested
            if (config.save_connection) {
                this.saveConnection(config);
            }
            
            return true;
        } catch (error) {
            console.error('Database connection error:', error);
            const logsContainer = document.getElementById('db-logs-container');
            logsContainer.innerHTML = `<div class="text-red-500 p-4"><p class="font-medium">Connection Error</p><p>${error.message}</p></div>`;
            return false;
        }
    }

    // List available tables in the database
    async listTables(config) {
        try {
            // Show loading state for table list
            const tablesList = document.getElementById('tables-list');
            tablesList.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div><p class="mt-2 text-sm text-white">Retrieving tables...</p></div>';
            
            // Ensure the table browser section is visible
            document.getElementById('table-browser-section').classList.remove('hidden');
            
            // Fetch tables from the API
            const response = await fetch('/ingest/database/list-tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to list tables');
            }
            
            const result = await response.json();
            this.availableTables = result.tables || [];
            
            if (this.availableTables.length === 0) {
                tablesList.innerHTML = '<p class="text-sm text-white text-center py-4">No tables found in database.</p>';
                return;
            }
            
            // Display the tables with selection buttons
            let html = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">';
            
            this.availableTables.forEach(table => {
                html += `
                    <div class="p-2 border border-gray-200 rounded flex justify-between items-center">
                        <span class="text-sm text-gray-700">${table}</span>
                        <button type="button" data-table="${table}" class="select-table-btn px-2 py-1 text-xs text-white bg-indigo-500 hover:bg-indigo-600 rounded">
                            Select
                        </button>
                    </div>
                `;
            });
            
            html += '</div>';
            tablesList.innerHTML = html;
            
            // Add event listeners for table selection
            document.querySelectorAll('.select-table-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tableName = e.target.dataset.table;
                    this.selectTable(tableName);
                });
            });
            
            return this.availableTables;
        } catch (error) {
            console.error('Error listing tables:', error);
            const tablesList = document.getElementById('tables-list');
            tablesList.innerHTML = `<div class="text-red-500 p-2 text-sm">Error listing tables: ${error.message}</div>`;
            return [];
        }
    }
    
    // Handle table selection
    selectTable(tableName) {
        // Set the selected table in the log_query field
        const queryField = document.querySelector('textarea[name="log_query"]');
        queryField.value = tableName;
        
        // Show a notification
        showNotification(`Selected table: ${tableName}`);
        
        // Suggest field mappings based on table name (if it looks like a logs table)
        this.suggestFieldMappings(tableName);
    }
    
    // Suggest field mappings based on table name
    suggestFieldMappings(tableName) {
        const lowerTableName = tableName.toLowerCase();
        
        // Only make suggestions for tables that seem to be log tables
        if (lowerTableName.includes('log') || lowerTableName.includes('event')) {
            // Common field mapping patterns
            const mappingSuggestions = {
                // For tables named 'logs'
                'logs': {
                    timestamp: 'timestamp',
                    level: 'level',
                    message: 'message',
                    service: 'service'
                },
                // For tables named 'events' or 'log_events'
                'events': {
                    timestamp: 'created_at',
                    level: 'severity',
                    message: 'description',
                    service: 'source'
                },
                'log_events': {
                    timestamp: 'created_at',
                    level: 'level',
                    message: 'message',
                    service: 'service_name'
                },
                // For tables with 'audit' in the name
                'audit': {
                    timestamp: 'timestamp',
                    level: 'action_type',
                    message: 'details',
                    service: 'user_id'
                }
            };
            
            // Find the best matching pattern
            let bestMatch = null;
            
            for (const pattern in mappingSuggestions) {
                if (lowerTableName.includes(pattern)) {
                    bestMatch = pattern;
                    break;
                }
            }
            
            // Apply suggestions if a match was found
            if (bestMatch) {
                const mappings = mappingSuggestions[bestMatch];
                
                document.querySelector('input[name="timestamp_field"]').value = mappings.timestamp;
                document.querySelector('input[name="level_field"]').value = mappings.level;
                document.querySelector('input[name="message_field"]').value = mappings.message;
                document.querySelector('input[name="service_field"]').value = mappings.service;
            }
        }
    }
    
    // Start streaming logs using polling or WebSocket
    startStreaming() {
        // Clear any existing interval
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
        }
        
        // Start with an immediate fetch
        this.fetchLogs();
        
        // Then set up regular polling
        const interval = this.connectionConfig.refresh_interval * 1000 || 10000; // Default to 10 seconds
        this.streamInterval = setInterval(() => {
            if (!this.paused && this.connected) {
                this.fetchLogs();
            }
        }, interval);
    }

    // Fetch logs from the server
    async fetchLogs() {
        if (!this.connected || this.paused) return;
        
        try {
            // Create fetch params including the last timestamp if we have one
            const params = {
                ...this.connectionConfig,
                last_timestamp: this.lastTimestamp
            };
            
            const response = await fetch('/ingest/database/fetch-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to fetch logs');
            }
            
            const result = await response.json();
            
            // Process the logs
            if (result.logs && result.logs.length > 0) {
                this.displayLogs(result.logs);
                this.logCount += result.logs.length;
                
                // Update the last timestamp for incremental fetching
                if (result.logs.length > 0) {
                    const lastLog = result.logs[result.logs.length - 1];
                    this.lastTimestamp = lastLog.timestamp;
                }
                
                // Update stats
                this.updateStreamStats();
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            
            // Only show an error message if we're still connected (to avoid duplicate errors)
            if (this.connected) {
                const logsContainer = document.getElementById('db-logs-container');
                logsContainer.innerHTML += `<div class="text-red-500 p-2 mb-2 border border-red-300 border-opacity-20 rounded"><p>Error fetching logs: ${error.message}</p></div>`;
            }
        }
    }

    // Display logs in the UI
    displayLogs(logs) {
        const logsContainer = document.getElementById('db-logs-container');
        
        // Clear the "connecting" message on first logs
        if (this.logCount === 0) {
            logsContainer.innerHTML = '';
        }
        
        logs.forEach(log => {
            const level = log.level || 'INFO';
            const levelClass = {
                'ERROR': 'text-red-500',
                'WARN': 'text-yellow-500',
                'INFO': 'text-blue-500',
                'DEBUG': 'text-white'
            }[level] || 'text-white';
            
            const logEntry = document.createElement('div');
            logEntry.className = 'mb-4 p-2 border-l-4 border-gray-700';
            
            // Determine if this is a markdown-formatted log or a simple log
            const isMarkdownLog = log.message && (
                log.message.includes('#') || 
                log.message.includes('```') || 
                log.message.includes('|') ||
                log.message.includes('- ') ||
                log.message.includes('> ')
            );
            
            // Create header with metadata
            const header = document.createElement('div');
            header.className = 'flex justify-between items-start mb-2';
            
            // Left side: level and service
            const leftSide = document.createElement('div');
            leftSide.className = 'flex items-center';
            leftSide.innerHTML = `
                <span class="${levelClass} font-medium mr-2">[${level}]</span>
                <span class="text-gray-300">${log.service || 'database'}</span>
            `;
            
            // Right side: timestamp
            const rightSide = document.createElement('div');
            rightSide.className = 'text-right';
            rightSide.innerHTML = `
                <div class="text-gray-400 text-xs">${new Date(log.timestamp).toLocaleString()}</div>
            `;
            
            header.appendChild(leftSide);
            header.appendChild(rightSide);
            logEntry.appendChild(header);
            
            // Content with special handling for markdown
            const content = document.createElement('div');
            if (isMarkdownLog) {
                content.className = 'text-white markdown-content bg-gray-800 p-3 rounded-md overflow-auto';
                content.innerHTML = renderMarkdown(log.message);
                
                // Add a special indicator for markdown logs
                const markdownBadge = document.createElement('div');
                markdownBadge.className = 'text-xs text-gray-400 mt-1 mb-2';
                markdownBadge.textContent = '✨ Markdown formatted log';
                logEntry.insertBefore(markdownBadge, content);
            } else {
                content.className = 'text-white';
                content.textContent = log.message;
            }
            
            logEntry.appendChild(content);
            
            // Add metadata section if present
            if (log.metadata && Object.keys(log.metadata).length > 0) {
                const metadataToggle = document.createElement('button');
                metadataToggle.className = 'text-xs text-gray-400 mt-2 hover:text-gray-300';
                metadataToggle.textContent = 'Show metadata';
                
                const metadataContent = document.createElement('pre');
                metadataContent.className = 'text-xs text-gray-400 mt-1 hidden';
                metadataContent.textContent = JSON.stringify(log.metadata, null, 2);
                
                metadataToggle.addEventListener('click', () => {
                    if (metadataContent.classList.contains('hidden')) {
                        metadataContent.classList.remove('hidden');
                        metadataToggle.textContent = 'Hide metadata';
                    } else {
                        metadataContent.classList.add('hidden');
                        metadataToggle.textContent = 'Show metadata';
                    }
                });
                
                logEntry.appendChild(metadataToggle);
                logEntry.appendChild(metadataContent);
            }
            
            logsContainer.appendChild(logEntry);
            
            // Scroll to the bottom if we're already at the bottom
            const isAtBottom = logsContainer.scrollHeight - logsContainer.clientHeight <= logsContainer.scrollTop + 50;
            if (isAtBottom) {
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
            
            // Limit the number of logs to keep memory usage reasonable
            while (logsContainer.children.length > 300) {
                logsContainer.removeChild(logsContainer.firstChild);
            }
        });
    }

    // Update the stream stats display
    updateStreamStats() {
        const statsDiv = document.getElementById('stream-stats');
        statsDiv.classList.remove('hidden');
        
        document.getElementById('current-db-connection').textContent = this.getConnectionDisplayName();
        document.getElementById('logs-count').textContent = this.logCount;
        document.getElementById('last-update-time').textContent = new Date().toLocaleTimeString();
    }

    // Get a display name for the current connection
    getConnectionDisplayName() {
        const config = this.connectionConfig;
        if (!config) return 'Unknown';
        
        if (config.uri) {
            // Remove password from displayed URI
            const uri = config.uri.replace(/:([^@]+)@/, ':****@');
            return uri;
        } else {
            return `${config.db_type}://${config.username}:****@${config.host}:${config.port}/${config.database}`;
        }
    }

    // Pause streaming
    pause() {
        this.paused = true;
        this.updateUIForPausedState();
    }

    // Resume streaming
    resume() {
        this.paused = false;
        this.updateUIForResumedState();
        
        // Immediately fetch logs
        this.fetchLogs();
    }

    // Disconnect from database
    disconnect() {
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }
        
        this.connected = false;
        this.updateUIForDisconnectedState();
    }

    // Update UI elements for connected state
    updateUIForConnectedState() {
        // Show the control buttons
        document.getElementById('pause-stream-button').classList.remove('hidden');
        document.getElementById('disconnect-button').classList.remove('hidden');
        
        // Hide the form or disable inputs
        document.querySelectorAll('#db-connection-form input, #db-connection-form select, #db-connection-form textarea, #db-connection-form button[type="submit"]').forEach(el => {
            el.disabled = true;
        });
        
        // Show stats
        document.getElementById('stream-stats').classList.remove('hidden');
    }

    // Update UI elements for paused state
    updateUIForPausedState() {
        document.getElementById('pause-stream-button').classList.add('hidden');
        document.getElementById('resume-stream-button').classList.remove('hidden');
    }

    // Update UI elements for resumed state
    updateUIForResumedState() {
        document.getElementById('pause-stream-button').classList.remove('hidden');
        document.getElementById('resume-stream-button').classList.add('hidden');
    }

    // Update UI elements for disconnected state
    updateUIForDisconnectedState() {
        // Hide control buttons
        document.getElementById('pause-stream-button').classList.add('hidden');
        document.getElementById('resume-stream-button').classList.add('hidden');
        document.getElementById('disconnect-button').classList.add('hidden');
        
        // Reset form
        document.querySelectorAll('#db-connection-form input, #db-connection-form select, #db-connection-form textarea, #db-connection-form button[type="submit"]').forEach(el => {
            el.disabled = false;
        });
        
        // Reset logs display
        const logsContainer = document.getElementById('db-logs-container');
        logsContainer.innerHTML = '<p class="text-center text-white">Connect to a database to view logs.</p>';
        
        // Hide stats
        document.getElementById('stream-stats').classList.add('hidden');
    }

    // Load saved connections from localStorage
    loadSavedConnections() {
        try {
            const saved = localStorage.getItem('dbConnections');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading saved connections:', e);
            return [];
        }
    }

    // Save a connection to localStorage
    saveConnection(config) {
        try {
            // Create a copy of the config without sensitive fields in plain text
            const safeConfig = { ...config };
            
            // Add a display name and ID
            safeConfig.id = Date.now().toString();
            safeConfig.displayName = this.getConnectionDisplayName();
            
            // Use a simple encryption for password
            if (safeConfig.password) {
                safeConfig.password = this.encryptValue(safeConfig.password);
            }
            
            // Add to saved connections
            this.savedConnections.push(safeConfig);
            
            // Store in localStorage
            localStorage.setItem('dbConnections', JSON.stringify(this.savedConnections));
            
            // Update the UI
            this.updateSavedConnectionsList();
            
            return true;
        } catch (e) {
            console.error('Error saving connection:', e);
            return false;
        }
    }

    // Delete a saved connection
    deleteConnection(id) {
        this.savedConnections = this.savedConnections.filter(conn => conn.id !== id);
        localStorage.setItem('dbConnections', JSON.stringify(this.savedConnections));
        this.updateSavedConnectionsList();
    }

    // Update the UI with saved connections
    updateSavedConnectionsList() {
        const container = document.getElementById('connections-list');
        
        if (!this.savedConnections || this.savedConnections.length === 0) {
            container.innerHTML = '<p class="text-sm text-white text-center">No saved connections found.</p>';
            return;
        }
        
        // Create the list
        let html = '<div class="space-y-2">';
        
        this.savedConnections.forEach(conn => {
            html += `
                <div class="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                    <div class="overflow-hidden">
                        <p class="text-sm font-medium text-gray-800 truncate">${conn.displayName}</p>
                        <p class="text-xs text-white">${conn.db_type} • Last used: ${conn.lastUsed || 'Never'}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button data-connection-id="${conn.id}" class="connect-saved text-xs px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600">
                            Connect
                        </button>
                        <button data-connection-id="${conn.id}" class="delete-saved text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.connect-saved').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.connectionId;
                const connection = this.savedConnections.find(c => c.id === id);
                
                if (connection) {
                    // Decrypt password if it exists
                    if (connection.password) {
                        connection.password = this.decryptValue(connection.password);
                    }
                    
                    // Update the form with connection details
                    this.fillConnectionForm(connection);
                    
                    // Mark the last used date
                    connection.lastUsed = new Date().toISOString();
                    localStorage.setItem('dbConnections', JSON.stringify(this.savedConnections));
                    
                    // Connect automatically
                    document.getElementById('db-connection-form').dispatchEvent(new Event('submit'));
                }
            });
        });
        
        document.querySelectorAll('.delete-saved').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.connectionId;
                
                if (confirm('Are you sure you want to delete this saved connection?')) {
                    this.deleteConnection(id);
                }
            });
        });
    }

    // Fill the connection form with saved connection details
    fillConnectionForm(connection) {
        // Set the database type
        document.getElementById('db-type').value = connection.db_type;
        
        if (connection.uri) {
            // Use URI mode
            document.getElementById('uri-field').classList.remove('hidden');
            document.getElementById('detailed-connection-fields').classList.add('hidden');
            document.querySelector('input[name="uri"]').value = connection.uri;
        } else {
            // Use detailed mode
            document.getElementById('uri-field').classList.add('hidden');
            document.getElementById('detailed-connection-fields').classList.remove('hidden');
            
            // Fill in detailed fields
            document.querySelector('input[name="host"]').value = connection.host || '';
            document.querySelector('input[name="port"]').value = connection.port || '';
            document.querySelector('input[name="database"]').value = connection.database || '';
            document.querySelector('input[name="username"]').value = connection.username || '';
            document.querySelector('input[name="password"]').value = connection.password || '';
        }
        
        // Fill in query and other fields
        document.querySelector('textarea[name="log_query"]').value = connection.log_query || '';
        document.querySelector('input[name="refresh_interval"]').value = connection.refresh_interval || '10';
        
        // Field mappings
        document.querySelector('input[name="timestamp_field"]').value = connection.timestamp_field || '';
        document.querySelector('input[name="message_field"]').value = connection.message_field || '';
        document.querySelector('input[name="level_field"]').value = connection.level_field || '';
        document.querySelector('input[name="service_field"]').value = connection.service_field || '';
    }

    // Very simple "encryption" for storing passwords (not secure, just obscures them)
    encryptValue(value) {
        return btoa(value);
    }

    // Decrypt the encrypted values
    decryptValue(value) {
        return atob(value);
    }
}

// Create DB streamer instance
let dbStreamer = new DatabaseLogStreamer();

// Initialize database log streaming functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the connection form
    const connectionForm = document.getElementById('db-connection-form');
    const toggleConnectionDetails = document.getElementById('toggle-connection-details');
    const useDefaultLogQuery = document.getElementById('use-default-log-query');
    const pauseButton = document.getElementById('pause-stream-button');
    const resumeButton = document.getElementById('resume-stream-button');
    const disconnectButton = document.getElementById('disconnect-button');
    const listTablesButton = document.getElementById('list-tables-button');
    
    // Toggle between URI and detailed connection fields
    toggleConnectionDetails.addEventListener('click', () => {
        const uriField = document.getElementById('uri-field');
        const detailedFields = document.getElementById('detailed-connection-fields');
        
        if (uriField.classList.contains('hidden')) {
            // Switch to URI mode
            uriField.classList.remove('hidden');
            detailedFields.classList.add('hidden');
            toggleConnectionDetails.textContent = 'Use detailed connection fields instead';
        } else {
            // Switch to detailed mode
            uriField.classList.add('hidden');
            detailedFields.classList.remove('hidden');
            toggleConnectionDetails.textContent = 'Use connection URI instead';
        }
    });
    
    // Add event listener for the "Browse Tables" button
    listTablesButton.addEventListener('click', async () => {
        const formData = new FormData(connectionForm);
        const config = {
            db_type: formData.get('db_type')
        };
        
        // Check if we're using URI or detailed fields
        if (!document.getElementById('uri-field').classList.contains('hidden')) {
            config.uri = formData.get('uri');
            
            // Validate that URI is provided
            if (!config.uri) {
                showNotification('Please provide a database URI', 'error');
                return;
            }
        } else {
            config.host = formData.get('host');
            config.port = formData.get('port');
            config.database = formData.get('database');
            config.username = formData.get('username');
            config.password = formData.get('password');
            
            // Validate required fields
            if (!config.host || !config.database || !config.username) {
                showNotification('Please provide host, database, and username', 'error');
                return;
            }
        }
        
        // Show loading state
        const listTablesText = document.getElementById('list-tables-text');
        const listTablesSpinner = document.getElementById('list-tables-spinner');
        
        listTablesButton.disabled = true;
        listTablesSpinner.classList.remove('hidden');
        listTablesText.textContent = 'Loading...';
        
        try {
            // List available tables
            await dbStreamer.listTables(config);
            showNotification('Successfully retrieved database tables');
        } catch (error) {
            console.error('Error listing tables:', error);
            showNotification('Error listing tables: ' + error.message, 'error');
        } finally {
            // Reset button state
            listTablesButton.disabled = false;
            listTablesSpinner.classList.add('hidden');
            listTablesText.textContent = 'Browse Tables';
        }
    });
    
    // Set default log query based on database type
    useDefaultLogQuery.addEventListener('click', () => {
        const dbType = document.getElementById('db-type').value;
        const queryField = document.querySelector('textarea[name="log_query"]');
        
        const defaultQueries = {
            postgresql: 'SELECT created_at as timestamp, log_level as level, message, service_name as service, metadata FROM logs ORDER BY created_at DESC LIMIT 100',
            mysql: 'SELECT created_at as timestamp, log_level as level, message, service_name as service, metadata FROM logs ORDER BY created_at DESC LIMIT 100',
            supabase: 'logs',
            neon: 'SELECT created_at as timestamp, level, message, context as metadata FROM log_events ORDER BY created_at DESC LIMIT 100',
            sqlite: 'SELECT timestamp, level, message, source as service, extra as metadata FROM logs ORDER BY timestamp DESC LIMIT 100'
        };
        
        queryField.value = defaultQueries[dbType] || 'logs';
    });
    
    // Handle form submission
    connectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(e.target);
        const config = {
            db_type: formData.get('db_type')
        };
        
        // Check if we're using URI or detailed fields
        if (!document.getElementById('uri-field').classList.contains('hidden')) {
            config.uri = formData.get('uri');
        } else {
            config.host = formData.get('host');
            config.port = formData.get('port');
            config.database = formData.get('database');
            config.username = formData.get('username');
            config.password = formData.get('password');
        }
        
        // Get other fields
        config.log_query = formData.get('log_query');
        config.refresh_interval = parseInt(formData.get('refresh_interval')) || 10;
        config.save_connection = formData.get('save_connection') === 'on';
        
        // Field mappings
        config.field_mappings = {
            timestamp: formData.get('timestamp_field') || 'timestamp',
            message: formData.get('message_field') || 'message',
            level: formData.get('level_field') || 'level',
            service: formData.get('service_field') || 'service'
        };
        
        // Show connecting state
        const connectButton = document.getElementById('connect-button');
        const connectSpinner = document.getElementById('connect-spinner');
        const connectText = document.getElementById('connect-text');
        
        connectButton.disabled = true;
        connectSpinner.classList.remove('hidden');
        connectText.textContent = 'Connecting...';
        
        try {
            // Connect to the database
            const success = await dbStreamer.connect(config);
            
            if (!success) {
                throw new Error('Failed to connect to database');
            }
            
            // Update the saved connections list
            dbStreamer.updateSavedConnectionsList();
            
            // Show notification
            showNotification('Successfully connected to database');
        } catch (error) {
            console.error('Connection error:', error);
            showNotification('Error connecting to database: ' + error.message, 'error');
            
            // Reset the form state
            connectButton.disabled = false;
            connectSpinner.classList.add('hidden');
            connectText.textContent = 'Connect and Stream Logs';
        }
    });
    
    // Pause button handler
    pauseButton.addEventListener('click', () => {
        dbStreamer.pause();
        showNotification('Stream paused');
    });
    
    // Resume button handler
    resumeButton.addEventListener('click', () => {
        dbStreamer.resume();
        showNotification('Stream resumed');
    });
    
    // Disconnect button handler
    disconnectButton.addEventListener('click', () => {
        dbStreamer.disconnect();
        showNotification('Disconnected from database');
    });
    
    // Initialize saved connections list
    dbStreamer.updateSavedConnectionsList();
});

// Dashboard Management
let dashboardData = {};
let dashboardUpdateInterval = null;

async function refreshDashboard() {
    try {
        console.log('Refreshing dashboard...');
        showNotification('Loading dashboard data...', 'info');
        
        // Get logs from the current session or database
        const logs = await getCurrentLogs();
        
        if (!logs || logs.length === 0) {
            console.log('No logs available for dashboard');
            showNotification('No logs available for dashboard', 'warning');
            // Show empty dashboard state
            updateEmptyDashboard();
            return;
        }

        console.log(`Found ${logs.length} logs for dashboard`);        const response = await fetch('/metrics/dashboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logs)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        dashboardData = await response.json();
        console.log('Dashboard data received:', dashboardData);
        updateDashboardUI();
        showNotification('Dashboard updated successfully');
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showNotification(`Failed to refresh dashboard: ${error.message}`, 'error');
        // Show error state but still populate with sample data
        updateEmptyDashboard();
    }
}

function updateEmptyDashboard() {
    // Update with placeholder data
    document.getElementById('total-logs-count').textContent = '0';
    document.getElementById('logs-per-second').textContent = '0.0 logs/sec';
    document.getElementById('error-rate').textContent = '0.0%';
    document.getElementById('error-count').textContent = '0 errors';
    document.getElementById('system-health').textContent = '100%';
    document.getElementById('system-status').textContent = 'Healthy';
    document.getElementById('active-services').textContent = '0';
    document.getElementById('unique-users').textContent = '0 users';
    
    document.getElementById('logs-per-hour').textContent = '0';
    document.getElementById('logs-per-minute').textContent = '0.0';
    document.getElementById('avg-response-time').textContent = 'N/A';
    document.getElementById('p95-response-time').textContent = 'N/A';
    document.getElementById('unique-users-detail').textContent = '0';
    document.getElementById('unique-sessions').textContent = '0';
    
    // Clear services and trends
    document.getElementById('top-services').innerHTML = '<p class="text-white text-center py-4">No services data available</p>';
    document.getElementById('recent-trends').innerHTML = '<p class="text-white text-center py-4">No trends data available</p>';
}

function updateDashboardUI() {
    const data = dashboardData;
    
    if (!data.current_metrics) return;
    
    // Update metric cards
    document.getElementById('total-logs-count').textContent = data.current_metrics.total_logs || 0;
    document.getElementById('logs-per-second').textContent = `${(data.current_metrics.logs_per_second || 0).toFixed(2)} logs/sec`;
    document.getElementById('error-rate').textContent = `${((data.current_metrics.error_rate || 0) * 100).toFixed(1)}%`;
    document.getElementById('error-count').textContent = `${Math.round((data.current_metrics.error_rate || 0) * data.current_metrics.total_logs)} errors`;
    document.getElementById('system-health').textContent = `${(data.performance_metrics?.system_health_score || 100).toFixed(0)}%`;
    document.getElementById('system-status').textContent = data.real_time_stats?.system_status || 'Unknown';
    document.getElementById('active-services').textContent = data.real_time_stats?.active_services || 0;
    document.getElementById('unique-users').textContent = `${data.current_metrics.unique_users || 0} users`;

    // Update performance metrics
    if (data.performance_metrics?.throughput) {
        document.getElementById('logs-per-hour').textContent = (data.performance_metrics.throughput.logs_per_hour || 0).toFixed(0);
        document.getElementById('logs-per-minute').textContent = (data.performance_metrics.throughput.logs_per_minute || 0).toFixed(1);
    }
    
    if (data.current_metrics.response_time_avg) {
        document.getElementById('avg-response-time').textContent = `${data.current_metrics.response_time_avg.toFixed(0)}ms`;
    }
    
    if (data.current_metrics.response_time_p95) {
        document.getElementById('p95-response-time').textContent = `${data.current_metrics.response_time_p95.toFixed(0)}ms`;
    }
    
    document.getElementById('unique-users-detail').textContent = data.current_metrics.unique_users || 0;
    document.getElementById('unique-sessions').textContent = data.current_metrics.unique_sessions || 0;

    // Update top services
    updateTopServices(data.current_metrics.top_services || []);
    
    // Update recent trends
    updateRecentTrends(data.recent_trends || []);
}

function updateTopServices(services) {
    const container = document.getElementById('top-services');
    container.innerHTML = '';
    
    services.slice(0, 5).forEach(service => {
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg';
        serviceDiv.innerHTML = `
            <span class="text-sm font-medium text-gray-900">${service.service}</span>
            <div class="text-right">
                <span class="text-sm text-gray-600">${service.count} logs</span>
                <div class="text-xs text-white">${service.percentage.toFixed(1)}%</div>
            </div>
        `;
        container.appendChild(serviceDiv);
    });
}

function updateRecentTrends(trends) {
    const container = document.getElementById('recent-trends');
    container.innerHTML = '';
    
    trends.slice(-6).forEach(trend => {
        const trendDiv = document.createElement('div');
        trendDiv.className = 'flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg';
        trendDiv.innerHTML = `
            <span class="text-sm font-medium text-gray-900">${trend.hour}</span>
            <div class="text-right">
                <span class="text-sm text-gray-600">${trend.logs} logs</span>
                <div class="text-xs ${trend.error_rate > 0.1 ? 'text-red-500' : 'text-green-500'}">${(trend.error_rate * 100).toFixed(1)}% errors</div>
            </div>
        `;
        container.appendChild(trendDiv);
    });
}

// Alert Management
let alertRules = [];
let activeAlerts = [];

async function refreshAlerts() {
    try {
        showNotification('Loading alerts...', 'info');
        
        // Get alert rules
        const rulesResponse = await fetch('/alerts/rules');
        if (rulesResponse.ok) {
            alertRules = await rulesResponse.json();
        }
        
        // Get active alerts
        const alertsResponse = await fetch('/alerts/active');
        if (alertsResponse.ok) {
            activeAlerts = await alertsResponse.json();
        }
        
        // Get alert summary
        const summaryResponse = await fetch('/alerts/summary');
        if (summaryResponse.ok) {
            const summary = await summaryResponse.json();
            updateAlertSummary(summary);
        }
        
        updateAlertRulesUI();
        updateActiveAlertsUI();
        showNotification('Alerts updated successfully');
    } catch (error) {
        console.error('Error refreshing alerts:', error);
        showNotification(`Failed to refresh alerts: ${error.message}`, 'error');
    }
}

function updateAlertSummary(summary) {
    document.getElementById('critical-alerts-count').textContent = summary.critical_alerts || 0;
    document.getElementById('high-alerts-count').textContent = summary.high_alerts || 0;
    document.getElementById('medium-alerts-count').textContent = summary.medium_alerts || 0;
    document.getElementById('low-alerts-count').textContent = summary.low_alerts || 0;
    
    // Update navbar alert count
    const alertCount = document.getElementById('alert-count');
    const totalAlerts = summary.total_alerts || 0;
    if (totalAlerts > 0) {
        alertCount.textContent = totalAlerts;
        alertCount.classList.remove('hidden');
    } else {
        alertCount.classList.add('hidden');
    }
}

function updateActiveAlertsUI() {
    const container = document.getElementById('active-alerts');
    container.innerHTML = '';
    
    if (activeAlerts.length === 0) {
        container.innerHTML = `
            <div class="text-center text-white py-8">
                <i class="fas fa-bell-slash text-4xl text-gray-300 mb-2"></i>
                <p>No active alerts</p>
            </div>
        `;
        return;
    }
    
    activeAlerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        const severityColor = getSeverityColor(alert.severity);
        alertDiv.className = `border-l-4 ${severityColor.border} bg-${severityColor.bg} p-4 rounded-lg`;
        alertDiv.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h4 class="text-sm font-medium ${severityColor.text}">${alert.rule_name}</h4>
                    <p class="text-sm text-gray-600 mt-1">${alert.message}</p>
                    <div class="flex items-center mt-2 text-xs text-white">
                        <span>Severity: ${alert.severity}</span>
                        <span class="mx-2">•</span>
                        <span>Logs: ${alert.log_count}</span>
                        <span class="mx-2">•</span>
                        <span>${new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                </div>
                <div class="flex space-x-2 ml-4">
                    <button onclick="acknowledgeAlert('${alert.id}')" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                        Acknowledge
                    </button>
                </div>
            </div>
        `;
        container.appendChild(alertDiv);
    });
}

function updateAlertRulesUI() {
    const container = document.getElementById('alert-rules');
    container.innerHTML = '';
    
    if (alertRules.length === 0) {
        container.innerHTML = `
            <div class="text-center text-white py-8">
                <i class="fas fa-plus-circle text-4xl text-gray-300 mb-2"></i>
                <p>No alert rules configured</p>
                <button onclick="showCreateAlertModal()" class="mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    Create First Rule
                </button>
            </div>
        `;
        return;
    }
    
    alertRules.forEach(rule => {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'border border-gray-200 rounded-lg p-4 bg-white';
        ruleDiv.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h4 class="text-sm font-medium text-gray-900">${rule.name}</h4>
                    <p class="text-sm text-gray-600 mt-1">Pattern: "${rule.pattern}"</p>
                    <div class="flex items-center mt-2 text-xs text-white">
                        <span class="px-2 py-1 bg-${getSeverityColor(rule.severity).bg} text-${getSeverityColor(rule.severity).text} rounded">${rule.severity}</span>
                        <span class="mx-2">•</span>
                        <span>Threshold: ${rule.threshold}</span>
                        <span class="mx-2">•</span>
                        <span>${rule.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>
                <div class="flex space-x-2 ml-4">
                    <button onclick="toggleAlertRule('${rule.id}')" class="px-3 py-1 ${rule.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white text-xs rounded">
                        ${rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button onclick="deleteAlertRule('${rule.id}')" class="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                        Delete
                    </button>
                </div>
            </div>
        `;
        container.appendChild(ruleDiv);
    });
}

function getSeverityColor(severity) {
    const colors = {
        critical: { bg: 'red-100', text: 'red-800', border: 'border-red-500' },
        high: { bg: 'orange-100', text: 'orange-800', border: 'border-orange-500' },
        medium: { bg: 'yellow-100', text: 'yellow-800', border: 'border-yellow-500' },
        low: { bg: 'gray-100', text: 'gray-800', border: 'border-gray-500' }
    };
    return colors[severity] || colors.low;
}

async function acknowledgeAlert(alertId) {
    try {
        const response = await fetch(`/alerts/acknowledge/${alertId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showNotification('Alert acknowledged');
        refreshAlerts();
    } catch (error) {
        showNotification(`Failed to acknowledge alert: ${error.message}`, 'error');
    }
}

// Modal Management
function showCreateAlertModal() {
    document.getElementById('create-alert-modal').classList.remove('hidden');
}

function hideCreateAlertModal() {
    document.getElementById('create-alert-modal').classList.add('hidden');
    document.getElementById('create-alert-form').reset();
}

// Enhanced create alert function using the modal
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('create-alert-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ruleData = {
                name: document.getElementById('alert-name').value,
                pattern: document.getElementById('alert-pattern').value,
                severity: document.getElementById('alert-severity').value,
                threshold: parseInt(document.getElementById('alert-threshold').value),
                time_window: parseInt(document.getElementById('alert-time-window').value),
                enabled: true,
                notification_channels: []
            };
            
            createAlertRule(ruleData);
            hideCreateAlertModal();
        });
    }
});

async function createAlertRule(ruleData) {
    try {
        const response = await fetch('/alerts/rules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ruleData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showNotification('Alert rule created successfully');
        refreshAlerts();
    } catch (error) {
        showNotification(`Failed to create alert rule: ${error.message}`, 'error');
    }
}

async function deleteAlertRule(ruleId) {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;
    
    try {
        const response = await fetch(`/alerts/rules/${ruleId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showNotification('Alert rule deleted successfully');
        refreshAlerts();
    } catch (error) {
        showNotification(`Failed to delete alert rule: ${error.message}`, 'error');
    }
}

// Anomaly Detection Management
let anomalyConfig = {};
let detectedAnomalies = [];
let monitoringActive = false;

async function refreshAnomalies() {
    try {
        showNotification('Loading anomaly data...', 'info');
        
        // Get configuration
        const configResponse = await fetch('/anomalies/config');
        if (configResponse.ok) {
            anomalyConfig = await configResponse.json();
            updateAnomalyConfigUI();
        }
        
        // Get detected anomalies
        const anomaliesResponse = await fetch('/anomalies/detected');
        if (anomaliesResponse.ok) {
            detectedAnomalies = await anomaliesResponse.json();
        }
        
        // Get anomaly report
        const reportResponse = await fetch('/anomalies/report');
        if (reportResponse.ok) {
            const report = await reportResponse.json();
            updateAnomalyReport(report);
        }
        
        // Get monitoring status
        const statusResponse = await fetch('/anomalies/monitoring-status');
        if (statusResponse.ok) {
            const status = await statusResponse.json();
            monitoringActive = status.monitoring_active;
            updateMonitoringButton();
        }
        
        updateDetectedAnomaliesUI();
        showNotification('Anomaly data updated successfully');
    } catch (error) {
        console.error('Error refreshing anomalies:', error);
        showNotification(`Failed to refresh anomalies: ${error.message}`, 'error');
    }
}

function updateAnomalyConfigUI() {
    document.getElementById('sensitivity-slider').value = anomalyConfig.sensitivity || 0.8;
    document.getElementById('sensitivity-value').textContent = anomalyConfig.sensitivity || 0.8;
    document.getElementById('time-window').value = (anomalyConfig.time_window || 3600) / 60; // Convert to minutes
    document.getElementById('volume-detection').checked = (anomalyConfig.detection_methods || []).includes('volume');
    document.getElementById('pattern-detection').checked = (anomalyConfig.detection_methods || []).includes('pattern');
}

function updateMonitoringButton() {
    const button = document.getElementById('monitoring-toggle');
    if (monitoringActive) {
        button.innerHTML = '<i class="fas fa-stop mr-2"></i>Stop Monitoring';
        button.className = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200';
        button.onclick = stopAnomalyMonitoring;
    } else {
        button.innerHTML = '<i class="fas fa-play mr-2"></i>Start Monitoring';
        button.className = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200';
        button.onclick = startAnomalyMonitoring;
    }
}

function updateAnomalyReport(report) {
    // Update health score
    const healthScore = report.system_health_score || 100;
    document.getElementById('health-score').textContent = healthScore.toFixed(0);
    
    const healthBar = document.getElementById('health-score-bar');
    healthBar.style.width = `${healthScore}%`;
    
    if (healthScore >= 80) {
        healthBar.className = 'bg-green-500 h-2 rounded-full';
    } else if (healthScore >= 60) {
        healthBar.className = 'bg-yellow-500 h-2 rounded-full';
    } else {
        healthBar.className = 'bg-red-500 h-2 rounded-full';
    }
    
    // Update type breakdown
    const typeContainer = document.getElementById('anomalies-by-type');
    typeContainer.innerHTML = '';
    Object.entries(report.anomalies_by_type || {}).forEach(([type, count]) => {
        const typeDiv = document.createElement('div');
        typeDiv.className = 'flex justify-between items-center py-1';
        typeDiv.innerHTML = `
            <span class="text-sm text-gray-600">${type}</span>
            <span class="text-sm font-medium text-gray-900">${count}</span>
        `;
        typeContainer.appendChild(typeDiv);
    });
    
    // Update severity breakdown
    const severityContainer = document.getElementById('anomalies-by-severity');
    severityContainer.innerHTML = '';
    Object.entries(report.anomalies_by_severity || {}).forEach(([severity, count]) => {
        const severityDiv = document.createElement('div');
        severityDiv.className = 'flex justify-between items-center py-1';
        const color = getSeverityColor(severity);
        severityDiv.innerHTML = `
            <span class="text-sm text-gray-600">${severity}</span>
            <span class="text-sm font-medium ${color.text}">${count}</span>
        `;
        severityContainer.appendChild(severityDiv);
    });
}

function updateDetectedAnomaliesUI() {
    const container = document.getElementById('detected-anomalies');
    container.innerHTML = '';
    
    if (detectedAnomalies.length === 0) {
        container.innerHTML = `
            <div class="text-center text-white py-8">
                <i class="fas fa-chart-area text-4xl text-gray-300 mb-2"></i>
                <p>No anomalies detected</p>
            </div>
        `;
        return;
    }
    
    detectedAnomalies.slice(0, 10).forEach(anomaly => {
        const anomalyDiv = document.createElement('div');
        const severityColor = getSeverityColor(anomaly.severity);
        anomalyDiv.className = `border-l-4 ${severityColor.border} bg-${severityColor.bg} p-4 rounded-lg`;
        anomalyDiv.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h4 class="text-sm font-medium ${severityColor.text}">${anomaly.type} Anomaly</h4>
                    <p class="text-sm text-gray-600 mt-1">${anomaly.description}</p>
                    <div class="flex items-center mt-2 text-xs text-white">
                        <span>Confidence: ${(anomaly.confidence * 100).toFixed(0)}%</span>
                        <span class="mx-2">•</span>
                        <span>Affected logs: ${anomaly.affected_logs.length}</span>
                        <span class="mx-2">•</span>
                        <span>${new Date(anomaly.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(anomalyDiv);
    });
}

async function startAnomalyMonitoring() {
    try {
        const response = await fetch('/anomalies/start-monitoring', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        monitoringActive = true;
        updateMonitoringButton();
        showNotification('Anomaly monitoring started');
    } catch (error) {
        showNotification(`Failed to start monitoring: ${error.message}`, 'error');
    }
}

async function stopAnomalyMonitoring() {
    try {
        const response = await fetch('/anomalies/stop-monitoring', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        monitoringActive = false;
        updateMonitoringButton();
        showNotification('Anomaly monitoring stopped');
    } catch (error) {
        showNotification(`Failed to stop monitoring: ${error.message}`, 'error');
    }
}

async function updateAnomalyConfig() {
    const config = {
        enabled: true,
        sensitivity: parseFloat(document.getElementById('sensitivity-slider').value),
        time_window: parseInt(document.getElementById('time-window').value) * 60, // Convert to seconds
        detection_methods: []
    };
    
    if (document.getElementById('volume-detection').checked) {
        config.detection_methods.push('volume');
    }
    if (document.getElementById('pattern-detection').checked) {
        config.detection_methods.push('pattern');
    }
    
    try {
        const response = await fetch('/anomalies/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showNotification('Anomaly configuration updated successfully');
        refreshAnomalies();
    } catch (error) {
        showNotification(`Failed to update configuration: ${error.message}`, 'error');
    }
}

// Helper function to get current logs (implement based on your data source)
async function getCurrentLogs() {
    try {
        console.log('Attempting to get current logs...');
        
        // Try to get logs from the database first
        const response = await fetch('/database/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: "SELECT * FROM logs ORDER BY timestamp DESC LIMIT 1000"
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`Retrieved ${result.data?.length || 0} logs from database`);
            return result.data || [];
        }
        
        console.log('Database query failed, trying to get sample logs...');
        
        // Fallback: try to get logs from the logs endpoint
        const logsResponse = await fetch('/logs/');
        if (logsResponse.ok) {
            const logs = await logsResponse.json();
            console.log(`Retrieved ${logs.length || 0} logs from logs endpoint`);
            return logs || [];
        }
        
        console.log('No logs available from any source, returning sample data');
        
        // Final fallback: return sample data for demonstration
        return generateSampleLogs();
        
    } catch (error) {
        console.error('Error getting current logs:', error);
        console.log('Returning sample data due to error');
        return generateSampleLogs();
    }
}

// Generate sample logs for demonstration when no real data is available
function generateSampleLogs() {
    const services = ['api', 'auth', 'database', 'worker', 'cache'];
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const sampleLogs = [];
    
    for (let i = 0; i < 100; i++) {
        const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
        const service = services[Math.floor(Math.random() * services.length)];
        const level = levels[Math.floor(Math.random() * levels.length)];
        
        sampleLogs.push({
            timestamp: timestamp,
            level: level,
            service: service,
            message: `Sample ${level.toLowerCase()} message from ${service} service`,
            producer_id: `${service}-${Math.floor(Math.random() * 1000)}`
        });
    }
    
    console.log(`Generated ${sampleLogs.length} sample logs`);
    return sampleLogs;
}

// Update sensitivity value display
document.addEventListener('DOMContentLoaded', function() {
    const sensitivitySlider = document.getElementById('sensitivity-slider');
    if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', function() {
            document.getElementById('sensitivity-value').textContent = this.value;
        });
    }
});

// Auto-refresh dashboard and alerts periodically
function startAutoRefresh() {
    // Refresh dashboard every 30 seconds if active
    setInterval(() => {
        const dashboardTab = document.getElementById('dashboard-tab');
        if (dashboardTab && !dashboardTab.classList.contains('hidden')) {
            refreshDashboard();
        }
    }, 30000);
    
    // Refresh alerts every 60 seconds if active
    setInterval(() => {
        const alertsTab = document.getElementById('alerts-tab');
        if (alertsTab && !alertsTab.classList.contains('hidden')) {
            refreshAlerts();
        }
    }, 60000);
}

// Start auto-refresh when page loads
document.addEventListener('DOMContentLoaded', function() {
    startAutoRefresh();
});