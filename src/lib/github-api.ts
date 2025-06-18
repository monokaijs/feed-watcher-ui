import { GitHubContentsResponse, Post, FeedConfig } from '@/types/post';
import { parseMDXContent, extractDateFromFileName } from './mdx-parser';
import { persistentCache } from './persistent-cache';

const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
  etag?: string;
}

export class GitHubAPI {
  private config: FeedConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimitRemaining: number = 60;
  private rateLimitReset: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for file content

  constructor(config: FeedConfig) {
    this.config = config;
  }

  updateConfig(config: FeedConfig) {
    this.config = config;
    this.cache.clear(); // Clear cache when config changes
  }

  private async makeRequest<T>(endpoint: string, cacheDuration?: number): Promise<T> {
    const url = `${GITHUB_API_BASE}${endpoint}`;
    const duration = cacheDuration || this.CACHE_DURATION;
    const cacheKey = `api:${endpoint}`;

    // Check memory cache first
    if (this.cache.has(url)) {
      const cached = this.cache.get(url)!;
      if (Date.now() - cached.timestamp < duration) {
        console.log(`Memory cache hit for: ${endpoint}`);
        return cached.data;
      }
    }

    // Check persistent cache
    const persistentEntry = persistentCache.get(cacheKey);
    if (persistentEntry && Date.now() - persistentEntry.timestamp < duration) {
      console.log(`Persistent cache hit for: ${endpoint}`);
      // Also update memory cache
      this.cache.set(url, persistentEntry);
      return persistentEntry.data;
    }

    // Check rate limit
    if (this.rateLimitRemaining <= 1 && Date.now() < this.rateLimitReset * 1000) {
      throw new GitHubAPIError('Rate limit exceeded. Please try again later.');
    }

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FeedWatcher-UI/1.0',
      };

      // Add ETag for conditional requests if we have cached data
      const cachedEntry = this.cache.get(url) || persistentEntry;
      if (cachedEntry?.etag) {
        headers['If-None-Match'] = cachedEntry.etag;
      }

      const response = await fetch(url, { headers });

      // Update rate limit info
      this.rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '60');
      this.rateLimitReset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');

      // Handle 304 Not Modified - return cached data
      if (response.status === 304 && cachedEntry) {
        console.log(`304 Not Modified for: ${endpoint}`);
        // Update timestamp to extend cache
        cachedEntry.timestamp = Date.now();
        return cachedEntry.data;
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new GitHubAPIError('Repository or path not found', 404);
        } else if (response.status === 403) {
          throw new GitHubAPIError('Access forbidden or rate limit exceeded', 403);
        } else {
          throw new GitHubAPIError(`GitHub API error: ${response.statusText}`, response.status);
        }
      }

      const data = await response.json();
      const etag = response.headers.get('ETag');

      const cacheEntry = {
        data,
        timestamp: Date.now(),
        etag: etag || undefined,
      };

      // Cache in both memory and persistent storage
      this.cache.set(url, cacheEntry);
      persistentCache.set(cacheKey, data, duration, etag || undefined);

      console.log(`Fresh data cached for: ${endpoint}`);
      return data;
    } catch (error) {
      if (error instanceof GitHubAPIError) {
        throw error;
      }
      throw new GitHubAPIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRepositoryContents(path: string = ''): Promise<GitHubContentsResponse[]> {
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    return this.makeRequest<GitHubContentsResponse[]>(endpoint, this.CACHE_DURATION);
  }

  async getFileContent(path: string): Promise<string> {
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    const response = await this.makeRequest<GitHubContentsResponse>(endpoint, this.LONG_CACHE_DURATION);

    if (response.content && response.encoding === 'base64') {
      try {
        // Decode base64 content with proper UTF-8 handling
        const base64Content = response.content.replace(/\s/g, '');
        const binaryString = atob(base64Content);

        // Convert binary string to UTF-8
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        return new TextDecoder('utf-8').decode(bytes);
      } catch (error) {
        console.error('Error decoding file content:', error);
        // Fallback to simple atob if UTF-8 decoding fails
        return atob(response.content.replace(/\s/g, ''));
      }
    }

    throw new GitHubAPIError('Unable to decode file content');
  }

  async getPosts(page: number = 1, pageSize: number = 10): Promise<{ posts: Post[]; hasMore: boolean }> {
    try {
      const files = await this.getRepositoryContents(this.config.postsPath);
      
      // Filter for MDX files and sort by date (newest first)
      const mdxFiles = files
        .filter(file => file.type === 'file' && file.name.endsWith('.mdx'))
        .sort((a, b) => {
          const dateA = extractDateFromFileName(a.name);
          const dateB = extractDateFromFileName(b.name);
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          return b.name.localeCompare(a.name);
        });

      // Calculate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedFiles = mdxFiles.slice(startIndex, endIndex);
      const hasMore = endIndex < mdxFiles.length;

      // Fetch and parse posts
      const posts: Post[] = [];
      
      for (const file of paginatedFiles) {
        try {
          const content = await this.getFileContent(file.path);
          const post = parseMDXContent(content, file.name, file.path);
          if (post) {
            posts.push(post);
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      return { posts, hasMore };
    } catch (error) {
      if (error instanceof GitHubAPIError) {
        throw error;
      }
      throw new GitHubAPIError(`Error fetching posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateRepository(): Promise<boolean> {
    try {
      await this.getRepositoryContents();
      return true;
    } catch (error) {
      return false;
    }
  }

  getRateLimitInfo(): { remaining: number; resetTime: number } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset,
    };
  }

  getCacheInfo(): { size: number; entries: Array<{ url: string; age: number; hasEtag: boolean }> } {
    const entries = Array.from(this.cache.entries()).map(([url, entry]) => ({
      url,
      age: Date.now() - entry.timestamp,
      hasEtag: !!entry.etag,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  clearExpiredCache(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [url, entry] of this.cache.entries()) {
      // Clear entries older than 1 hour
      if (now - entry.timestamp > 60 * 60 * 1000) {
        this.cache.delete(url);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired cache entries`);
    }

    return cleared;
  }

  preloadPosts(page: number = 1, pageSize: number = 10): Promise<void> {
    // Preload next page in background
    return this.getPosts(page, pageSize).then(() => {
      console.log(`Preloaded page ${page}`);
    }).catch(error => {
      console.warn(`Failed to preload page ${page}:`, error);
    });
  }
}
