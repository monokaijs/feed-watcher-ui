'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Post, FeedConfig, PaginationInfo } from '@/types/post';
import { PostLoader } from '@/lib/post-loader';
import { GitHubAPIError } from '@/lib/github-api';
import { getConfig } from '@/lib/config';
import { useCache } from '@/hooks/use-cache';
import { PostCard } from './post-card';
import { ConfigPanel } from './config-panel';
import { CacheStatus } from './cache-status';
import { Loader2, AlertCircle, RefreshCw, Rss, Database, HardDrive, Cloud } from 'lucide-react';

export function Newsfeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [config, setConfig] = useState<FeedConfig>(getConfig());
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    hasMore: true,
    loading: false,
  });
  const [error, setError] = useState<string>('');
  const [postLoader, setPostLoader] = useState<PostLoader>(new PostLoader(config));
  const { clearCache, preloadNextPage } = useCache(postLoader);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Initialize and load first page
  useEffect(() => {
    loadPosts(1, true);
  }, []);

  // Load more posts when scrolling to bottom
  useEffect(() => {
    if (inView && pagination.hasMore && !pagination.loading) {
      loadPosts(pagination.page + 1, false);
    }
  }, [inView, pagination.hasMore, pagination.loading, pagination.page]);

  const loadPosts = useCallback(async (page: number, reset: boolean = false) => {
    setPagination(prev => ({ ...prev, loading: true }));
    setError('');

    try {
      const { posts: newPosts, hasMore } = await postLoader.getPosts(page, 10);

      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setPagination({
        page,
        hasMore,
        loading: false,
      });

      // Preload next page if there are more posts
      if (hasMore && newPosts.length > 0) {
        preloadNextPage(page);
      }
    } catch (err) {
      console.log('err', err);
      const errorMessage = err instanceof GitHubAPIError || err instanceof Error
        ? err.message
        : 'An unexpected error occurred while loading posts';

      setError(errorMessage);
      setPagination(prev => ({ ...prev, loading: false }));
    }
  }, [postLoader]);

  const handleConfigChange = useCallback((newConfig: FeedConfig) => {
    setConfig(newConfig);
    const newPostLoader = new PostLoader(newConfig);
    setPostLoader(newPostLoader);

    // Reset and reload posts with new config
    setPosts([]);
    setPagination({ page: 1, hasMore: true, loading: false });
    loadPosts(1, true);
  }, []);

  const handleRefresh = useCallback(() => {
    setPosts([]);
    setPagination({ page: 1, hasMore: true, loading: false });
    loadPosts(1, true);
  }, [loadPosts]);

  const handleClearCache = useCallback(() => {
    clearCache();
    handleRefresh();
  }, [clearCache, handleRefresh]);

  const renderError = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">
              Error Loading Posts
            </h3>
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading posts...</span>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center py-12">
        <Rss className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
        <p className="text-gray-600 mb-4">
          No posts were found in the configured repository. Check your repository configuration or try refreshing.
        </p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Configuration Panel */}
      <ConfigPanel onConfigChange={handleConfigChange} />

      {/* Cache Status */}
      <CacheStatus githubAPI={postLoader} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rss className="w-6 h-6 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">Feed Watcher</h1>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {postLoader.getMode() === 'local' ? (
                      <>
                        <HardDrive className="w-3 h-3" />
                        Local
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3 h-3" />
                        Remote
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {postLoader.getMode() === 'local' ? 'Loading from local filesystem' : `${config.owner}/${config.repo}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearCache}
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800"
                title="Clear cache and refresh"
              >
                <Database className="w-4 h-4" />
                Clear Cache
              </button>

              <button
                onClick={handleRefresh}
                disabled={pagination.loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh posts"
              >
                <RefreshCw className={`w-4 h-4 ${pagination.loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && renderError()}

        {!error && posts.length === 0 && !pagination.loading && renderEmptyState()}

        {!error && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <PostCard key={`${post.path}-${index}`} post={post} />
            ))}
          </div>
        )}

        {/* Loading indicator for initial load */}
        {pagination.loading && posts.length === 0 && renderLoadingSpinner()}

        {/* Infinite scroll trigger */}
        {pagination.hasMore && posts.length > 0 && (
          <div ref={loadMoreRef} className="py-8">
            {pagination.loading && renderLoadingSpinner()}
          </div>
        )}

        {/* End of feed indicator */}
        {!pagination.hasMore && posts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              You&apos;ve reached the end of the feed
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
