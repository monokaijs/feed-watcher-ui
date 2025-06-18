'use client';

import { useEffect, useCallback } from 'react';
import { GitHubAPI } from '@/lib/github-api';

export function useCache(githubAPI: GitHubAPI) {
  // Clear expired cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      githubAPI.clearExpiredCache();
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(interval);
  }, [githubAPI]);

  const clearCache = useCallback(() => {
    githubAPI.clearCache();
  }, [githubAPI]);

  const getCacheInfo = useCallback(() => {
    return githubAPI.getCacheInfo();
  }, [githubAPI]);

  const preloadNextPage = useCallback((currentPage: number, pageSize: number = 10) => {
    githubAPI.preloadPosts(currentPage + 1, pageSize);
  }, [githubAPI]);

  return {
    clearCache,
    getCacheInfo,
    preloadNextPage,
  };
}
