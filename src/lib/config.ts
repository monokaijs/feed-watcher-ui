import { FeedConfig } from '@/types/post';

const CONFIG_KEY = 'feed-watcher-config';

export const defaultConfig: FeedConfig = {
  repositoryUrl: 'https://github.com/monokaijs/j2team-backup',
  owner: 'monokaijs',
  repo: 'j2team-backup',
  postsPath: 'posts/j2team-community-backup',
};

export function parseRepositoryUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Handle both github.com URLs and API URLs
    const githubUrlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(githubUrlPattern);
    
    if (match) {
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, ''); // Remove .git suffix if present
      return { owner, repo };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing repository URL:', error);
    return null;
  }
}

export function validateRepositoryUrl(url: string): boolean {
  const parsed = parseRepositoryUrl(url);
  return parsed !== null;
}

export function getConfig(): FeedConfig {
  if (typeof window === 'undefined') {
    return defaultConfig;
  }
  
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const config = JSON.parse(stored) as FeedConfig;
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.error('Error loading config from localStorage:', error);
  }
  
  return defaultConfig;
}

export function saveConfig(config: Partial<FeedConfig>): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const currentConfig = getConfig();
    const newConfig = { ...currentConfig, ...config };
    
    // Parse repository URL to update owner/repo
    if (config.repositoryUrl) {
      const parsed = parseRepositoryUrl(config.repositoryUrl);
      if (parsed) {
        newConfig.owner = parsed.owner;
        newConfig.repo = parsed.repo;
      }
    }
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
  }
}

export function resetConfig(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch (error) {
    console.error('Error resetting config:', error);
  }
}
