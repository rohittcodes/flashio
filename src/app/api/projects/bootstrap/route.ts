import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db/drizzle'
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
        dependencies: {},
        devDependencies: {}
      }, null, 2),
      language: 'json',
      mimeType: 'application/json'
    },
    {
      path: 'index.js',
      content: `// Welcome to FlashIO IDE!
// This is your main entry point.

console.log('Hello from FlashIO! 🚀');
console.log('Your project is ready to go.');
console.log('Start coding by editing this file or creating new ones.');

// Example function
function greet(name) {
  return \`Hello, \${name}! Welcome to your FlashIO project.\`;
}

// Test the function
console.log(greet('Developer'));
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
