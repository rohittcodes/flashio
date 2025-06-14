import { IDE } from '@/components/ide/ide'

const sampleFiles = [
  {
    path: '/package.json',
    content: `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A sample project",
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
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from FlashIO!',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
    language: 'javascript'
  },
  {
    path: '/README.md',
    content: `# My FlashIO Project

This is a sample project created in FlashIO IDE.

## Getting Started

1. Install dependencies: \`npm install\`
2. Start the server: \`npm run dev\`
3. Visit http://localhost:3000

## Features

- Express.js server
- JSON API endpoint
- Real-time development with hot reload`,
    language: 'markdown'
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
