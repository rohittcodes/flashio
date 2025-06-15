import { useState, useEffect } from 'react';
import { IconButton } from '~/components/ui/IconButton';

interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: Date;
  technologies: string[];
  status: 'active' | 'completed' | 'paused';
  favorite: boolean;
}

interface ProjectManagerProps {
  onSelectProject: (project: Project) => void;
  onClose: () => void;
}

export function ProjectManager({ onSelectProject, onClose }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified' | 'status'>('lastModified');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  // Load projects from localStorage on component mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('flashio_projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects).map((p: any) => ({
        ...p,
        lastModified: new Date(p.lastModified)
      }));
      setProjects(parsedProjects);
    } else {
      // Initialize with sample projects
      const sampleProjects: Project[] = [
        {
          id: '1',
          name: 'E-commerce Dashboard',
          description: 'Admin dashboard for online store management',
          lastModified: new Date(Date.now() - 86400000), // Yesterday
          technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Chart.js'],
          status: 'active',
          favorite: true
        },
        {
          id: '2',
          name: 'Task Management API',
          description: 'RESTful API for task management with authentication',
          lastModified: new Date(Date.now() - 172800000), // 2 days ago
          technologies: ['Node.js', 'Express', 'MongoDB', 'JWT'],
          status: 'completed',
          favorite: false
        },
        {
          id: '3',
          name: 'Weather App',
          description: 'Mobile-first weather application with location services',
          lastModified: new Date(Date.now() - 604800000), // 1 week ago
          technologies: ['React Native', 'TypeScript', 'Weather API'],
          status: 'paused',
          favorite: false
        }
      ];
      setProjects(sampleProjects);
    }
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('flashio_projects', JSON.stringify(projects));
  }, [projects]);

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = searchTerm === '' ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastModified':
          return b.lastModified.getTime() - a.lastModified.getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const toggleFavorite = (projectId: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, favorite: !p.favorite } : p
    ));
  };

  const deleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  const updateProjectStatus = (projectId: string, status: Project['status']) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, status, lastModified: new Date() } : p
    ));
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-100';
      case 'completed':
        return 'text-blue-500 bg-blue-100';
      case 'paused':
        return 'text-yellow-500 bg-yellow-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-flashio-elements-background-depth-1 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-flashio-elements-borderColor">
          <h2 className="text-xl font-semibold text-flashio-elements-textPrimary">
            Project Manager
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="px-4 py-2 bg-flashio-elements-button-primary-background text-flashio-elements-button-primary-text rounded hover:bg-flashio-elements-button-primary-backgroundHover transition-colors"
            >
              New Project
            </button>
            <IconButton onClick={onClose} size="md">
              <div className="i-ph:x text-lg" />
            </IconButton>
          </div>
        </div>

        <div className="p-6">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-flashio-elements-borderColor rounded bg-flashio-elements-background-depth-2 text-flashio-elements-textPrimary"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="p-2 border border-flashio-elements-borderColor rounded bg-flashio-elements-background-depth-2 text-flashio-elements-textPrimary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2 border border-flashio-elements-borderColor rounded bg-flashio-elements-background-depth-2 text-flashio-elements-textPrimary"
              >
                <option value="lastModified">Last Modified</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredAndSortedProjects.map((project) => (
              <div
                key={project.id}
                className="border border-flashio-elements-borderColor rounded-lg p-4 bg-flashio-elements-background-depth-2 hover:border-flashio-elements-borderColorActive transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-flashio-elements-textPrimary truncate">
                        {project.name}
                      </h3>
                      <button
                        onClick={() => toggleFavorite(project.id)}
                        className="text-flashio-elements-textSecondary hover:text-yellow-500 transition-colors"
                      >
                        <div className={`i-ph:star${project.favorite ? '-fill' : ''} text-sm`} />
                      </button>
                    </div>
                    <p className="text-sm text-flashio-elements-textSecondary mb-2 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className="text-xs text-flashio-elements-textTertiary">
                    {formatDate(project.lastModified)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {project.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="inline-block px-2 py-1 text-xs bg-flashio-elements-code-background text-flashio-elements-code-text rounded"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="text-xs text-flashio-elements-textTertiary">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectProject(project)}
                    className="flex-1 p-2 bg-flashio-elements-button-primary-background text-flashio-elements-button-primary-text rounded hover:bg-flashio-elements-button-primary-backgroundHover transition-colors text-sm"
                  >
                    Open
                  </button>
                  
                  <div className="relative group">
                    <button className="p-2 bg-flashio-elements-button-secondary-background text-flashio-elements-button-secondary-text rounded hover:bg-flashio-elements-button-secondary-backgroundHover transition-colors">
                      <div className="i-ph:dots-three-vertical text-sm" />
                    </button>
                    
                    <div className="absolute right-0 top-full mt-1 bg-flashio-elements-background-depth-1 border border-flashio-elements-borderColor rounded shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-32">
                      <button
                        onClick={() => updateProjectStatus(project.id, 'active')}
                        className="w-full px-3 py-1 text-left text-sm text-flashio-elements-textPrimary hover:bg-flashio-elements-item-backgroundActive"
                      >
                        Mark Active
                      </button>
                      <button
                        onClick={() => updateProjectStatus(project.id, 'completed')}
                        className="w-full px-3 py-1 text-left text-sm text-flashio-elements-textPrimary hover:bg-flashio-elements-item-backgroundActive"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => updateProjectStatus(project.id, 'paused')}
                        className="w-full px-3 py-1 text-left text-sm text-flashio-elements-textPrimary hover:bg-flashio-elements-item-backgroundActive"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="w-full px-3 py-1 text-left text-sm text-flashio-elements-item-contentDanger hover:bg-flashio-elements-item-backgroundDanger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedProjects.length === 0 && (
            <div className="text-center py-8 text-flashio-elements-textSecondary">
              {searchTerm || statusFilter !== 'all' 
                ? 'No projects found matching your criteria.'
                : 'No projects yet. Create your first project!'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
