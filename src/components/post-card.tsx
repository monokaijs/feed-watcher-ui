'use client';

import { Post } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share, ExternalLink, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { metadata, content, attachments, engagement } = post;
  const router = useRouter();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const formatAuthor = (author: string) => {
    return author
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Anonymous';
  };

  const handlePostClick = () => {
    // Encode the post path for URL
    const encodedPath = encodeURIComponent(post.path);
    router.push(`/post/${encodedPath}`);
  };

  const renderAttachment = (attachment: { type?: string; image?: string; description?: string; url?: string }, index: number) => {
    if (attachment.type === 'photo' && attachment.image) {
      return (
        <div key={index} className="mt-3">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={attachment.image}
              alt={attachment.description || 'Post attachment'}
              width={500}
              height={300}
              className="w-full h-auto object-cover"
              unoptimized // Since we're loading from external URLs
            />
          </div>
          {attachment.description && (
            <p className="text-sm text-gray-600 mt-2">{attachment.description}</p>
          )}
        </div>
      );
    }

    if (attachment.url) {
      return (
        <div key={index} className="mt-3">
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            {attachment.description || 'View attachment'}
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">
                {formatAuthor(metadata.author)}
              </h3>
              <span className="text-gray-500">•</span>
              <button
                onClick={handlePostClick}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                title="View post details"
              >
                <time dateTime={metadata.date}>
                  {formatDate(metadata.date)}
                </time>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {metadata.feedName}
              </span>
              {metadata.feedType && (
                <span className="text-xs text-gray-500">
                  {metadata.feedType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {metadata.title && metadata.title !== `Post from ${metadata.author}` && (
          <button
            onClick={handlePostClick}
            className="text-left w-full hover:text-blue-600 transition-colors"
            title="View post details"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {metadata.title}
            </h2>
          </button>
        )}

        <button
          onClick={handlePostClick}
          className="text-left w-full text-gray-700 leading-relaxed hover:text-gray-900 transition-colors"
          title="View post details"
        >
          <p>{content}</p>
        </button>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-4">
            {attachments.map((attachment, index) => renderAttachment(attachment, index))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{engagement.totalReactions}</span>
            </button>

            <button
              onClick={handlePostClick}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
              title="View post details"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Comment</span>
            </button>

            <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
              <Share className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>

          <div className="text-xs text-gray-400">
            ID: {metadata.postId.split('_').pop()?.substring(0, 8)}...
          </div>
        </div>
      </div>
    </article>
  );
}
