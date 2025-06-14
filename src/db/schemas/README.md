# Database Schema Organization

This directory contains the organized database schema for the FlashIO project, structured by functionality for better maintainability and clarity.

## Structure

### Core Files

- **`index.ts`** - Main export file that re-exports everything
- **`enums.ts`** - All PostgreSQL enums used throughout the schema
- **`relations.ts`** - All Drizzle ORM relations for type-safe queries

### Feature-Specific Schemas

#### `auth.ts` - Authentication & User Management
- `users` - User accounts and profiles
- `accounts` - OAuth provider accounts (NextAuth.js)
- `sessions` - User sessions
- `verificationTokens` - Email verification tokens
- `authenticators` - WebAuthn authenticators

#### `projects.ts` - Core Project Management
- `projects` - Main project entities
- `projectFiles` - File system with WebContainer support
- `buildTasks` - Build pipeline tasks
- `projectTemplates` - Reusable project templates

#### `collaboration.ts` - Real-time Collaboration
- `projectCollaborators` - Project access control
- `collaborationSessions` - Real-time user sessions
- `collaborativeCursors` - Live cursor positions for CodeMirror
- `comments` - Code reviews and inline comments

#### `webcontainer.ts` - WebContainer Integration
- `webContainerInstances` - Running container instances
- `terminalSessions` - Terminal processes and output
- `fileWatchers` - File system monitoring
- `fileWatcherEvents` - File change events

#### `editor.ts` - CodeMirror Editor
- `editorStates` - Persistent editor configurations
- `codeCompletions` - IntelliSense cache

#### `analytics.ts` - Data & AI Features
- `aiChatSessions` - AI assistant conversations
- `aiChatMessages` - Chat message history
- `activities` - Project activity feed
- `projectAnalytics` - Usage metrics and insights

## Usage

Import from the main schema file:

```typescript
import { db, users, projects, webContainerInstances } from "@/db/schema"

// Or import specific schemas
import { users } from "@/db/schemas/auth"
import { projects } from "@/db/schemas/projects"
```

## Key Features Supported

### WebContainer Integration
- Container lifecycle management
- Terminal session handling
- File system watching and events
- Port management and URL tracking

### CodeMirror Editor
- Persistent cursor positions and selections
- Editor state preservation (themes, settings)
- Code completion caching
- Multi-user collaborative editing

### Real-time Collaboration
- Live cursor sharing
- WebSocket session management
- Permission-based access control
- Threaded code comments

### Project Management
- File tree with binary support
- Build task orchestration
- Project templates and cloning
- Analytics and activity tracking

## Relations

All relations are defined in `relations.ts` to provide:
- Type-safe queries with Drizzle ORM
- Automatic JOIN optimizations
- Cascade delete behavior
- Referential integrity

## Migration

When making schema changes:
1. Update the relevant schema file
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`
