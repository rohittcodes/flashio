# Implementation Guide: CodeMirror + WebContainer Integration

## Overview
Your database schema has been successfully organized and enhanced to support a full-featured online IDE with CodeMirror and WebContainer integration. Here's your implementation roadmap:

## 🗂️ Schema Organization Complete ✅

### New Structure
```
src/db/schemas/
├── index.ts           # Main exports
├── enums.ts          # All PostgreSQL enums
├── auth.ts           # Authentication tables
├── projects.ts       # Core project management
├── collaboration.ts  # Real-time collaboration
├── webcontainer.ts   # WebContainer integration
├── editor.ts         # CodeMirror editor states
├── analytics.ts      # AI chat & analytics
└── relations.ts      # All Drizzle relations
```

## 🚀 Next Implementation Steps

### 1. Database Migration
```cmd
cd c:\Users\Rohith\projects\flashio
npm run db:generate
npm run db:migrate
```

### 2. Install Required Dependencies
```cmd
npm install @webcontainer/api codemirror @codemirror/state @codemirror/view
npm install @codemirror/lang-javascript @codemirror/lang-typescript @codemirror/lang-css
npm install @codemirror/lang-html @codemirror/theme-one-dark @codemirror/commands
npm install @codemirror/search @codemirror/autocomplete @codemirror/lint
npm install @lezer/highlight socket.io socket.io-client
```

### 3. Core Implementation Components

#### A. WebContainer Service (`src/lib/webcontainer.ts`)
```typescript
import { WebContainer } from '@webcontainer/api';

export class WebContainerService {
  private static instance: WebContainer | null = null;

  static async boot(options = {}) {
    if (!this.instance) {
      this.instance = await WebContainer.boot(options);
    }
    return this.instance;
  }

  static async mountFiles(files: FileSystemTree) {
    const container = await this.boot();
    await container.mount(files);
  }

  static async watchFiles(path: string, callback: (event: any) => void) {
    const container = await this.boot();
    return container.fs.watch(path, { recursive: true }, callback);
  }
}
```

#### B. CodeMirror Editor Component (`src/components/editor/code-editor.tsx`)
```typescript
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';

export function CodeEditor({ 
  initialContent, 
  language, 
  onChange,
  editorState 
}: CodeEditorProps) {
  // Implementation with persistent state
}
```

#### C. Terminal Component (`src/components/terminal/terminal.tsx`)
```typescript
export function Terminal({ 
  webContainerId, 
  onOutput 
}: TerminalProps) {
  // xterm.js integration with WebContainer processes
}
```

### 4. API Routes Structure

Create these API endpoints:

```
src/app/api/
├── webcontainer/
│   ├── boot/route.ts
│   ├── mount/route.ts
│   ├── spawn/route.ts
│   └── [id]/
│       ├── files/route.ts
│       └── terminal/route.ts
├── editor/
│   ├── state/route.ts
│   ├── completion/route.ts
│   └── collaborate/route.ts
└── projects/
    ├── [id]/
    │   ├── files/route.ts
    │   ├── collaborators/route.ts
    │   └── activity/route.ts
    └── templates/route.ts
```

### 5. Real-time Features with Socket.IO

#### Server Setup (`src/lib/socket-server.ts`)
```typescript
import { Server } from 'socket.io';

export function setupCollaboration(io: Server) {
  io.on('connection', (socket) => {
    // Handle cursor updates
    // Handle file changes
    // Handle collaborative editing
  });
}
```

#### Client Integration (`src/hooks/use-collaboration.ts`)
```typescript
export function useCollaboration(projectId: string) {
  // Socket.IO client hooks for real-time features
}
```

## 🎯 Key Features Implementation Priority

### Phase 1: Core IDE (Week 1-2)
1. ✅ Database schema (Complete)
2. 🔲 Basic CodeMirror editor
3. 🔲 File tree component
4. 🔲 WebContainer integration
5. 🔲 Terminal component

### Phase 2: Collaboration (Week 3-4)
1. 🔲 Real-time cursor sharing
2. 🔲 Live document synchronization
3. 🔲 Comment system
4. 🔲 Permission management

### Phase 3: Advanced Features (Week 5-6)
1. 🔲 Code completion/IntelliSense
2. 🔲 File watching & auto-refresh
3. 🔲 Build task management
4. 🔲 Analytics dashboard

## 🔧 Configuration Files

### WebContainer Config (`webcontainer.config.ts`)
```typescript
export const webContainerConfig = {
  coep: 'credentialless' as const,
  workdirName: 'project',
  forwardPreviewErrors: true
};
```

### CodeMirror Extensions (`editor.config.ts`)
```typescript
export const editorExtensions = [
  javascript(),
  oneDark,
  lineNumbers(),
  highlightActiveLineGutter(),
  // ... other extensions
];
```

## 🗃️ Database Operations Examples

### Create WebContainer Instance
```typescript
import { db, webContainerInstances } from '@/db/schema';

const instance = await db.insert(webContainerInstances).values({
  projectId: 'project-123',
  userId: 'user-456',
  status: 'booting',
  bootOptions: { coep: 'credentialless' }
});
```

### Save Editor State
```typescript
import { db, editorStates } from '@/db/schema';

await db.insert(editorStates).values({
  projectId: 'project-123',
  fileId: 'file-456',
  userId: 'user-789',
  cursorPosition: { line: 10, col: 5 },
  theme: 'oneDark'
});
```

## 🚨 Important Considerations

### Security
- Validate all file operations
- Implement proper CORS for WebContainer
- Sanitize terminal output
- Rate limit API endpoints

### Performance
- Use database indexes on frequently queried fields
- Implement file content caching
- Lazy load editor extensions
- Debounce real-time updates

### Browser Compatibility
- WebContainer requires modern browsers with SharedArrayBuffer
- Implement fallbacks for unsupported features
- Test on different devices and browsers

## 📚 Additional Resources

- [WebContainer API Docs](https://webcontainers.io/api)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [Drizzle ORM Relations](https://orm.drizzle.team/docs/rqb)
- [Socket.IO Real-time Features](https://socket.io/docs/)

Your schema is now ready to support a VS Code-like experience in the browser! 🎉
