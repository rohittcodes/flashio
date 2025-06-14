import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AIPromptInterface from '@/components/ai/AIPromptInterface';
import { motion } from 'framer-motion';
import { Code2, GitBranch, FilePlus2 } from 'lucide-react';

export default function AIWorkspacePage() {
  const stats = [
    {
      label: 'Projects Generated',
      value: '124',
      icon: <FilePlus2 className="w-5 h-5" />,
    },
    {
      label: 'Code Commits',
      value: '2.4k',
      icon: <GitBranch className="w-5 h-5" />,
    },
    {
      label: 'Lines of Code',
      value: '156k',
      icon: <Code2 className="w-5 h-5" />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            AI Workspace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Describe your project or feature in natural language, and let AI handle the implementation details.
          </motion.p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400">{stat.label}</h3>
                <div className="p-2 bg-gray-700 rounded-lg">
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Prompt Interface */}
        <AIPromptInterface />

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Generated New React Component</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Created a reusable button component with variants
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">2 hours ago</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
