'use client';

import { useEffect, useCallback } from 'react';
import { PostLoader } from '@/lib/post-loader';

export function useCache(postLoader: PostLoader) {
  // Clear expired cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      postLoader.clearExpiredCache();
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(interval);
  }, [postLoader]);

  const clearCache = useCallback(() => {
    postLoader.clearCache();
  }, [postLoader]);

  const getCacheInfo = useCallback(() => {
    return postLoader.getCacheInfo();
  }, [postLoader]);

  const preloadNextPage = useCallback((currentPage: number, pageSize: number = 10) => {
    postLoader.preloadPosts(currentPage + 1, pageSize);
  }, [postLoader]);

  return {
    clearCache,
    getCacheInfo,
    preloadNextPage,
  };
}
