# Feed Watcher UI

A modern, responsive web application for viewing and managing MDX posts from GitHub repositories or local filesystem.

## Features

- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔄 **Infinite Scroll**: Seamless pagination with automatic loading
- 💾 **Smart Caching**: Memory and persistent caching for optimal performance
- 🌐 **Dual Mode Support**: GitHub API integration + Local filesystem support
- ⚡ **Fast Loading**: Optimized with Next.js and Turbopack
- 🎨 **Modern UI**: Clean interface with Tailwind CSS
- 🔍 **Post Details**: Full post view with markdown rendering

## Modes

### Remote Mode (GitHub API)
- Loads posts from any public GitHub repository
- Configurable repository URL and posts path
- Rate limiting and caching support
- Perfect for production deployments

### Local Mode (Filesystem)
- Automatically detected when `posts/` folder exists at repository root
- Loads posts directly from local filesystem
- No API rate limits or network dependencies
- Ideal for development and local content management

## Quick Start

### 1. Installation

```bash
git clone <your-repo-url>
cd feed-watcher-ui
npm install
```

### 2. Choose Your Mode

#### Option A: Remote Mode (GitHub API)
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Configure your GitHub repository URL in the settings panel
3. Posts will be loaded from the configured GitHub repository

#### Option B: Local Mode (Filesystem)
1. Create a `posts` folder at the repository root:
   ```bash
   mkdir posts
   ```
2. Add your MDX files with the naming convention:
   ```
   YYYY-MM-DD_HH-MM-SS_filename.mdx
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Posts will be automatically loaded from the local filesystem

### 3. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## MDX File Format

Your MDX files should include frontmatter with metadata:

```mdx
---
title: "Your Post Title"
author: "Author Name"
date: "2024-12-15T10:30:00Z"
feedName: "Feed Name"
feedType: "post"
postId: "unique_post_id"
---

# Your Post Content

Write your content here using Markdown syntax.

## Features Supported

- **Bold** and *italic* text
- [Links](https://example.com)
- Lists and tables
- Code blocks
- Images
- And more!
```

## File Naming Convention

Use this naming pattern for your MDX files:
```
YYYY-MM-DD_HH-MM-SS_descriptive-filename.mdx
```

Examples:
- `2024-12-15_10-30-00_welcome-post.mdx`
- `2024-12-14_15-45-30_feature-announcement.mdx`

## Configuration

### GitHub Repository Configuration
- **Repository URL**: Full GitHub repository URL
- **Posts Path**: Path to the directory containing MDX files (default: `posts`)

### Local Development
- Place MDX files in the `posts/` folder at repository root
- The application automatically detects local mode
- No additional configuration required

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server

## Technology Stack

- **Framework**: Next.js 15.3.3
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Markdown**: React Markdown with MDX support
- **Caching**: Custom persistent cache implementation
- **TypeScript**: Full type safety

## Mode Detection

The application automatically detects which mode to use:

1. **Local Mode**: When a `posts/` folder exists at the repository root
2. **Remote Mode**: When no local posts folder is found

You can see the current mode in the header:
- 🖥️ **Local** - Loading from filesystem
- ☁️ **Remote** - Loading from GitHub API

## Development

### Project Structure

```
feed-watcher-ui/
├── posts/                    # Local posts (optional)
├── src/
│   ├── app/                  # Next.js app router
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities and services
│   │   ├── post-loader.ts    # Dual-mode post loading
│   │   ├── github-api.ts     # GitHub API integration
│   │   └── mdx-parser.ts     # MDX content parsing
│   └── types/                # TypeScript definitions
├── public/                   # Static assets
└── package.json
```

### Key Components

- **PostLoader**: Handles both local and remote post loading
- **GitHubAPI**: GitHub API integration with caching
- **Newsfeed**: Main feed component with infinite scroll
- **PostCard**: Individual post preview
- **PostDetailView**: Full post display

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both local and remote modes
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
