import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, ChevronDown, Code, FileCode, GitBranch } from 'lucide-react';

interface Suggestion {
  title: string;
  description: string;
  icon: JSX.Element;
}

const AIPromptInterface: FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions: Suggestion[] = [
    {
      title: 'Create New Project',
      description: 'Generate a new project with recommended tech stack',
      icon: <FileCode className="w-5 h-5" />,
    },
    {
      title: 'Add Feature',
      description: 'Implement a new feature in your codebase',
      icon: <Code className="w-5 h-5" />,
    },
    {
      title: 'Refactor Code',
      description: 'Optimize and improve existing code',
      icon: <GitBranch className="w-5 h-5" />,
    },
  ];

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // TODO: Implement AI processing logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main prompt input */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your project or feature..."
          className="w-full min-h-[120px] p-4 pr-12 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={isGenerating || !prompt.trim()}
          className={`absolute right-4 bottom-4 p-2 rounded-full ${
            isGenerating || !prompt.trim()
              ? 'bg-gray-700 text-gray-500'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } transition-colors`}
        >
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Prompt suggestions */}
      <div className="mt-4">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center text-gray-400 hover:text-white"
        >
          <ChevronDown
            className={`w-4 h-4 mr-2 transform transition-transform ${
              showSuggestions ? 'rotate-180' : ''
            }`}
          />
          Suggestions
        </button>
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
            >
              {suggestions.map((suggestion) => (
                <motion.button
                  key={suggestion.title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPrompt(suggestion.description)}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-gray-700 rounded-lg mr-3">
                      {suggestion.icon}
                    </div>
                    <h3 className="text-white font-medium">{suggestion.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400">{suggestion.description}</p>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Configuration panel */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-white font-medium mb-4">Project Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Programming Language
            </label>
            <select className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Framework
            </label>
            <select className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="next">Next.js</option>
              <option value="react">React</option>
              <option value="vue">Vue.js</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPromptInterface;
