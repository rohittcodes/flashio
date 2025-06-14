'use client';

import { IDE } from '@/components/ide/ide';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Sample project files for demonstration
const projectFiles: Record<string, Array<{path: string; content: string; language: string}>> = {
  "new-project": [
    {
      path: '/package.json',
      content: `{
  "name": "new-project",
  "version": "1.0.0",
  "description": "AI-generated project",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^13.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
      language: 'json'
    },
    {
      path: '/pages/index.js',
      content: `import Head from 'next/head'

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Flash.io Project</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          Welcome to your new <a>Flash.io</a> project!
        </h1>

        <p className="description">
          Get started by editing <code>pages/index.js</code>
        </p>
      </main>

      <style jsx>{\`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          color: #0070f3;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .description {
          text-align: center;
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      \`}</style>
    </div>
  )
}`,
      language: 'javascript'
    },
    {
      path: '/README.md',
      content: `# Flash.io AI Project

This is a project generated with Flash.io's AI project wizard.

## Getting Started

1. Install dependencies: \`npm install\`
2. Start the development server: \`npm run dev\`
3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- Next.js framework
- React components
- Fast dev experience
- Built-in styling

## Next Steps

- Add authentication
- Connect to a database
- Deploy to production`,
      language: 'markdown'
    }
  ],
  "1": [
    {
      path: '/package.json',
      content: `{
  "name": "react-dashboard",
  "version": "1.0.0",
  "description": "Modern dashboard built with React and Tailwind CSS",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^13.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0"
  }
}`,
      language: 'json'
    },
    {
      path: '/src/App.tsx',
      content: `import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;`,
      language: 'typescript'
    },
    {
      path: '/src/components/Dashboard.tsx',
      content: `import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">React Dashboard</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4 flex items-center justify-center">
              <p className="text-gray-500">Dashboard content goes here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;`,
      language: 'typescript'
    }
  ],
  "2": [
    {
      path: '/package.json',
      content: `{
  "name": "api-gateway",
  "version": "1.0.0",
  "description": "Microservice API gateway with authentication",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "jsonwebtoken": "^8.5.1",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.12"
  }
}`,
      language: 'json'
    },
    {
      path: '/src/index.js',
      content: `const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const { verifyToken } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`API Gateway running on port \${PORT}\`);
});`,
      language: 'javascript'
    },
    {
      path: '/src/middleware/auth.js',
      content: `const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  
  if (!bearerHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyToken };`,
      language: 'javascript'
    }
  ],
  "3": [
    {
      path: '/package.json',
      content: `{
  "name": "mobile-app",
  "version": "1.0.0",
  "description": "Cross-platform mobile app with React Native",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~47.0.0",
    "expo-status-bar": "~1.4.2",
    "react": "18.1.0",
    "react-native": "0.70.5",
    "react-native-gesture-handler": "~2.8.0",
    "react-native-reanimated": "~2.12.0",
    "react-native-safe-area-context": "4.4.1",
    "react-native-screens": "~3.18.0"
  },
  "devDependencies": {
    "@babel/core": "^7.12.9"
  }
}`,
      language: 'json'
    },
    {
      path: '/App.js',
      content: `import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar />
      <View style={styles.container}>
        <Text style={styles.title}>Mobile App</Text>
        <Text style={styles.subtitle}>Built with React Native & Expo</Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});`,
      language: 'javascript'
    },
    {
      path: '/screens/HomeScreen.js',
      content: `import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Mobile App</Text>
      <Text style={styles.subtitle}>This is the home screen</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log('Button pressed')}
      >
        <Text style={styles.buttonText}>Explore Features</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;`,
      language: 'javascript'
    }
  ]
};

export default function IDEPage() {
  const searchParams = useSearchParams();
  const [projectData, setProjectData] = useState<any[] | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true);
      try {
        // Get project ID from URL query params
        const id = searchParams?.get('projectId') || '';
        setProjectId(id);

        // In a real application, you would fetch the project files from an API
        // For now, we're using mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

        // Get project files based on ID or use default
        const files = projectFiles[id] || projectFiles['new-project'];
        setProjectData(files);
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [searchParams]);

  if (isLoading || !projectData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <IDE 
        projectId={projectId}
        initialFiles={projectData}
        className="w-full h-full"
      />
    </div>
  );
}
