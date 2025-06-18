'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share, ExternalLink, User, Calendar, Hash } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PostLoader } from '@/lib/post-loader';
import { getConfig } from '@/lib/config';

interface PostDetailViewProps {
  post: Post;
}

export function PostDetailView({ post }: PostDetailViewProps) {
  const [fullContent, setFullContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFullContent = async () => {
      try {
        const config = getConfig();
        const postLoader = new PostLoader(config);
        const content = await postLoader.getFileContent(post.path);
        
        // Extract just the content part (after frontmatter)
        const contentMatch = content.match(/^---[\s\S]*?---\n([\s\S]*)$/);
        const markdownContent = contentMatch ? contentMatch[1] : content;
        
        setFullContent(markdownContent);
      } catch (error) {
        console.error('Error loading full content:', error);
        setFullContent('Error loading content');
      } finally {
        setLoading(false);
      }
    };

    loadFullContent();
  }, [post.path]);

  const { metadata, attachments, engagement } = post;
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        absolute: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (error) {
      return { relative: 'Unknown date', absolute: 'Unknown date' };
    }
  };

  const formatAuthor = (author: string) => {
    return author
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Anonymous';
  };

  const cleanMarkdownContent = (content: string) => {
    // Remove attachment sections and other metadata that shouldn't be rendered
    return content
      .replace(/### Attachment \d+[\s\S]*?(?=\n###|\n##|$)/g, '') // Remove attachments
      .replace(/## Attachments[\s\S]*?(?=\n##|$)/g, '') // Remove attachment sections
      .replace(/## Engagement[\s\S]*?(?=\n##|$)/g, '') // Remove engagement sections
      .replace(/\*\*Date:\*\*.*?\n/g, '') // Remove date lines
      .replace(/\*\*Feed:\*\*.*?\n/g, '') // Remove feed lines
      .replace(/\*\*Post ID:\*\*.*?\n/g, '') // Remove post ID lines
      .replace(/\*\*Author:\*\*.*?\n/g, '') // Remove author lines
      .replace(/\*\*Total Reactions:\*\*.*?\n/g, '') // Remove reaction lines
      .replace(/\*Backed up by.*?\*/g, '') // Remove backup footer
      .replace(/#[a-zA-Z0-9_]+/g, '') // Remove hashtags
      .trim();
  };

  const renderAttachment = (attachment: { type?: string; image?: string; description?: string; url?: string }, index: number) => {
    if (attachment.type === 'photo' && attachment.image) {
      return (
        <div key={index} className="mt-6">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={attachment.image}
              alt={attachment.description || 'Post attachment'}
              width={800}
              height={600}
              className="w-full h-auto object-cover"
              unoptimized
            />
          </div>
          {attachment.description && (
            <p className="text-sm text-gray-600 mt-3 italic">{attachment.description}</p>
          )}
        </div>
      );
    }
    
    if (attachment.url) {
      return (
        <div key={index} className="mt-4">
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {attachment.description || 'View attachment'}
          </a>
        </div>
      );
    }
    
    return null;
  };

  const dateInfo = formatDate(metadata.date);

  return (
    <article className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {metadata.title}
            </h1>
            
            <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="font-medium">{formatAuthor(metadata.author)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span title={dateInfo.absolute}>{dateInfo.relative}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Hash className="w-4 h-4" />
                <span>{metadata.postId.split('_').pop()?.substring(0, 8)}...</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {metadata.feedName}
              </span>
              {metadata.feedType && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {metadata.feedType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading content...</span>
            </div>
          </div>
        ) : (
          <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                    {...props}
                  >
                    {children}
                  </a>
                ),
                img: ({ src, alt, ...props }) => {
                  const imageSrc = typeof src === 'string' ? src : '';
                  // Remove width, height, and other props that might conflict with Next.js Image
                  const { width: _width, height: _height, ...safeProps } = props;
                  return (
                    <Image
                      src={imageSrc || ''}
                      alt={alt || ''}
                      width={800}
                      height={600}
                      className="rounded-lg max-w-full h-auto"
                      unoptimized
                      {...safeProps}
                    />
                  );
                },
              }}
            >
              {cleanMarkdownContent(fullContent)}
            </ReactMarkdown>
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            {attachments.map((attachment, index) => renderAttachment(attachment, index))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
              <span>{engagement.totalReactions} reactions</span>
            </button>
            
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span>Comment</span>
            </button>
            
            <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
              <Share className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            Post ID: {metadata.postId}
          </div>
        </div>
      </div>
    </article>
  );
}
