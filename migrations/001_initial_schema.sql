-- Initial schema for Claude Extensions Website
-- Cloudflare D1 (SQLite compatible)

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Forums table
CREATE TABLE IF NOT EXISTS forums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for slug lookups
CREATE INDEX idx_forums_slug ON forums(slug);
CREATE INDEX idx_forums_category ON forums(category);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    forum_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT 0,
    is_locked BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_posts_forum_id ON posts(forum_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_pinned_created ON posts(is_pinned DESC, created_at DESC);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Create indexes for comment queries
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- News table
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id TEXT NOT NULL,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT 1,
    featured_image TEXT,
    tags TEXT, -- JSON array stored as text
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for news queries
CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_news_published_at ON news(published_at DESC);
CREATE INDEX idx_news_author_id ON news(author_id);
CREATE INDEX idx_news_is_published ON news(is_published, published_at DESC);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    extension_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    is_verified_purchase BOOLEAN DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(extension_id, user_id)
);

-- Create indexes for review queries
CREATE INDEX idx_reviews_extension_id ON reviews(extension_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Review helpfulness tracking
CREATE TABLE IF NOT EXISTS review_helpfulness (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    UNIQUE(review_id, user_id)
);

-- Create trigger to update updated_at timestamps
CREATE TRIGGER update_forums_timestamp 
AFTER UPDATE ON forums
BEGIN
    UPDATE forums SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_posts_timestamp 
AFTER UPDATE ON posts
BEGIN
    UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_comments_timestamp 
AFTER UPDATE ON comments
BEGIN
    UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_news_timestamp 
AFTER UPDATE ON news
BEGIN
    UPDATE news SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_reviews_timestamp 
AFTER UPDATE ON reviews
BEGIN
    UPDATE reviews SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Aggregate tables for performance
CREATE TABLE IF NOT EXISTS forum_stats (
    forum_id INTEGER PRIMARY KEY,
    post_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    last_post_at DATETIME,
    FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS extension_stats (
    extension_id TEXT PRIMARY KEY,
    review_count INTEGER DEFAULT 0,
    average_rating REAL DEFAULT 0,
    total_rating INTEGER DEFAULT 0
);

-- Create views for common queries
CREATE VIEW IF NOT EXISTS v_posts_with_stats AS
SELECT 
    p.*,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
    (SELECT MAX(created_at) FROM comments WHERE post_id = p.id) as last_comment_at
FROM posts p;

CREATE VIEW IF NOT EXISTS v_forums_with_stats AS
SELECT 
    f.*,
    COALESCE(fs.post_count, 0) as post_count,
    COALESCE(fs.comment_count, 0) as comment_count,
    fs.last_post_at
FROM forums f
LEFT JOIN forum_stats fs ON f.id = fs.forum_id;