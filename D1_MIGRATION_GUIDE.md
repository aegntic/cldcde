# Cloudflare D1 Migration Guide

This guide documents the migration from Neo4j to Cloudflare D1 for content storage.

## Overview

We've migrated the content storage system to use Cloudflare D1, which provides:
- SQLite-compatible database at the edge
- Built-in replication and consistency
- Seamless integration with Cloudflare Workers
- Cost-effective scaling up to 10GB

## Architecture

### Database Schema

The D1 database includes the following tables:

1. **Forums** - Discussion forum categories
   - `id`, `title`, `slug`, `description`, `category`, `created_at`, `updated_at`

2. **Posts** - Forum posts/threads
   - `id`, `forum_id`, `user_id`, `title`, `content`, `views`, `is_pinned`, `is_locked`, `created_at`, `updated_at`

3. **Comments** - Post replies
   - `id`, `post_id`, `user_id`, `content`, `is_edited`, `created_at`, `updated_at`

4. **News** - News articles and announcements
   - `id`, `title`, `slug`, `content`, `excerpt`, `author_id`, `published_at`, `is_published`, `featured_image`, `tags`, `views`

5. **Reviews** - Extension reviews and ratings
   - `id`, `extension_id`, `user_id`, `rating`, `content`, `is_verified_purchase`, `helpful_count`

### Key Features

1. **Query Builder Pattern** (`src/db/d1.ts`)
   - Type-safe query construction
   - Support for complex queries with joins
   - Transaction support
   - Batch operations

2. **CRUD APIs**
   - Forums API (`src/api/forums.ts`) - Complete forum management
   - News API (`src/api/news.ts`) - News and article management

3. **Pagination** (`src/utils/pagination.ts`)
   - Offset-based pagination
   - Cursor-based pagination support
   - Automatic pagination headers

4. **Migration System** (`scripts/run-migrations.ts`)
   - Sequential migration execution
   - Rollback support
   - Migration tracking

5. **Backup System** (`scripts/backup-d1.ts`)
   - Full and incremental backups
   - SQL and JSON export formats
   - Compression support
   - Automated cleanup

## Setup Instructions

### 1. Create D1 Database

```bash
# Create the database
wrangler d1 create cldcde-content

# Update wrangler.toml with the database ID
```

### 2. Run Migrations

```bash
# Execute migrations locally
wrangler d1 execute cldcde-content --local --file=./migrations/001_initial_schema.sql

# Execute migrations in production
wrangler d1 execute cldcde-content --file=./migrations/001_initial_schema.sql
```

### 3. Seed Database (Development)

```bash
# Run the seed script locally
wrangler d1 execute cldcde-content --local --command="SELECT 1" # Initialize local DB
bun run scripts/seed-d1.ts # Then run seed script

# Or use the worker endpoint
curl http://localhost:8787/seed
```

### 4. Deploy

```bash
# Deploy the worker with D1 bindings
wrangler deploy
```

## API Endpoints

### Forums
- `GET /api/forums` - List all forums with stats
- `GET /api/forums/:slug` - Get forum by slug
- `POST /api/forums` - Create forum (admin)
- `PUT /api/forums/:id` - Update forum (admin)
- `DELETE /api/forums/:id` - Delete forum (admin)
- `GET /api/forums/:forumId/posts` - Get posts in forum
- `POST /api/forums/:forumId/posts` - Create post
- `GET /api/forums/posts/:postId` - Get post with comments
- `POST /api/forums/posts/:postId/comments` - Add comment
- `PUT /api/forums/comments/:commentId` - Update comment
- `DELETE /api/forums/comments/:commentId` - Delete comment
- `GET /api/forums/search?q=query` - Search posts

### News
- `GET /api/news` - List published articles
- `GET /api/news/:slug` - Get article by slug
- `POST /api/news` - Create article (admin)
- `PUT /api/news/:id` - Update article (admin)
- `DELETE /api/news/:id` - Delete article (admin)
- `GET /api/news/admin/all` - List all articles (admin)
- `GET /api/news/search?q=query` - Search articles
- `GET /api/news/tags/popular` - Get popular tags
- `GET /api/news/:id/related` - Get related articles

## Query Examples

### Using the Query Builder

```typescript
// Simple query
const posts = await db.query()
  .select(['id', 'title', 'created_at'])
  .from('posts')
  .where('forum_id = ?', forumId)
  .orderBy('created_at', 'DESC')
  .limit(10)
  .all()

// Complex query with joins
const forumsWithStats = await db.query()
  .select(['f.*', 'fs.post_count', 'fs.comment_count'])
  .from('forums f')
  .leftJoin('forum_stats fs', 'f.id = fs.forum_id')
  .where('f.category = ?', 'development')
  .orderBy('fs.post_count', 'DESC')
  .all()
```

### Transactions

```typescript
await db.transaction(async (tx) => {
  // Create post
  const post = await db.insert('posts', postData, ['id'])
  
  // Update forum stats
  await db.raw(`
    UPDATE forum_stats 
    SET post_count = post_count + 1
    WHERE forum_id = ?
  `, [forumId])
  
  return post
})
```

## Backup and Recovery

### Manual Backup

```bash
# Create a backup
curl -X POST http://your-worker.workers.dev/backup

# List backups
curl http://your-worker.workers.dev/backup/list

# Clean old backups
curl -X POST http://your-worker.workers.dev/backup/cleanup
```

### Automated Backups

Set up a cron trigger in `wrangler.toml`:

```toml
[triggers]
crons = ["0 2 * * *"] # Daily at 2 AM UTC
```

## Performance Considerations

1. **Indexes** - All common query patterns have indexes
2. **Views** - Pre-computed views for complex queries
3. **Pagination** - Always use pagination for list endpoints
4. **Caching** - Consider caching frequently accessed data in KV
5. **Batch Operations** - Use batch methods for bulk inserts/updates

## Limitations

1. **Size Limits**
   - Max database size: 10GB
   - Max row size: 1MB
   - Max query result: 100MB

2. **Query Limits**
   - Max query duration: 30 seconds
   - Max concurrent queries: 10 per database

3. **SQL Features**
   - No stored procedures
   - Limited JSON functions
   - No full-text search (use tags/categories instead)

## Migration from Neo4j

To migrate existing data from Neo4j:

1. Export data from Neo4j using Cypher queries
2. Transform to match D1 schema
3. Use the batch import functionality
4. Verify data integrity
5. Update application code to use new APIs

## Troubleshooting

### Common Issues

1. **"Database not found"**
   - Ensure database ID in wrangler.toml is correct
   - Check if database exists: `wrangler d1 list`

2. **Migration failures**
   - Check SQL syntax is SQLite-compatible
   - Ensure foreign key constraints are satisfied
   - Review migration logs

3. **Performance issues**
   - Check query execution plans
   - Ensure proper indexes exist
   - Consider denormalizing hot paths

### Debug Commands

```bash
# Check database info
wrangler d1 info cldcde-content

# Execute raw SQL
wrangler d1 execute cldcde-content --command="SELECT * FROM forums"

# Check local database
wrangler d1 execute cldcde-content --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

## Future Enhancements

1. **Full-text Search**
   - Integrate with Cloudflare's upcoming D1 search features
   - Or implement custom search using trigrams

2. **Analytics**
   - Add analytics tables for tracking
   - Implement real-time dashboards

3. **Replication**
   - Set up read replicas for different regions
   - Implement eventual consistency patterns

4. **Advanced Features**
   - Add support for reactions/votes
   - Implement notification system
   - Add moderation queue