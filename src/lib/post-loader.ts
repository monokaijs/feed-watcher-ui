import { Post, FeedConfig } from '@/types/post';
import { parseMDXContent, extractDateFromFileName } from './mdx-parser';
import { GitHubAPI } from './github-api';
// Dynamic imports for Node.js modules to avoid bundling in client-side code
let fs: any = null;
let path: any = null;

// Only import these modules on the server side
if (typeof window === 'undefined') {
  try {
    fs = require('fs');
    path = require('path');
  } catch (error) {
    console.warn('Failed to import Node.js modules:', error);
  }
}

export class PostLoader {
  private config: FeedConfig;
  private githubAPI: GitHubAPI;
  private isLocalMode: boolean = false;
  private localPostsPath: string = '';

  constructor(config: FeedConfig) {
    this.config = config;
    this.githubAPI = new GitHubAPI(config);
    this.checkLocalMode();
  }

  updateConfig(config: FeedConfig) {
    this.config = config;
    this.githubAPI.updateConfig(config);
    this.checkLocalMode();
  }

  private checkLocalMode() {
    // Check if we're running in a Node.js environment (server-side)
    if (typeof window === 'undefined' && fs && path) {
      try {
        // Check if posts folder exists at repository root
        const postsPath = path.join(process.cwd(), 'posts');
        this.isLocalMode = fs.existsSync(postsPath) && fs.statSync(postsPath).isDirectory();
        this.localPostsPath = postsPath;

        if (this.isLocalMode) {
          console.log('Local mode detected: Loading posts from local filesystem');
        } else {
          console.log('Remote mode: Loading posts from GitHub API');
        }
      } catch (error) {
        console.log('Error checking local mode, falling back to GitHub API:', error);
        this.isLocalMode = false;
      }
    } else {
      // Client-side always uses GitHub API
      this.isLocalMode = false;
    }
  }

  async getPosts(page: number = 1, pageSize: number = 10): Promise<{ posts: Post[]; hasMore: boolean }> {
    if (this.isLocalMode) {
      return this.getLocalPosts(page, pageSize);
    } else {
      return this.githubAPI.getPosts(page, pageSize);
    }
  }

  async getFileContent(filePath: string): Promise<string> {
    if (this.isLocalMode) {
      return this.getLocalFileContent(filePath);
    } else {
      return this.githubAPI.getFileContent(filePath);
    }
  }

  private async getLocalPosts(page: number = 1, pageSize: number = 10): Promise<{ posts: Post[]; hasMore: boolean }> {
    if (!fs || !path) {
      throw new Error('File system modules not available');
    }

    try {
      // Read all MDX files from the posts directory
      const files = fs.readdirSync(this.localPostsPath)
        .filter((file: string) => file.endsWith('.mdx'))
        .map((file: string) => ({
          name: file,
          path: path.join('posts', file),
          fullPath: path.join(this.localPostsPath, file)
        }))
        .sort((a: { name: string; path: string; fullPath: string }, b: { name: string; path: string; fullPath: string }) => {
          // Sort by date (newest first)
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
      const paginatedFiles = files.slice(startIndex, endIndex);
      const hasMore = endIndex < files.length;

      // Read and parse posts
      const posts: Post[] = [];
      
      for (const file of paginatedFiles) {
        try {
          const content = fs.readFileSync(file.fullPath, 'utf-8');
          const post = parseMDXContent(content, file.name, file.path);
          if (post) {
            posts.push(post);
          }
        } catch (error) {
          console.error(`Error processing local file ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      return { posts, hasMore };
    } catch (error) {
      console.error('Error reading local posts:', error);
      throw new Error(`Error reading local posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getLocalFileContent(filePath: string): Promise<string> {
    if (!fs || !path) {
      throw new Error('File system modules not available');
    }

    try {
      // Handle both absolute and relative paths
      let fullPath: string;
      if (path.isAbsolute(filePath)) {
        fullPath = filePath;
      } else {
        // Remove 'posts/' prefix if present since we're already in the posts directory
        const relativePath = filePath.startsWith('posts/') ? filePath.substring(6) : filePath;
        fullPath = path.join(this.localPostsPath, relativePath);
      }

      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      console.error('Error reading local file:', error);
      throw new Error(`Error reading local file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateRepository(): Promise<boolean> {
    if (this.isLocalMode) {
      return this.validateLocalRepository();
    } else {
      return this.githubAPI.validateRepository();
    }
  }

  private async validateLocalRepository(): Promise<boolean> {
    if (!fs) {
      return false;
    }

    try {
      // Check if posts directory exists and has MDX files
      if (!fs.existsSync(this.localPostsPath)) {
        return false;
      }

      const files = fs.readdirSync(this.localPostsPath);
      const mdxFiles = files.filter((file: string) => file.endsWith('.mdx'));

      return mdxFiles.length > 0;
    } catch (error) {
      console.error('Error validating local repository:', error);
      return false;
    }
  }

  // Delegate other methods to GitHub API
  getRateLimitInfo() {
    return this.githubAPI.getRateLimitInfo();
  }

  getCacheInfo() {
    return this.githubAPI.getCacheInfo();
  }

  clearCache() {
    return this.githubAPI.clearCache();
  }

  clearExpiredCache() {
    return this.githubAPI.clearExpiredCache();
  }

  preloadPosts(page: number = 1, pageSize: number = 10) {
    if (this.isLocalMode) {
      // For local mode, preloading is not necessary as file access is fast
      return Promise.resolve();
    } else {
      return this.githubAPI.preloadPosts(page, pageSize);
    }
  }

  getMode(): 'local' | 'remote' {
    return this.isLocalMode ? 'local' : 'remote';
  }
}
