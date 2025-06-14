'use client';

import { FC, useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import NewProjectModal from './NewProjectModal';
import { Project } from '@/types/project';
import { Loader2, Plus, Search } from 'lucide-react';

const DashboardContent: FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    // Simulate loading projects from API
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock projects data
        const mockProjects: Project[] = [
          {
            id: '1',
            name: 'React Dashboard',
            description: 'Modern dashboard built with React and Tailwind CSS',
            techStack: [
              { name: 'React', icon: '/logo.svg' },
              { name: 'TypeScript', icon: '/logo.svg' },
              { name: 'Tailwind', icon: '/logo.svg' }
            ],
            lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            collaborators: [
              { id: 'u1', name: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe', role: 'owner' }
            ],
            status: 'active',
            favorite: true,
            tags: ['frontend', 'dashboard'],
            buildHealth: 'healthy'
          },
          {
            id: '2',
            name: 'API Gateway',
            description: 'Microservice API gateway with authentication',
            techStack: [
              { name: 'Node.js', icon: '/logo.svg' },
              { name: 'Express', icon: '/logo.svg' }
            ],
            lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            collaborators: [
              { id: 'u1', name: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe', role: 'owner' },
              { id: 'u2', name: 'Jane Smith', avatar: 'https://ui-avatars.com/api/?name=Jane+Smith', role: 'editor' }
            ],
            status: 'active',
            favorite: false,
            tags: ['backend', 'api'],
            buildHealth: 'warning'
          },
          {
            id: '3',
            name: 'Mobile App',
            description: 'Cross-platform mobile app with React Native',
            techStack: [
              { name: 'React Native', icon: '/logo.svg' },
              { name: 'Expo', icon: '/logo.svg' }
            ],
            lastModified: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            collaborators: [
              { id: 'u1', name: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe', role: 'owner' },
              { id: 'u3', name: 'Mike Brown', avatar: 'https://ui-avatars.com/api/?name=Mike+Brown', role: 'reviewer' },
              { id: 'u4', name: 'Sarah Lee', avatar: 'https://ui-avatars.com/api/?name=Sarah+Lee', role: 'editor' }
            ],
            status: 'active',
            favorite: true,
            tags: ['mobile', 'react-native'],
            buildHealth: 'healthy'
          }
        ];
        
        setProjects(mockProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Filter projects based on search query and filter selection
  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Tab filter
    if (filter === 'favorites' && !project.favorite) return false;
    if (filter === 'recent' && (new Date().getTime() - project.lastModified.getTime() > 3 * 24 * 60 * 60 * 1000)) return false;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Projects</h1>
          <p className="text-gray-400 mt-1">Manage and organize your code projects</p>
        </div>
        <button 
          onClick={() => setIsNewProjectModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          <button 
            className={`px-4 py-2 ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-4 py-2 ${filter === 'recent' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            onClick={() => setFilter('recent')}
          >
            Recent
          </button>
          <button 
            className={`px-4 py-2 ${filter === 'favorites' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            onClick={() => setFilter('favorites')}
          >
            Favorites
          </button>
        </div>
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="text-gray-400 mb-2">No projects found</div>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchQuery ? 
              'Try adjusting your search or filters to find what you\'re looking for.' : 
              'Create your first project to get started with Flash.io.'}
          </p>
        </div>
      )}
      
      {/* New Project Modal */}
      <NewProjectModal 
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />
    </div>
  );
};

export default DashboardContent;