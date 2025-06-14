import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { Project } from '@/types/project';
import { motion } from 'framer-motion';
import { ViewColumns, ViewGrid, Search, Filter } from 'lucide-react';

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data - replace with actual data fetching
  const projects: Project[] = [
    {
      id: '1',
      name: 'AI Chat Application',
      description: 'A cutting-edge chat application with AI-powered responses',
      techStack: [
        { name: 'React', icon: '/icons/react.svg' },
        { name: 'TypeScript', icon: '/icons/typescript.svg' },
      ],
      lastModified: new Date('2025-06-13'),
      collaborators: [
        { id: '1', name: 'John Doe', avatar: '/avatars/1.jpg', role: 'owner' },
        { id: '2', name: 'Jane Smith', avatar: '/avatars/2.jpg', role: 'editor' },
      ],
      status: 'active',
      favorite: true,
      tags: ['ai', 'chat', 'frontend'],
      buildHealth: 'healthy',
      gitInfo: {
        repository: 'username/ai-chat',
        branch: 'main',
        lastCommit: 'abc123',
        provider: 'github',
      },
    },
    // Add more mock projects as needed
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'favorite' && project.favorite) ||
      project.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Projects</h1>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            New Project
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-gray-700 text-white rounded-lg border border-gray-600 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
              <option value="favorite">Favorites</option>
            </select>

            <div className="flex items-center bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
              >
                <ViewGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
              >
                <ViewColumns className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Project Grid */}
        <motion.div
          layout
          className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          }`}
        >
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No projects found</div>
            <button className="text-indigo-500 hover:text-indigo-400">
              Create a new project
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
