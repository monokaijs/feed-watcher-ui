'use client';

import { useState, useEffect } from 'react';
import { Settings, Check, X, AlertCircle, Github } from 'lucide-react';
import { getConfig, saveConfig, validateRepositoryUrl, parseRepositoryUrl, resetConfig } from '@/lib/config';
import { FeedConfig } from '@/types/post';

interface ConfigPanelProps {
  onConfigChange?: (config: FeedConfig) => void;
}

export function ConfigPanel({ onConfigChange }: ConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<FeedConfig>(getConfig());
  const [tempUrl, setTempUrl] = useState('');
  const [tempPostsPath, setTempPostsPath] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const currentConfig = getConfig();
    setConfig(currentConfig);
    setTempUrl(currentConfig.repositoryUrl);
    setTempPostsPath(currentConfig.postsPath);
  }, []);

  const handleUrlChange = (url: string) => {
    setTempUrl(url);
    setValidationStatus('idle');
    setError('');
  };

  const validateUrl = async () => {
    if (!tempUrl.trim()) {
      setError('Repository URL is required');
      setValidationStatus('invalid');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      if (!validateRepositoryUrl(tempUrl)) {
        setError('Invalid GitHub repository URL format');
        setValidationStatus('invalid');
        return;
      }

      const parsed = parseRepositoryUrl(tempUrl);
      if (!parsed) {
        setError('Could not parse repository URL');
        setValidationStatus('invalid');
        return;
      }

      // Basic validation - check if URL format is correct
      setValidationStatus('valid');
    } catch (error) {
      console.error('Validation error:', error);
      setError('Error validating repository URL');
      setValidationStatus('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (validationStatus !== 'valid') {
      setError('Please validate the repository URL first');
      return;
    }

    const newConfig: Partial<FeedConfig> = {
      repositoryUrl: tempUrl.trim(),
      postsPath: tempPostsPath.trim() || 'posts',
    };

    saveConfig(newConfig);
    const updatedConfig = getConfig();
    setConfig(updatedConfig);
    
    if (onConfigChange) {
      onConfigChange(updatedConfig);
    }

    setIsOpen(false);
    setError('');
  };

  const handleReset = () => {
    resetConfig();
    const defaultConfig = getConfig();
    setConfig(defaultConfig);
    setTempUrl(defaultConfig.repositoryUrl);
    setTempPostsPath(defaultConfig.postsPath);
    setValidationStatus('idle');
    setError('');
    
    if (onConfigChange) {
      onConfigChange(defaultConfig);
    }
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
    
    switch (validationStatus) {
      case 'valid':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow z-50"
        title="Configure Repository"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Repository Configuration</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Current Config Display */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Current Configuration</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Owner:</strong> {config.owner}</div>
                  <div><strong>Repository:</strong> {config.repo}</div>
                  <div><strong>Posts Path:</strong> {config.postsPath}</div>
                </div>
              </div>

              {/* Repository URL Input */}
              <div>
                <label htmlFor="repo-url" className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Repository URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="repo-url"
                    type="url"
                    value={tempUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={validateUrl}
                    disabled={isValidating}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {getValidationIcon()}
                    Validate
                  </button>
                </div>
              </div>

              {/* Posts Path Input */}
              <div>
                <label htmlFor="posts-path" className="block text-sm font-medium text-gray-700 mb-2">
                  Posts Directory Path
                </label>
                <input
                  id="posts-path"
                  type="text"
                  value={tempPostsPath}
                  onChange={(e) => setTempPostsPath(e.target.value)}
                  placeholder="posts/j2team-community-backup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Path to the directory containing MDX post files
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Success Display */}
              {validationStatus === 'valid' && !error && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-700">Repository URL is valid</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Reset to Default
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={validationStatus !== 'valid'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
