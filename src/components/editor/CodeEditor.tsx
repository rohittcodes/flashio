import { FC, useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { motion } from 'framer-motion';
import {
  FolderTree,
  Play,
  PanelLeftClose,
  PanelRightClose,
  Settings,
  Terminal,
  MessageSquare,
} from 'lucide-react';

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  theme?: string;
}

const CodeEditor: FC<CodeEditorProps> = ({
  initialCode = '',
  language = 'typescript',
  theme = 'vs-dark',
}) => {
  const [code, setCode] = useState(initialCode);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      // TODO: Implement code execution logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Panel (File Explorer) */}
      <motion.div
        initial={{ width: 250 }}
        animate={{ width: showLeftPanel ? 250 : 0 }}
        className={`bg-gray-800 border-r border-gray-700 ${
          showLeftPanel ? 'block' : 'hidden'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Explorer</h3>
            <button
              onClick={() => setShowLeftPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-gray-400 hover:text-white cursor-pointer">
              <FolderTree className="w-4 h-4 mr-2" />
              src/
            </div>
            {/* Add more file tree items */}
          </div>
        </div>
      </motion.div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!showLeftPanel && (
              <button
                onClick={() => setShowLeftPanel(true)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <PanelLeftClose className="w-5 h-5 transform rotate-180" />
              </button>
            )}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`px-3 py-1 rounded-md flex items-center space-x-2 ${
                isRunning
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-400 hover:text-white">
              <Settings className="w-5 h-5" />
            </button>
            {!showRightPanel && (
              <button
                onClick={() => setShowRightPanel(true)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <PanelRightClose className="w-5 h-5 transform rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage={language}
            defaultValue={code}
            theme={theme}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 10 },
            }}
          />
        </div>

        {/* Terminal */}
        <div className="h-1/4 bg-gray-900 border-t border-gray-700">
          <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-2 text-gray-400">
              <Terminal className="w-4 h-4" />
              <span>Terminal</span>
            </div>
            <button className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 font-mono text-sm text-gray-300">
            {/* Add terminal output */}
          </div>
        </div>
      </div>

      {/* Right Panel (AI Assistant) */}
      <motion.div
        initial={{ width: 300 }}
        animate={{ width: showRightPanel ? 300 : 0 }}
        className={`bg-gray-800 border-l border-gray-700 ${
          showRightPanel ? 'block' : 'hidden'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">AI Assistant</h3>
            <button
              onClick={() => setShowRightPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <PanelRightClose className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-white">
                  How can I help you with your code today?
                </p>
              </div>
            </div>
            {/* Add more AI conversation messages */}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CodeEditor;
