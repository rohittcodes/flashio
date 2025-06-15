import { useState, useEffect } from 'react';
import { IconButton } from '~/components/ui/IconButton';

interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  languages: { [key: string]: number };
  fileTypes: { [key: string]: number };
  lastModified: Date;
  projectSize: string;
}

interface ProjectStatsProps {
  onClose: () => void;
}

export function ProjectStatsModal({ onClose }: ProjectStatsProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading project statistics
    // In a real implementation, this would analyze the actual project files
    setTimeout(() => {
      setStats({
        totalFiles: 42,
        totalLines: 2847,
        languages: {
          'TypeScript': 1654,
          'JavaScript': 892,
          'CSS': 201,
          'HTML': 67,
          'JSON': 33
        },
        fileTypes: {
          '.tsx': 18,
          '.ts': 12,
          '.css': 8,
          '.json': 3,
          '.html': 1
        },
        lastModified: new Date(),
        projectSize: '145.2 KB'
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'TypeScript': 'bg-blue-500',
      'JavaScript': 'bg-yellow-500',
      'CSS': 'bg-purple-500',
      'HTML': 'bg-orange-500',
      'JSON': 'bg-gray-500'
    };
    return colors[language] || 'bg-gray-400';
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const calculatePercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-flashio-elements-background-depth-1 rounded-lg max-w-2xl w-full mx-4 p-8">
          <div className="flex items-center justify-center">
            <div className="i-svg-spinners:90-ring-with-bg text-flashio-elements-loader-progress text-3xl" />
            <span className="ml-3 text-flashio-elements-textPrimary">Analyzing project...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-flashio-elements-background-depth-1 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-flashio-elements-borderColor">
          <h2 className="text-xl font-semibold text-flashio-elements-textPrimary">
            Project Statistics
          </h2>
          <IconButton onClick={onClose} size="md">
            <div className="i-ph:x text-lg" />
          </IconButton>
        </div>

        <div className="p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-flashio-elements-background-depth-2 p-4 rounded-lg">
              <div className="text-2xl font-bold text-flashio-elements-textPrimary">
                {formatNumber(stats.totalFiles)}
              </div>
              <div className="text-sm text-flashio-elements-textSecondary">Total Files</div>
            </div>
            
            <div className="bg-flashio-elements-background-depth-2 p-4 rounded-lg">
              <div className="text-2xl font-bold text-flashio-elements-textPrimary">
                {formatNumber(stats.totalLines)}
              </div>
              <div className="text-sm text-flashio-elements-textSecondary">Lines of Code</div>
            </div>
            
            <div className="bg-flashio-elements-background-depth-2 p-4 rounded-lg">
              <div className="text-2xl font-bold text-flashio-elements-textPrimary">
                {Object.keys(stats.languages).length}
              </div>
              <div className="text-sm text-flashio-elements-textSecondary">Languages</div>
            </div>
            
            <div className="bg-flashio-elements-background-depth-2 p-4 rounded-lg">
              <div className="text-2xl font-bold text-flashio-elements-textPrimary">
                {stats.projectSize}
              </div>
              <div className="text-sm text-flashio-elements-textSecondary">Project Size</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Language Distribution */}
            <div className="bg-flashio-elements-background-depth-2 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-flashio-elements-textPrimary mb-4 flex items-center gap-2">
                <div className="i-ph:code text-xl" />
                Language Distribution
              </h3>
              
              <div className="space-y-3">
                {Object.entries(stats.languages)
                  .sort(([,a], [,b]) => b - a)
                  .map(([language, lines]) => (
                    <div key={language} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getLanguageColor(language)}`} />
                          <span className="text-flashio-elements-textPrimary">{language}</span>
                        </div>
                        <span className="text-flashio-elements-textSecondary">
                          {formatNumber(lines)} lines ({calculatePercentage(lines, stats.totalLines)}%)
                        </span>
                      </div>
                      <div className="w-full bg-flashio-elements-borderColor rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getLanguageColor(language)}`}
                          style={{
                            width: `${calculatePercentage(lines, stats.totalLines)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* File Types */}
            <div className="bg-flashio-elements-background-depth-2 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-flashio-elements-textPrimary mb-4 flex items-center gap-2">
                <div className="i-ph:file text-xl" />
                File Types
              </h3>
              
              <div className="space-y-2">
                {Object.entries(stats.fileTypes)
                  .sort(([,a], [,b]) => b - a)
                  .map(([extension, count]) => (
                    <div key={extension} className="flex items-center justify-between p-2 bg-flashio-elements-background-depth-3 rounded">
                      <span className="text-flashio-elements-textPrimary font-mono text-sm">
                        {extension}
                      </span>
                      <span className="text-flashio-elements-textSecondary">
                        {formatNumber(count)} files
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Project Insights */}
          <div className="mt-6 bg-flashio-elements-background-depth-2 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-flashio-elements-textPrimary mb-4 flex items-center gap-2">
              <div className="i-ph:chart-bar text-xl" />
              Project Insights
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-flashio-elements-textSecondary">Average lines per file:</div>
                <div className="text-lg font-semibold text-flashio-elements-textPrimary">
                  {Math.round(stats.totalLines / stats.totalFiles)} lines
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-flashio-elements-textSecondary">Last modified:</div>
                <div className="text-lg font-semibold text-flashio-elements-textPrimary">
                  {stats.lastModified.toLocaleDateString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-flashio-elements-textSecondary">Primary language:</div>
                <div className="text-lg font-semibold text-flashio-elements-textPrimary">
                  {Object.entries(stats.languages).sort(([,a], [,b]) => b - a)[0][0]}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-flashio-elements-textSecondary">Project complexity:</div>
                <div className="text-lg font-semibold text-flashio-elements-textPrimary">
                  {stats.totalFiles > 50 ? 'High' : stats.totalFiles > 20 ? 'Medium' : 'Low'}
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="mt-6 flex gap-2">
            <button className="px-4 py-2 bg-flashio-elements-button-secondary-background text-flashio-elements-button-secondary-text rounded hover:bg-flashio-elements-button-secondary-backgroundHover transition-colors">
              Export as JSON
            </button>
            <button className="px-4 py-2 bg-flashio-elements-button-secondary-background text-flashio-elements-button-secondary-text rounded hover:bg-flashio-elements-button-secondary-backgroundHover transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
