import { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Projects', href: '/dashboard' },
    { name: 'AI Workspace', href: '/dashboard/ai' },
    { name: 'Code Editor', href: '/dashboard/editor' },
    { name: 'Analytics', href: '/dashboard/analytics' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 shadow-xl"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <span className="text-xl font-bold text-white">Flashio</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-gray-400 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="px-2 py-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center px-4 py-2 mb-1 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white"
            >
              {item.name}
            </a>
          ))}
        </nav>
      </motion.aside>

      {/* Main content */}
      <div className={cn('flex flex-col', sidebarOpen ? 'ml-64' : 'ml-0')}>
        <header className="sticky top-0 z-40 flex items-center h-16 px-4 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 mr-4 text-gray-400 hover:text-white lg:hidden"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            {/* Add user profile, notifications, etc. */}
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
