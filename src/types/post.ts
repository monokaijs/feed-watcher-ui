export interface PostMetadata {
  title: string;
  author: string;
  authorId: string;
  date: string;
  feedName: string;
  feedType: string;
  postId: string;
  reactions: number;
}

export interface PostAttachment {
  type: 'photo' | 'video' | 'link';
  description?: string;
  url?: string;
  image?: string;
}

export interface Post {
  metadata: PostMetadata;
  content: string;
  attachments: PostAttachment[];
  engagement: {
    totalReactions: number;
  };
  fileName: string;
  path: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content?: string;
  encoding?: string;
}

export interface GitHubContentsResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface FeedConfig {
  repositoryUrl: string;
  owner: string;
  repo: string;
  postsPath: string;
}

export interface PaginationInfo {
  page: number;
  hasMore: boolean;
  loading: boolean;
}
