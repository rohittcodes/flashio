import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db/schema'
import { projects, projectFiles } from '@/db/schemas'
import { eq, and } from 'drizzle-orm'
import { FileStorageService } from '@/lib/file-storage'
import { createHash } from 'crypto'

interface DefaultFile {
  path: string
  content: string
  language?: string
  mimeType?: string
}

const getDefaultFiles = (projectType: 'node' | 'react' | 'vanilla' = 'node'): DefaultFile[] => {
  const baseFiles: DefaultFile[] = [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'flashio-project',
        version: '1.0.0',
        description: 'A project created with FlashIO IDE',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'node index.js',
          test: 'echo "Error: no test specified" && exit 1'
        },
        keywords: ['flashio', 'ide'],
        author: '',
        license: 'ISC',
        dependencies: {
          express: '^4.18.0'
        },
        devDependencies: {}
      }, null, 2),
      language: 'json',
      mimeType: 'application/json'
    },
    {
      path: 'index.js',
      content: `// Welcome to FlashIO IDE!
// A simple Express.js server for preview functionality

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FlashIO Project</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                line-height: 1.6;
                color: #333;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            .logo {
                font-size: 3em;
                margin-bottom: 10px;
            }
            .card {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #007bff;
            }
            .api-demo {
                background: #e9ecef;
                padding: 15px;
                border-radius: 5px;
                font-family: monospace;
            }
            .button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin: 5px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🚀</div>
            <h1>Welcome to FlashIO!</h1>
            <p>Your project is up and running!</p>
        </div>
        
        <div class="card">
            <h3>🎉 Success!</h3>
            <p>Your Express.js server is running on port \${port}. You can now:</p>
            <ul>
                <li>Edit <code>index.js</code> to modify this page</li>
                <li>Create new routes and endpoints</li>
                <li>Install additional packages using the terminal</li>
                <li>Use the preview panel to see your changes live</li>
            </ul>
        </div>
        
        <div class="card">
            <h3>📡 API Example</h3>
            <p>Try the API endpoint: <a href="/api/hello" class="button">GET /api/hello</a></p>
            <div class="api-demo">
                <strong>Response:</strong><br>
                <span id="api-response">Click the button above to test</span>
            </div>
        </div>
        
        <div class="card">
            <h3>🛠 Next Steps</h3>
            <ul>
                <li>Install dependencies: <code>npm install</code></li>
                <li>Add new routes to this Express app</li>
                <li>Create HTML, CSS, and JavaScript files</li>
                <li>Build something amazing!</li>
            </ul>
        </div>
        
        <script>
            // Simple API test
            document.querySelector('a[href="/api/hello"]').addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/api/hello');
                    const data = await response.json();
                    document.getElementById('api-response').innerHTML = JSON.stringify(data, null, 2);
                } catch (error) {
                    document.getElementById('api-response').innerHTML = 'Error: ' + error.message;
                }
            });
        </script>
    </body>
    </html>
  \`);
});

// API endpoint example
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from FlashIO API!',
    timestamp: new Date().toISOString(),
    server: 'Express.js',
    port: port
  });
});

// API endpoint for project info
app.get('/api/info', (req, res) => {
  res.json({
    project: 'FlashIO Project',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Start server
app.listen(port, () => {
  console.log(\`🚀 FlashIO project running on port \${port}\`);
  console.log(\`📱 Open http://localhost:\${port} to view your project\`);
  console.log(\`🔧 Edit index.js to modify this server\`);
});
`,
      language: 'javascript',
      mimeType: 'text/javascript'
    },
    {
      path: 'README.md',
      content: `# FlashIO Project

Welcome to your new FlashIO project! 🎉

## Getting Started

This project has been automatically initialized with:
- \`package.json\` - Node.js project configuration
- \`index.js\` - Main entry point
- This README file

## Available Scripts

- \`npm start\` - Run the application
- \`npm run dev\` - Run in development mode
- \`npm test\` - Run tests (not configured yet)

## Installing Dependencies

You can install npm packages using the terminal:

\`\`\`bash
npm install express
npm install --save-dev nodemon
\`\`\`

## Project Structure

\`\`\`
/
├── package.json     # Project configuration
├── index.js         # Main application file
└── README.md        # This file
\`\`\`

## Next Steps

1. Edit \`index.js\` to start building your application
2. Install any dependencies you need
3. Create additional files and folders as needed
4. Use the integrated terminal to run npm commands

Happy coding! 🚀
`,
      language: 'markdown',
      mimeType: 'text/markdown'
    },
    {
      path: '.gitignore',
      content: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Build outputs
dist/
build/
`,
      language: 'gitignore',
      mimeType: 'text/plain'
    },
    {
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlashIO Static Page</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        .hero {
            padding: 60px 20px;
        }
        .hero h1 {
            font-size: 3.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .feature h3 {
            font-size: 1.8em;
            margin-bottom: 15px;
        }
        .cta {
            margin: 50px 0;
        }
        .button {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin: 10px;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        .button:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>🚀 FlashIO</h1>
            <p>Build, Preview, and Deploy - All in Your Browser</p>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>⚡ Instant Setup</h3>
                <p>Start coding immediately with pre-configured templates and dependencies</p>
            </div>
            <div class="feature">
                <h3>🔴 Live Preview</h3>
                <p>See your changes in real-time with our integrated preview panel</p>
            </div>
            <div class="feature">
                <h3>🌐 Full-Stack Ready</h3>
                <p>Build APIs, frontends, and full applications with complete Node.js support</p>
            </div>
        </div>
        
        <div class="cta">
            <a href="/api/hello" class="button">Test API</a>
            <a href="/api/info" class="button">Project Info</a>
        </div>
        
        <p style="margin-top: 60px; opacity: 0.8;">
            Edit <code>public/index.html</code> to customize this page
        </p>
    </div>
</body>
</html>`,
      language: 'html',
      mimeType: 'text/html'
    },
    {
      path: 'public/style.css',
      content: `/* Custom styles for your FlashIO project */

:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
}

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--dark-color);
  background-color: var(--light-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  border-radius: 0.25rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin: 1rem 0;
}

.grid {
  display: grid;
  gap: 2rem;
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.text-center {
  text-align: center;
}

.text-primary {
  color: var(--primary-color);
}

.mt-4 {
  margin-top: 2rem;
}

.mb-4 {
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .container {
    padding: 0 10px;
  }
  
  .grid {
    gap: 1rem;
  }
}`,
      language: 'css',
      mimeType: 'text/css'
    }
  ]

  if (projectType === 'react') {
    baseFiles[0].content = JSON.stringify({
      name: 'flashio-react-project',
      version: '1.0.0',
      description: 'A React project created with FlashIO IDE',
      main: 'src/index.js',
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '5.0.1'
      },
      browserslist: {
        production: ['>0.2%', 'not dead', 'not op_mini all'],
        development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
      }
    }, null, 2)

    baseFiles[1] = {
      path: 'src/index.js',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      language: 'javascript',
      mimeType: 'text/javascript'
    }

    baseFiles.push({
      path: 'src/App.js',
      content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to FlashIO! 🚀</h1>
        <p>Your React project is ready to go.</p>
        <p>Edit <code>src/App.js</code> and save to reload.</p>
      </header>
    </div>
  );
}

export default App;
`,
      language: 'javascript',
      mimeType: 'text/javascript'
    })

    baseFiles.push({
      path: 'src/App.css',
      content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

.App-header h1 {
  margin: 0;
}

.App-header p {
  margin: 10px 0;
}

code {
  background-color: #f4f4f4;
  color: #333;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
`,
      language: 'css',
      mimeType: 'text/css'
    })

    baseFiles.push({
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="FlashIO React Project" />
    <title>FlashIO React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`,
      language: 'html',
      mimeType: 'text/html'
    })
  }

  return baseFiles
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, projectType = 'node', force = false } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }    // Check if project exists, create it if it doesn't
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)

    if (existingProject.length === 0) {
      console.log(`Creating project ${projectId} as part of bootstrap`)
      await db.insert(projects).values({
        id: projectId,
        name: `Project ${projectId}`,
        description: 'Auto-created project during bootstrap',
        userId: session.user.id,
        status: 'draft',
        visibility: 'private',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Check if project already has files (unless force is true)
    if (!force) {
      const existingFiles = await db
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.projectId, projectId))
        .limit(1)

      if (existingFiles.length > 0) {
        return NextResponse.json({
          message: 'Project already has files',
          filesCount: existingFiles.length
        })
      }
    }

    // Get default files for the project type
    const defaultFiles = getDefaultFiles(projectType as 'node' | 'react' | 'vanilla')
    const createdFiles = []

    // Create each default file
    for (const file of defaultFiles) {
      const size = Buffer.byteLength(file.content, 'utf-8')
      const checksum = createHash('sha256').update(file.content).digest('hex')
        // Create file record (simplified for existing schema)
      const [fileRecord] = await db.insert(projectFiles).values({
        projectId,
        path: file.path,
        content: file.content,
        language: file.language || 'text',
        mimeType: file.mimeType || 'text/plain',
        size,
        checksum,
        isDirectory: false,
        isBinary: false,
        lastModifiedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      createdFiles.push({
        id: fileRecord.id,
        path: fileRecord.path,
        size: fileRecord.size,
        language: fileRecord.language
      })
    }

    // Update project status to indicate it's been bootstrapped
    await db
      .update(projects)
      .set({
        status: 'active',
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId))

    return NextResponse.json({
      message: 'Project bootstrapped successfully',
      projectType,
      filesCreated: createdFiles.length,
      files: createdFiles
    })
  } catch (error) {
    console.error('Failed to bootstrap project:', error)
    return NextResponse.json({ error: 'Failed to bootstrap project' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }    // Check if project needs bootstrapping
    try {
      const existingFiles = await db
        .select({ count: projectFiles.id })
        .from(projectFiles)
        .where(eq(projectFiles.projectId, projectId))

      const needsBootstrap = existingFiles.length === 0

      return NextResponse.json({
        projectId,
        needsBootstrap,
        filesCount: existingFiles.length
      })
    } catch (error) {
      console.warn('Error querying project files (project might not exist):', error)
      // If we can't query files, assume the project needs bootstrapping
      return NextResponse.json({
        projectId,
        needsBootstrap: true,
        filesCount: 0,
        note: 'Project files query failed, assuming bootstrap needed'
      })
    }
  } catch (error) {
    console.error('Failed to check bootstrap status:', error)
    return NextResponse.json({ error: 'Failed to check bootstrap status' }, { status: 500 })
  }
}
