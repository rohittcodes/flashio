import { IDE } from '@/components/ide/ide'

const sampleFiles = [
  {
    path: '/package.json',
    content: `{
  "name": "flashio-preview-demo",
  "version": "1.0.0",
  "description": "A FlashIO project with preview support",
  "main": "index.js",
  "scripts": {
    "dev": "node index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}`,
    language: 'json'
  },
  {
    path: '/index.js',
    content: `const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// Main route - serve HTML
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FlashIO Preview Demo</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
                line-height: 1.6;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            .logo {
                font-size: 4em;
                margin-bottom: 10px;
                animation: bounce 2s infinite;
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .card {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 30px;
                margin: 20px 0;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .button {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 25px;
                margin: 8px;
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
                font-size: 14px;
            }
            .button:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .api-response {
                background: rgba(0,0,0,0.3);
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                margin-top: 10px;
                white-space: pre-wrap;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .feature {
                text-align: center;
                padding: 20px;
            }
            .feature-icon {
                font-size: 2.5em;
                margin-bottom: 15px;
                display: block;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🚀</div>
            <h1>FlashIO Preview Demo</h1>
            <p>Your Express.js server is running and ready for preview!</p>
        </div>
        
        <div class="card">
            <h3>🎉 Preview is Working!</h3>
            <p>This page is being served by your Express.js server running on port \${port}. You can:</p>
            <ul>
                <li>Edit <strong>index.js</strong> to modify this server</li>
                <li>Create new routes and API endpoints</li>
                <li>Add static files in the <strong>public</strong> directory</li>
                <li>Use the preview panel to see changes instantly</li>
            </ul>
        </div>
        
        <div class="grid">
            <div class="feature">
                <span class="feature-icon">📡</span>
                <h4>API Testing</h4>
                <button class="button" onclick="testAPI()">Test API Endpoint</button>
            </div>
            <div class="feature">
                <span class="feature-icon">⏰</span>
                <h4>Live Clock</h4>
                <div id="clock" style="font-size: 1.2em; font-weight: bold;"></div>
            </div>
            <div class="feature">
                <span class="feature-icon">🎨</span>
                <h4>Interactive Demo</h4>
                <button class="button" onclick="changeColors()">Change Theme</button>
            </div>
        </div>
        
        <div class="card">
            <h3>📡 API Response</h3>
            <div id="api-response" class="api-response">Click "Test API Endpoint" to see a response</div>
        </div>
        
        <div class="card">
            <h3>🛠 Development Tips</h3>
            <ul>
                <li>Use <code>npm install package-name</code> to add dependencies</li>
                <li>Restart the server to see package.json changes</li>
                <li>Static files go in the <strong>public</strong> folder</li>
                <li>The preview updates automatically when you refresh</li>
            </ul>
        </div>
        
        <script>
            // Live clock
            function updateClock() {
                const now = new Date();
                document.getElementById('clock').textContent = now.toLocaleTimeString();
            }
            setInterval(updateClock, 1000);
            updateClock();
            
            // API test function
            async function testAPI() {
                const responseDiv = document.getElementById('api-response');
                responseDiv.textContent = 'Loading...';
                
                try {
                    const response = await fetch('/api/data');
                    const data = await response.json();
                    responseDiv.textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    responseDiv.textContent = 'Error: ' + error.message;
                }
            }
            
            // Theme changer
            const themes = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            ];
            let currentTheme = 0;
            
            function changeColors() {
                currentTheme = (currentTheme + 1) % themes.length;
                document.body.style.background = themes[currentTheme];
            }
        </script>
    </body>
    </html>
  \`);
});

// API endpoints
app.get('/api/data', (req, res) => {
  res.json({
    message: 'Hello from FlashIO API! 🚀',
    timestamp: new Date().toISOString(),
    server: 'Express.js',
    port: port,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    platform: process.platform,
    version: process.version
  });
});

// Start server
app.listen(port, () => {
  console.log(\`🚀 FlashIO Preview Demo server running on port \${port}\`);
  console.log(\`📱 Open http://localhost:\${port} to view your project\`);
  console.log(\`🔧 Ready for preview in FlashIO IDE!\`);
});`,
    language: 'javascript'
  },  {
    path: '/README.md',
    content: `# 🚀 FlashIO Preview Demo

Welcome to your FlashIO project with **live preview support**! 

## 🎯 What's Included

- **Express.js Server** - Full web server with API routes
- **Live Preview** - See your app running in real-time
- **Static Files** - HTML, CSS, and JavaScript examples
- **Interactive Features** - Clock, API testing, theme switching

## 🚀 Quick Start

1. **Toggle Preview** - Click the "Preview" button in the IDE toolbar
2. **Install Dependencies** - Run \`npm install\` in the terminal
3. **Start Server** - Run \`npm run dev\` in the terminal
4. **See Live Preview** - Your app appears automatically!

## 📁 Project Structure

\`\`\`
/
├── package.json         # Dependencies and scripts
├── index.js            # Main Express.js server
├── README.md           # This file
└── public/             # Static files directory
    ├── demo.html       # Static HTML demo
    ├── style.css       # Stylesheet
    └── script.js       # Client-side JavaScript
\`\`\`

## 🌐 Available Routes

- **/** - Main interactive demo page
- **/demo.html** - Static file serving example
- **/api/data** - JSON API endpoint
- **/api/stats** - Server statistics

## 🎨 Features to Try

1. **Live Clock** - Updates every second
2. **API Testing** - Click to test the API endpoint
3. **Theme Switching** - Change background colors
4. **Static Files** - Browse to /demo.html

## 🛠 Development Tips

- **Auto-Refresh**: Preview updates when you refresh manually
- **Hot Reload**: Restart server to see code changes
- **Console**: Check browser dev tools for JavaScript logs
- **Errors**: Watch the terminal for server errors

## 📦 Adding Dependencies

\`\`\`bash
npm install lodash          # Add utility library
npm install --save-dev nodemon  # Development dependency
\`\`\`

## 🔧 Common Commands

\`\`\`bash
npm install     # Install dependencies
npm run dev     # Start development server
npm start       # Start production server
\`\`\`

## 🎉 Next Steps

1. Edit \`index.js\` to add new routes
2. Modify the HTML template for custom styling
3. Add new static files in the \`public\` directory
4. Create API endpoints for your application
5. Build something amazing with FlashIO!

---

**Happy coding with FlashIO! 🚀**`,
    language: 'markdown'
  },
  {
    path: '/public/demo.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlashIO Static Demo</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header class="hero">
            <h1>📁 Static File Demo</h1>
            <p>This is a static HTML file served from the public directory</p>
        </header>
        
        <main>
            <div class="card">
                <h2>🎯 What's This?</h2>
                <p>This page demonstrates serving static files with Express.js. Files in the <code>public</code> directory are automatically served.</p>
            </div>
            
            <div class="card">
                <h2>📂 File Structure</h2>
                <pre><code>public/
├── demo.html    (this file)
├── style.css    (stylesheet)
└── script.js    (JavaScript)</code></pre>
            </div>
            
            <div class="card">
                <h2>🔗 Navigation</h2>
                <a href="/" class="btn">← Back to Main App</a>
                <a href="/api/data" class="btn">API Data</a>
            </div>
        </main>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`,
    language: 'html'
  },
  {
    path: '/public/style.css',
    content: `/* FlashIO Demo Styles */
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
  --light: #f8fafc;
  --dark: #1e293b;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--dark);
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  min-height: 100vh;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.hero {
  text-align: center;
  color: white;
  margin-bottom: 40px;
  padding: 40px 20px;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.btn {
  display: inline-block;
  background: var(--primary);
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 8px;
  margin: 5px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn:hover {
  background: var(--secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

pre {
  background: var(--light);
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  border-left: 4px solid var(--primary);
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
  background: var(--light);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .hero h1 {
    font-size: 2rem;
  }
  
  .card {
    padding: 20px;
  }
}`,
    language: 'css'
  },
  {
    path: '/public/script.js',
    content: `// FlashIO Demo JavaScript
console.log('🚀 FlashIO Static Demo loaded!');

// Add some interactivity
document.addEventListener('DOMContentLoaded', function() {
    // Add click animations to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255,255,255,0.6)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = (e.clientX - e.target.offsetLeft) + 'px';
            ripple.style.top = (e.clientY - e.target.offsetTop) + 'px';
            
            e.target.style.position = 'relative';
            e.target.style.overflow = 'hidden';
            e.target.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add dynamic content
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = (index * 0.1) + 's';
        card.style.animation = 'slideUp 0.6s ease-out forwards';
    });
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = \`
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .card {
        opacity: 0;
    }
\`;
document.head.appendChild(style);

// Log some info
console.log('Demo script loaded at:', new Date().toISOString());
console.log('Available routes:');
console.log('- / (main app)');
console.log('- /demo.html (this page)');
console.log('- /api/data (API endpoint)');`,
    language: 'javascript'
  }
]

export default function IDETestPage() {
  return (
    <div className="h-screen">
      <IDE
        projectId="test-project-1"
        initialFiles={sampleFiles}
        className="w-full h-full"
      />
    </div>
  )
}
