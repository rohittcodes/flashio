import { useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';

interface AIAssistantProps {
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

const quickPrompts = [
  {
    category: 'Code Review',
    prompts: [
      'Review my code for best practices and suggest improvements',
      'Check for security vulnerabilities in this code',
      'Optimize this code for better performance',
      'Add proper error handling to this function'
    ]
  },
  {
    category: 'Documentation',
    prompts: [
      'Generate documentation for this function',
      'Create a README file for this project',
      'Add JSDoc comments to this code',
      'Write unit tests for this component'
    ]
  },
  {
    category: 'Debugging',
    prompts: [
      'Help me debug this error',
      'Explain why this code is not working',
      'Fix the TypeScript errors in this file',
      'Help me understand this console error'
    ]
  },
  {
    category: 'Refactoring',
    prompts: [
      'Refactor this code to use modern JavaScript features',
      'Convert this class component to a functional component',
      'Extract this logic into a custom hook',
      'Split this large component into smaller ones'
    ]
  },
  {
    category: 'Learning',
    prompts: [
      'Explain how this code works step by step',
      'What are the best practices for this technology?',
      'Show me examples of common patterns in React',
      'How can I improve my coding skills?'
    ]
  }
];

export function AIAssistant({ onSendMessage, onClose }: AIAssistantProps) {
  const [selectedCategory, setSelectedCategory] = useState(quickPrompts[0].category);
  const [customPrompt, setCustomPrompt] = useState('');

  const selectedPrompts = quickPrompts.find(p => p.category === selectedCategory)?.prompts || [];

  const handleQuickPrompt = (prompt: string) => {
    onSendMessage(prompt);
    onClose();
  };

  const handleCustomPrompt = () => {
    if (customPrompt.trim()) {
      onSendMessage(customPrompt);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-flashio-elements-background-depth-1 rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-flashio-elements-borderColor">
          <div>
            <h2 className="text-xl font-semibold text-flashio-elements-textPrimary">
              AI Assistant
            </h2>
            <p className="text-sm text-flashio-elements-textSecondary mt-1">
              Get help with coding, debugging, and learning
            </p>
          </div>
          <IconButton onClick={onClose} size="md">
            <div className="i-ph:x text-lg" />
          </IconButton>
        </div>

        <div className="p-6">
          {/* Custom Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-flashio-elements-textPrimary mb-2">
              Ask anything:
            </label>
            <div className="flex gap-2">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Type your question or request here..."
                className="flex-1 p-3 border border-flashio-elements-borderColor rounded bg-flashio-elements-background-depth-2 text-flashio-elements-textPrimary resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleCustomPrompt();
                  }
                }}
              />
              <button
                onClick={handleCustomPrompt}
                disabled={!customPrompt.trim()}
                className="px-4 py-2 bg-flashio-elements-button-primary-background text-flashio-elements-button-primary-text rounded hover:bg-flashio-elements-button-primary-backgroundHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-fit"
              >
                <div className="i-ph:paper-plane-tilt text-lg" />
              </button>
            </div>
            <p className="text-xs text-flashio-elements-textTertiary mt-1">
              Press Ctrl+Enter to send
            </p>
          </div>

          <div className="border-t border-flashio-elements-borderColor pt-6">
            <h3 className="text-lg font-medium text-flashio-elements-textPrimary mb-4">
              Quick Prompts
            </h3>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((category) => (
                <button
                  key={category.category}
                  onClick={() => setSelectedCategory(category.category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.category
                      ? 'bg-flashio-elements-button-primary-background text-flashio-elements-button-primary-text'
                      : 'bg-flashio-elements-button-secondary-background text-flashio-elements-button-secondary-text hover:bg-flashio-elements-button-secondary-backgroundHover'
                  }`}
                >
                  {category.category}
                </button>
              ))}
            </div>

            {/* Quick Prompt Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {selectedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="p-3 text-left border border-flashio-elements-borderColor rounded hover:border-flashio-elements-borderColorActive transition-colors bg-flashio-elements-background-depth-2 hover:bg-flashio-elements-background-depth-3"
                >
                  <div className="text-sm text-flashio-elements-textPrimary">
                    {prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Tips */}
          <div className="mt-6 p-4 bg-flashio-elements-code-background rounded-lg">
            <h4 className="text-sm font-medium text-flashio-elements-textPrimary mb-2 flex items-center gap-2">
              <div className="i-ph:lightbulb text-yellow-500" />
              Pro Tips
            </h4>
            <ul className="text-xs text-flashio-elements-textSecondary space-y-1">
              <li>• Be specific about what you want help with</li>
              <li>• Mention the programming language or framework you're using</li>
              <li>• Include error messages when asking for debugging help</li>
              <li>• Ask for explanations if you want to understand the code better</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
