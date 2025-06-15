import { useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  prompt: string;
}

const templates: Template[] = [
  {
    id: 'react-dashboard',
    name: 'React Dashboard',
    description: 'Modern admin dashboard with charts and data visualization',
    icon: 'i-ph:chart-bar-duotone',
    tags: ['React', 'TypeScript', 'Charts', 'Dashboard'],
    prompt: 'Create a modern React dashboard with TypeScript featuring data visualization charts, user management, and a responsive design using Tailwind CSS.'
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'RESTful API with authentication and database integration',
    icon: 'i-ph:database-duotone',
    tags: ['Node.js', 'Express', 'API', 'Database'],
    prompt: 'Create a Node.js REST API with Express, user authentication, JWT tokens, and MongoDB integration with proper error handling and validation.'
  },
  {
    id: 'nextjs-blog',
    name: 'Next.js Blog',
    description: 'Full-stack blog with CMS and SEO optimization',
    icon: 'i-ph:article-duotone',
    tags: ['Next.js', 'Blog', 'CMS', 'SEO'],
    prompt: 'Create a Next.js blog with a headless CMS, SEO optimization, dark mode, search functionality, and responsive design.'
  },
  {
    id: 'vue-ecommerce',
    name: 'Vue E-commerce',
    description: 'Complete e-commerce store with payment integration',
    icon: 'i-ph:shopping-cart-duotone',
    tags: ['Vue.js', 'E-commerce', 'Payment', 'Store'],
    prompt: 'Create a Vue.js e-commerce application with product catalog, shopping cart, user authentication, and payment integration using Stripe.'
  },
  {
    id: 'python-ml',
    name: 'Python ML App',
    description: 'Machine learning application with data analysis',
    icon: 'i-ph:brain-duotone',
    tags: ['Python', 'Machine Learning', 'Data Science', 'AI'],
    prompt: 'Create a Python machine learning application with data analysis, model training, visualization using matplotlib/plotly, and a Streamlit web interface.'
  },
  {
    id: 'flutter-mobile',
    name: 'Flutter Mobile App',
    description: 'Cross-platform mobile app with native features',
    icon: 'i-ph:device-mobile-duotone',
    tags: ['Flutter', 'Mobile', 'Cross-platform', 'Native'],
    prompt: 'Create a Flutter mobile application with user authentication, local storage, API integration, and native device features like camera and GPS.'
  }
];

interface ProjectTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
  onClose: () => void;
}

export function ProjectTemplates({ onSelectTemplate, onClose }: ProjectTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = ['all', 'Frontend', 'Backend', 'Full-stack', 'Mobile', 'Data Science'];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => 
        template.tags.some(tag => 
          tag.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          (selectedCategory === 'Frontend' && ['React', 'Vue.js', 'Next.js'].includes(tag)) ||
          (selectedCategory === 'Backend' && ['Node.js', 'Express', 'API', 'Database', 'Python'].includes(tag)) ||
          (selectedCategory === 'Full-stack' && ['Next.js', 'E-commerce'].includes(tag)) ||
          (selectedCategory === 'Mobile' && ['Flutter', 'Mobile'].includes(tag)) ||
          (selectedCategory === 'Data Science' && ['Machine Learning', 'Data Science', 'Python'].includes(tag))
        )
      );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-flashio-elements-background-depth-1 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-flashio-elements-borderColor">
          <h2 className="text-xl font-semibold text-flashio-elements-textPrimary">
            Project Templates
          </h2>
          <IconButton onClick={onClose} size="md">
            <div className="i-ph:x text-lg" />
          </IconButton>
        </div>

        <div className="p-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-flashio-elements-button-primary-background text-flashio-elements-button-primary-text'
                    : 'bg-flashio-elements-button-secondary-background text-flashio-elements-button-secondary-text hover:bg-flashio-elements-button-secondary-backgroundHover'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template.prompt);
                  onClose();
                }}
                className="p-4 border border-flashio-elements-borderColor rounded-lg cursor-pointer hover:border-flashio-elements-borderColorActive transition-colors bg-flashio-elements-background-depth-2 hover:bg-flashio-elements-background-depth-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`${template.icon} text-2xl text-flashio-elements-textSecondary`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-flashio-elements-textPrimary mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-flashio-elements-textSecondary mb-2 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 text-xs bg-flashio-elements-code-background text-flashio-elements-code-text rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-flashio-elements-textTertiary">
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
