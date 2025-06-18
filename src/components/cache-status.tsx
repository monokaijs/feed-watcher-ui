'use client';

import { useState } from 'react';
import { Database, X, Trash2, Info } from 'lucide-react';
import { PostLoader } from '@/lib/post-loader';
import { persistentCache } from '@/lib/persistent-cache';

interface CacheStatusProps {
  githubAPI: PostLoader;
}

export function CacheStatus({ githubAPI }: CacheStatusProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClearMemoryCache = () => {
    githubAPI.clearCache();
    setIsOpen(false);
  };

  const handleClearPersistentCache = () => {
    persistentCache.clear();
    setIsOpen(false);
  };

  const handleClearAllCache = () => {
    githubAPI.clearCache();
    persistentCache.clear();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow z-40"
        title="Cache Status"
      >
        <Database className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  const memoryCache = githubAPI.getCacheInfo();
  const persistentCacheStats = persistentCache.getStats();
  const rateLimitInfo = githubAPI.getRateLimitInfo();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm w-full z-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Cache Status</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Memory Cache */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Memory Cache</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Entries: {memoryCache.size}</div>
          <div>Oldest: {memoryCache.entries.length > 0 ? 
            Math.round(Math.max(...memoryCache.entries.map(e => e.age)) / 1000 / 60) + 'm ago' : 
            'None'
          }</div>
        </div>
      </div>

      {/* Persistent Cache */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Persistent Cache</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Entries: {persistentCacheStats.size}</div>
          <div>Size: {persistentCacheStats.totalSize}</div>
          <div>Oldest: {persistentCacheStats.entries.length > 0 ? 
            Math.round(Math.max(...persistentCacheStats.entries.map(e => e.age)) / 1000 / 60) + 'm ago' : 
            'None'
          }</div>
        </div>
      </div>

      {/* Rate Limit */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">GitHub API</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Remaining: {rateLimitInfo.remaining}/60</div>
          <div>Reset: {rateLimitInfo.resetTime > 0 ? 
            new Date(rateLimitInfo.resetTime * 1000).toLocaleTimeString() : 
            'Unknown'
          }</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleClearMemoryCache}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear Memory Cache
        </button>
        
        <button
          onClick={handleClearPersistentCache}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear Persistent Cache
        </button>
        
        <button
          onClick={handleClearAllCache}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Cache
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            Memory cache is temporary. Persistent cache survives browser restarts.
          </span>
        </div>
      </div>
    </div>
  );
}
