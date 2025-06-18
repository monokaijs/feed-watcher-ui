import matter from 'gray-matter';
import { Post, PostMetadata, PostAttachment } from '@/types/post';

// Utility function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    // Vietnamese specific entities
    '&aacute;': 'á',
    '&agrave;': 'à',
    '&atilde;': 'ã',
    '&acirc;': 'â',
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&etilde;': 'ẽ',
    '&ecirc;': 'ê',
    '&iacute;': 'í',
    '&igrave;': 'ì',
    '&itilde;': 'ĩ',
    '&oacute;': 'ó',
    '&ograve;': 'ò',
    '&otilde;': 'õ',
    '&ocirc;': 'ô',
    '&uacute;': 'ú',
    '&ugrave;': 'ù',
    '&utilde;': 'ũ',
    '&yacute;': 'ý',
    '&ygrave;': 'ỳ',
    '&ytilde;': 'ỹ',
  };

  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
}

export function parseMDXContent(content: string, fileName: string, path: string): Post | null {
  try {
    // Decode HTML entities in the content first
    const decodedContent = decodeHtmlEntities(content);
    const { data, content: markdownContent } = matter(decodedContent);
    
    // Validate required metadata fields
    const requiredFields = ['title', 'author', 'date', 'feedName', 'postId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.warn(`Missing required field '${field}' in ${fileName}`);
        return null;
      }
    }
    
    const metadata: PostMetadata = {
      title: decodeHtmlEntities(data.title || 'Untitled Post'),
      author: decodeHtmlEntities(data.author || 'Unknown Author'),
      authorId: data.authorId || '0',
      date: data.date || new Date().toISOString(),
      feedName: decodeHtmlEntities(data.feedName || 'Unknown Feed'),
      feedType: data.feedType || 'unknown',
      postId: data.postId || fileName,
      reactions: data.reactions || 0,
    };
    
    // Parse attachments from content
    const attachments = parseAttachments(markdownContent);
    
    // Extract content preview (first 200 characters of non-attachment content)
    const contentPreview = extractContentPreview(markdownContent);
    
    const post: Post = {
      metadata,
      content: contentPreview,
      attachments,
      engagement: {
        totalReactions: metadata.reactions,
      },
      fileName,
      path,
    };
    
    return post;
  } catch (error) {
    console.error(`Error parsing MDX content for ${fileName}:`, error);
    return null;
  }
}

function parseAttachments(content: string): PostAttachment[] {
  const attachments: PostAttachment[] = [];
  
  // Parse attachment sections
  const attachmentSectionRegex = /### Attachment \d+\n([\s\S]*?)(?=\n###|\n##|$)/g;
  let match;
  
  while ((match = attachmentSectionRegex.exec(content)) !== null) {
    const attachmentContent = match[1];
    const attachment = parseAttachmentSection(attachmentContent);
    if (attachment) {
      attachments.push(attachment);
    }
  }
  
  return attachments;
}

function parseAttachmentSection(content: string): PostAttachment | null {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    const attachment: Partial<PostAttachment> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('- **Type:**')) {
        const type = trimmedLine.replace('- **Type:**', '').trim();
        if (type === 'photo' || type === 'video' || type === 'link') {
          attachment.type = type;
        }
      } else if (trimmedLine.startsWith('- **Description:**')) {
        attachment.description = trimmedLine.replace('- **Description:**', '').trim();
      } else if (trimmedLine.startsWith('- **URL:**')) {
        attachment.url = trimmedLine.replace('- **URL:**', '').trim();
      } else if (trimmedLine.startsWith('- **Image:**')) {
        attachment.image = trimmedLine.replace('- **Image:**', '').trim();
      }
    }
    
    if (attachment.type) {
      return attachment as PostAttachment;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing attachment section:', error);
    return null;
  }
}

function extractContentPreview(content: string): string {
  try {
    // Decode HTML entities first
    const decodedContent = decodeHtmlEntities(content);

    // Remove frontmatter, attachment sections, and metadata
    let cleanContent = decodedContent
      .replace(/^---[\s\S]*?---/, '') // Remove frontmatter
      .replace(/### Attachment \d+[\s\S]*?(?=\n###|\n##|$)/g, '') // Remove attachments
      .replace(/## Attachments[\s\S]*?(?=\n##|$)/g, '') // Remove attachment sections
      .replace(/## Engagement[\s\S]*?(?=\n##|$)/g, '') // Remove engagement sections
      .replace(/\*\*Date:\*\*.*?\n/g, '') // Remove date lines
      .replace(/\*\*Feed:\*\*.*?\n/g, '') // Remove feed lines
      .replace(/\*\*Post ID:\*\*.*?\n/g, '') // Remove post ID lines
      .replace(/\*\*Author:\*\*.*?\n/g, '') // Remove author lines
      .replace(/\*\*Total Reactions:\*\*.*?\n/g, '') // Remove reaction lines
      .replace(/#+ [^\n]*\n/g, '') // Remove headers
      .replace(/\*Backed up by.*?\*/g, '') // Remove backup footer
      .replace(/#[a-zA-Z0-9_]+/g, '') // Remove hashtags
      .trim();

    // Extract first meaningful paragraph
    const paragraphs = cleanContent.split('\n\n').filter(p => p.trim().length > 0);
    const firstParagraph = paragraphs[0] || cleanContent;

    // Limit to 200 characters, but be careful with Unicode characters
    if (firstParagraph.length > 200) {
      // Use Array.from to properly handle Unicode characters
      const chars = Array.from(firstParagraph);
      if (chars.length > 200) {
        return chars.slice(0, 200).join('') + '...';
      }
    }

    return firstParagraph || 'No content preview available.';
  } catch (error) {
    console.error('Error extracting content preview:', error);
    return 'Error extracting content preview.';
  }
}

export function extractDateFromFileName(fileName: string): Date | null {
  try {
    // Extract date from filename pattern: YYYY-MM-DD_HH-MM-SS_...
    const dateMatch = fileName.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [, year, month, day, hour, minute, second] = dateMatch;
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    }
    return null;
  } catch (error) {
    console.error('Error extracting date from filename:', error);
    return null;
  }
}
