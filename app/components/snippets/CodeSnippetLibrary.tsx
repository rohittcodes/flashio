import { useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  language: string;
  category: string;
  code: string;
  tags: string[];
}

const snippets: CodeSnippet[] = [
  {
    id: 'react-hook-form',
    title: 'React Hook Form Setup',
    description: 'Complete form setup with validation using React Hook Form and Zod',
    language: 'typescript',
    category: 'React',
    code: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type FormData = z.infer<typeof schema>;

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Handle form submission
      console.log(data);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...register('name')}
          placeholder="Full Name"
          className="w-full p-2 border rounded"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>
      
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>
      
      <div>
        <input
          {...register('password')}
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}`,
    tags: ['React', 'Forms', 'Validation', 'TypeScript']
  },
  {
    id: 'nodejs-middleware',
    title: 'Express Middleware Collection',
    description: 'Common Express.js middleware for authentication, logging, and error handling',
    language: 'javascript',
    category: 'Node.js',
    code: `const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Logging middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(\`[\${timestamp}] \${req.method} \${req.path} - IP: \${req.ip}\`);
  next();
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

// CORS middleware
const cors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

module.exports = {
  authenticateToken,
  logger,
  limiter,
  errorHandler,
  cors
};`,
    tags: ['Node.js', 'Express', 'Middleware', 'Authentication']
  },
  {
    id: 'python-data-analysis',
    title: 'Python Data Analysis Starter',
    description: 'Data analysis and visualization setup with pandas and matplotlib',
    language: 'python',
    category: 'Data Science',
    code: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

# Set up plotting style
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class DataAnalyzer:
    def __init__(self, data_source):
        """Initialize with data source (file path or DataFrame)"""
        if isinstance(data_source, str):
            self.df = pd.read_csv(data_source)
        else:
            self.df = data_source.copy()
        
        print(f"Data loaded: {self.df.shape[0]} rows, {self.df.shape[1]} columns")
    
    def basic_info(self):
        """Display basic information about the dataset"""
        print("\\n=== Dataset Overview ===")
        print(f"Shape: {self.df.shape}")
        print(f"\\nData types:\\n{self.df.dtypes}")
        print(f"\\nMissing values:\\n{self.df.isnull().sum()}")
        print(f"\\nBasic statistics:\\n{self.df.describe()}")
        
        return self.df.head()
    
    def clean_data(self):
        """Basic data cleaning operations"""
        # Remove duplicates
        initial_rows = len(self.df)
        self.df = self.df.drop_duplicates()
        removed_duplicates = initial_rows - len(self.df)
        
        # Fill numeric columns with median
        numeric_columns = self.df.select_dtypes(include=[np.number]).columns
        self.df[numeric_columns] = self.df[numeric_columns].fillna(
            self.df[numeric_columns].median()
        )
        
        # Fill categorical columns with mode
        categorical_columns = self.df.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            mode_value = self.df[col].mode().iloc[0] if not self.df[col].mode().empty else 'Unknown'
            self.df[col] = self.df[col].fillna(mode_value)
        
        print(f"Data cleaning completed. Removed {removed_duplicates} duplicates.")
        return self.df
    
    def correlation_analysis(self, figsize=(10, 8)):
        """Generate correlation heatmap for numeric columns"""
        numeric_df = self.df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            print("No numeric columns found for correlation analysis.")
            return
        
        plt.figure(figsize=figsize)
        correlation_matrix = numeric_df.corr()
        
        sns.heatmap(
            correlation_matrix,
            annot=True,
            cmap='coolwarm',
            center=0,
            square=True,
            fmt='.2f',
            cbar_kws={'shrink': 0.8}
        )
        
        plt.title('Correlation Matrix')
        plt.tight_layout()
        plt.show()
        
        return correlation_matrix
    
    def plot_distributions(self, columns=None, figsize=(15, 10)):
        """Plot distributions for numeric columns"""
        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns
        
        n_cols = 3
        n_rows = (len(columns) + n_cols - 1) // n_cols
        
        fig, axes = plt.subplots(n_rows, n_cols, figsize=figsize)
        axes = axes.flatten() if n_rows > 1 else [axes]
        
        for i, col in enumerate(columns):
            if i < len(axes):
                self.df[col].hist(bins=30, ax=axes[i], alpha=0.7)
                axes[i].set_title(f'Distribution of {col}')
                axes[i].set_xlabel(col)
                axes[i].set_ylabel('Frequency')
        
        # Hide empty subplots
        for i in range(len(columns), len(axes)):
            axes[i].set_visible(False)
        
        plt.tight_layout()
        plt.show()

# Example usage
if __name__ == "__main__":
    # Create sample data
    np.random.seed(42)
    sample_data = pd.DataFrame({
        'sales': np.random.normal(1000, 200, 1000),
        'profit': np.random.normal(150, 50, 1000),
        'customers': np.random.poisson(25, 1000),
        'category': np.random.choice(['A', 'B', 'C'], 1000),
        'date': pd.date_range('2023-01-01', periods=1000, freq='D')
    })
    
    # Initialize analyzer
    analyzer = DataAnalyzer(sample_data)
    
    # Run analysis
    analyzer.basic_info()
    analyzer.clean_data()
    analyzer.correlation_analysis()
    analyzer.plot_distributions()`,
    tags: ['Python', 'Data Science', 'Pandas', 'Visualization']
  },
  {
    id: 'css-animations',
    title: 'CSS Animation Library',
    description: 'Collection of smooth CSS animations and transitions',
    language: 'css',
    category: 'CSS',
    code: `/* Fade In Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Scale Animations */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-20px);
  }
  70% {
    transform: translateY(-10px);
  }
  90% {
    transform: translateY(-4px);
  }
}

/* Loading Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

/* Utility Classes */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-fade-in-left {
  animation: fadeInLeft 0.6s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}

.animate-bounce {
  animation: bounce 1s;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

/* Hover Effects */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.hover-glow {
  transition: box-shadow 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* Button Animations */
.btn-animated {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-animated::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-animated:hover::before {
  left: 100%;
}

/* Stagger Animation for Lists */
.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease-out forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }
.stagger-item:nth-child(5) { animation-delay: 0.5s; }

/* Responsive Animations */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`,
    tags: ['CSS', 'Animation', 'Transitions', 'UI/UX']
  }
];

interface CodeSnippetLibraryProps {
  onInsertSnippet: (code: string) => void;
  onClose: () => void;
}

export function CodeSnippetLibrary({ onInsertSnippet, onClose }: CodeSnippetLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['all', ...Array.from(new Set(snippets.map(s => s.category)))];

  const filteredSnippets = snippets.filter(snippet => {
    const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-flashio-elements-background-depth-1 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-flashio-elements-borderColor">
          <h2 className="text-xl font-semibold text-flashio-elements-textPrimary">
            Code Snippet Library
          </h2>
          <IconButton onClick={onClose} size="md">
            <div className="i-ph:x text-lg" />
          </IconButton>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search snippets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-flashio-elements-borderColor rounded bg-flashio-elements-background-depth-2 text-flashio-elements-textPrimary"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Snippets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className="border border-flashio-elements-borderColor rounded-lg p-4 bg-flashio-elements-background-depth-2 hover:border-flashio-elements-borderColorActive transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-flashio-elements-textPrimary mb-1">
                      {snippet.title}
                    </h3>
                    <p className="text-sm text-flashio-elements-textSecondary mb-2">
                      {snippet.description}
                    </p>
                  </div>
                  <span className="text-xs bg-flashio-elements-code-background text-flashio-elements-code-text px-2 py-1 rounded">
                    {snippet.language}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {snippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 text-xs bg-flashio-elements-item-backgroundDefault text-flashio-elements-textTertiary rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="bg-flashio-elements-code-background p-3 rounded text-xs font-mono text-flashio-elements-code-text mb-3 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{snippet.code.slice(0, 200)}...</pre>
                </div>

                <button
                  onClick={() => {
                    onInsertSnippet(snippet.code);
                    onClose();
                  }}
                  className="w-full p-2 bg-flashio-elements-button-primary-background text-flashio-elements-button-primary-text rounded hover:bg-flashio-elements-button-primary-backgroundHover transition-colors"
                >
                  Insert Snippet
                </button>
              </div>
            ))}
          </div>

          {filteredSnippets.length === 0 && (
            <div className="text-center py-8 text-flashio-elements-textSecondary">
              No snippets found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
