'use client';

import { FC, useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'details' | 'techs' | 'preview' | 'generating';

interface TechOption {
  id: string;
  name: string;
  category: string;
  recommended?: boolean;
}

const NewProjectModal: FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [projectDetails, setProjectDetails] = useState({
    name: '',
    description: '',
    type: 'web',
    complexity: 'medium'
  });
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const techOptions: TechOption[] = [
    { id: 'react', name: 'React', category: 'frontend', recommended: true },
    { id: 'next', name: 'Next.js', category: 'frontend', recommended: true },
    { id: 'vue', name: 'Vue.js', category: 'frontend' },
    { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend', recommended: true },
    { id: 'node', name: 'Node.js', category: 'backend', recommended: true },
    { id: 'express', name: 'Express', category: 'backend', recommended: true },
    { id: 'postgres', name: 'PostgreSQL', category: 'database', recommended: true },
    { id: 'mongodb', name: 'MongoDB', category: 'database' },
    { id: 'jest', name: 'Jest', category: 'testing' },
  ];
  
  useEffect(() => {
    // Set recommended technologies based on project type
    const recommended = techOptions.filter(tech => tech.recommended).map(tech => tech.id);
    setSelectedTechs(recommended);
  }, [projectDetails.type]);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('details');
      setProjectDetails({
        name: '',
        description: '',
        type: 'web',
        complexity: 'medium'
      });
      setProgress(0);
    }
  }, [isOpen]);
  
  // Simulate project generation
  useEffect(() => {
    if (currentStep === 'generating') {
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 15;
          if (next >= 100) {
            clearInterval(interval);
            // Navigate to the IDE page after generation completes
            setTimeout(() => {
              router.push('/ide?projectId=new-project');
            }, 500);
            return 100;
          }
          return next;
        });
      }, 600);
      
      return () => clearInterval(interval);
    }
  }, [currentStep, router]);
  
  const handleNext = () => {
    if (currentStep === 'details') setCurrentStep('techs');
    else if (currentStep === 'techs') setCurrentStep('preview');
    else if (currentStep === 'preview') setCurrentStep('generating');
  };
  
  const handleBack = () => {
    if (currentStep === 'techs') setCurrentStep('details');
    else if (currentStep === 'preview') setCurrentStep('techs');
  };
  
  const handleTechToggle = (techId: string) => {
    setSelectedTechs(prev => 
      prev.includes(techId) 
        ? prev.filter(id => id !== techId) 
        : [...prev, techId]
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-700 p-5">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Sparkles className="text-indigo-500 w-5 h-5 mr-2" />
              Create AI-Powered Project
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-5">
            {currentStep === 'details' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Project Details</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={projectDetails.name}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Awesome Project"
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={projectDetails.description}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Briefly describe what your project does..."
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project Type</label>
                  <select
                    value={projectDetails.type}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="web">Web Application</option>
                    <option value="api">API / Backend Service</option>
                    <option value="mobile">Mobile App</option>
                    <option value="desktop">Desktop Application</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Complexity</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['simple', 'medium', 'complex'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setProjectDetails(prev => ({ ...prev, complexity: level }))}
                        className={`py-2 px-4 rounded-md capitalize ${
                          projectDetails.complexity === level 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 'techs' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Select Technologies</h4>
                <p className="text-gray-400 text-sm">Choose the tech stack for your project. Recommended options are pre-selected.</p>
                
                <div className="space-y-3">
                  {['frontend', 'backend', 'database', 'testing'].map(category => (
                    <div key={category} className="space-y-2">
                      <h5 className="text-sm text-gray-300 uppercase">{category}</h5>
                      <div className="flex flex-wrap gap-2">
                        {techOptions
                          .filter(tech => tech.category === category)
                          .map(tech => (
                            <button
                              key={tech.id}
                              onClick={() => handleTechToggle(tech.id)}
                              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                                selectedTechs.includes(tech.id)
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {selectedTechs.includes(tech.id) && <Check className="w-4 h-4" />}
                              {tech.name}
                              {tech.recommended && (
                                <span className="text-xs bg-indigo-800 px-1.5 py-0.5 rounded">
                                  Recommended
                                </span>
                              )}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentStep === 'preview' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Project Preview</h4>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h5 className="font-medium text-white">{projectDetails.name || 'New Project'}</h5>
                  <p className="text-gray-300 text-sm mt-1">{projectDetails.description || 'No description provided'}</p>
                  
                  <div className="mt-4">
                    <div className="text-sm text-gray-400">Tech Stack:</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTechs.map(techId => {
                        const tech = techOptions.find(t => t.id === techId);
                        return (
                          <span key={techId} className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-200">
                            {tech?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-gray-400">Estimated Build Time:</div>
                    <div className="text-white mt-1">
                      {projectDetails.complexity === 'simple' && '~5 minutes'}
                      {projectDetails.complexity === 'medium' && '~15 minutes'}
                      {projectDetails.complexity === 'complex' && '~30 minutes'}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-gray-400">Sample File Structure:</div>
                    <pre className="mt-1 p-2 bg-gray-800 rounded text-xs text-gray-300 overflow-auto">
                      {`${projectDetails.name || 'project'}/
├── src/
│   ├── components/
│   ├── ${projectDetails.type === 'api' ? 'routes/' : 'pages/'}
│   └── ${projectDetails.type === 'web' ? 'styles/' : 'utils/'}
├── public/
├── package.json
└── README.md`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 'generating' && (
              <div className="space-y-6 py-4">
                <h4 className="text-lg font-semibold text-white">
                  Creating Your Project
                </h4>
                <div className="text-gray-300">
                  Flash.io's AI is generating your {projectDetails.name || 'new project'}...
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="text-gray-400 text-sm">
                  {progress < 30 && 'Scaffolding project structure...'}
                  {progress >= 30 && progress < 60 && 'Generating code files...'}
                  {progress >= 60 && progress < 90 && 'Installing dependencies...'}
                  {progress >= 90 && 'Finalizing your project...'}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center border-t border-gray-700 p-5">
            {currentStep !== 'generating' ? (
              <>
                <button
                  onClick={currentStep === 'details' ? onClose : handleBack}
                  className="px-4 py-2 text-gray-300 hover:text-white flex items-center"
                >
                  {currentStep === 'details' ? 'Cancel' : (
                    <>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center"
                  disabled={currentStep === 'details' && !projectDetails.name.trim()}
                >
                  {currentStep === 'preview' ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="w-full text-center text-gray-400">
                This may take a few moments...
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NewProjectModal;
