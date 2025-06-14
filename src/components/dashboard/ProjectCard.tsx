'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import { Project } from '@/types/project';
import { StarIcon, ArrowPathIcon, ShareIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  const router = useRouter();
  
  const getBuildHealthColor = (health: Project['buildHealth']) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleCardClick = () => {
    router.push(`/ide?projectId=${project.id}`);
  };
  
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // Add favorite toggle functionality here
    console.log('Toggle favorite for project:', project.id);
  };

  const handleActionClick = (action: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    console.log(`Action ${action} for project:`, project.id);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative group bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Project thumbnail */}
      <div className="h-48 bg-gray-900">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No thumbnail
          </div>
        )}
      </div>

      {/* Project info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{project.name}</h3>
            <p className="mt-1 text-sm text-gray-400">{project.description}</p>
          </div>
          <button
            className={`text-gray-400 hover:text-yellow-500 transition-colors ${
              project.favorite ? 'text-yellow-500' : ''
            }`}
            onClick={handleFavoriteToggle}
          >
            <StarIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tech stack */}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <span
              key={tech.name}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300"
            >
              <img src={tech.icon} alt={tech.name} className="w-4 h-4 mr-1" />
              {tech.name}
            </span>
          ))}
        </div>

        {/* Meta information */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getBuildHealthColor(project.buildHealth)}`} />
            <span>{formatDistanceToNow(project.lastModified)} ago</span>
          </div>
          <div className="flex -space-x-2">
            {project.collaborators.slice(0, 3).map((collaborator) => (
              <img
                key={collaborator.id}
                src={collaborator.avatar}
                alt={collaborator.name}
                className="w-6 h-6 rounded-full border-2 border-gray-800"
                title={collaborator.name}
              />
            ))}
            {project.collaborators.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                +{project.collaborators.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex space-x-1">
          <button 
            className="p-1 rounded-full bg-gray-800/80 text-gray-300 hover:text-white"
            onClick={(e) => handleActionClick('share', e)}
          >
            <ShareIcon className="w-4 h-4" />
          </button>
          <button 
            className="p-1 rounded-full bg-gray-800/80 text-gray-300 hover:text-white"
            onClick={(e) => handleActionClick('refresh', e)}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button 
            className="p-1 rounded-full bg-gray-800/80 text-gray-300 hover:text-white"
            onClick={(e) => handleActionClick('archive', e)}
          >
            <ArchiveBoxIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
