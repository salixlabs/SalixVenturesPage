const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Configure marked for security
marked.setOptions({
    headerIds: true,
    gfm: true,
    breaks: true,
    sanitize: false
});

// Paths
const CONTENT_DIR = path.join(__dirname, 'content');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
const OUTPUT_DIR = path.join(__dirname, 'dist');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to read and convert markdown files
function convertMarkdownFile(filePath) {
    const markdown = fs.readFileSync(filePath, 'utf-8');
    return marked.parse(markdown);
}

// Build static pages
function buildPages() {
    console.log('Building pages...');
    const pages = fs.readdirSync(PAGES_DIR);
    
    pages.forEach(page => {
        if (page.endsWith('.md')) {
            const content = convertMarkdownFile(path.join(PAGES_DIR, page));
            const htmlFileName = page.replace('.md', '.html');
            fs.writeFileSync(
                path.join(OUTPUT_DIR, htmlFileName),
                generatePage(content, page.replace('.md', ''))
            );
        }
    });
}

// Build blog posts
function buildBlog() {
    console.log('Building blog...');
    const posts = fs.readdirSync(BLOG_DIR);
    const blogPosts = [];
    
    posts.forEach(post => {
        if (post.endsWith('.md')) {
            const content = convertMarkdownFile(path.join(BLOG_DIR, post));
            const htmlFileName = post.replace('.md', '.html');
            
            // Extract metadata (you can add more metadata later)
            const title = post.replace('.md', '').replace(/-/g, ' ');
            const date = new Date(fs.statSync(path.join(BLOG_DIR, post)).birthtime);
            
            blogPosts.push({
                title,
                date: date.toISOString().split('T')[0],
                url: `/blog/${htmlFileName}`,
                summary: content.substring(0, 200) + '...' // Simple summary
            });
            
            fs.writeFileSync(
                path.join(OUTPUT_DIR, 'blog', htmlFileName),
                generatePage(content, title)
            );
        }
    });
    
    // Generate blog index
    const blogIndex = generateBlogIndex(blogPosts);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'blog', 'index.html'), blogIndex);
}

// Generate HTML page with template
function generatePage(content, title) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Salix Ventures</title>
    <link rel="stylesheet" href="/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <!-- Navigation from index.html -->
    </header>
    <main>
        <div class="container content">
            ${content}
        </div>
    </main>
    <footer>
        <!-- Footer from index.html -->
    </footer>
</body>
</html>`;
}

// Generate blog index page
function generateBlogIndex(posts) {
    const postsList = posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(post => `
            <article class="blog-post-preview">
                <h2><a href="${post.url}">${post.title}</a></h2>
                <div class="post-meta">${post.date}</div>
                <p>${post.summary}</p>
                <a href="${post.url}" class="read-more">Read more →</a>
            </article>
        `)
        .join('\n');

    return generatePage(`
        <h1>Blog</h1>
        <div class="blog-posts">
            ${postsList}
        </div>
    `, 'Blog');
}

// Main build process
async function build() {
    console.log('Starting build process...');
    
    // Create necessary directories
    fs.mkdirSync(path.join(OUTPUT_DIR, 'blog'), { recursive: true });
    fs.mkdirSync(path.join(OUTPUT_DIR, 'css'), { recursive: true });
    
    // Copy static assets
    fs.copyFileSync(
        path.join(__dirname, 'css', 'style.css'),
        path.join(OUTPUT_DIR, 'css', 'style.css')
    );
    fs.copyFileSync(
        path.join(__dirname, 'index.html'),
        path.join(OUTPUT_DIR, 'index.html')
    );
    
    // Build pages and blog
    buildPages();
    buildBlog();
    
    console.log('Build complete!');
}

// Run build
build().catch(console.error); 