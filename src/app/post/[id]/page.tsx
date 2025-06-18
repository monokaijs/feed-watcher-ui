'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Post } from '@/types/post';
import { GitHubAPI } from '@/lib/github-api';
import { getConfig } from '@/lib/config';
import { parseMDXContent } from '@/lib/mdx-parser';
import { PostDetailView } from '@/components/post-detail-view';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPost = async () => {
      try {
        const config = getConfig();
        const githubAPI = new GitHubAPI(config);
        
        // Decode the post ID from URL
        const postId = Array.isArray(params.id) ? params.id[0] : params.id;
        const decodedPath = decodeURIComponent(postId);
        
        // Fetch the post content
        const content = await githubAPI.getFileContent(decodedPath);
        const fileName = decodedPath.split('/').pop() || '';
        const parsedPost = parseMDXContent(content, fileName, decodedPath);
        
        if (parsedPost) {
          setPost(parsedPost);
        } else {
          setError('Failed to parse post content');
        }
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadPost();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading post...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Post Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'The requested post could not be found.'}
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Post Details</h1>
              <p className="text-sm text-gray-600">
                {post.metadata.author} • {post.metadata.feedName}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <PostDetailView post={post} />
      </main>
    </div>
  );
}
