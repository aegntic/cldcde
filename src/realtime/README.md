# Supabase Realtime Integration

This module provides realtime features for cldcde.cc using Supabase's realtime capabilities.

## Setup

1. **Environment Variables**
   Add these to your `.env` file:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Database Setup**
   Run the migration file to create necessary tables and triggers:
   ```bash
   psql -d your_database -f migrations/supabase-triggers.sql
   ```

## Features

### 1. Activity Feed
Real-time activity feed showing:
- New extensions/MCPs added
- User ratings and reviews
- Downloads
- New user registrations
- Milestone achievements

### 2. Presence System
Track users currently viewing:
- Specific extensions or MCPs
- Different pages of the site
- Real-time user count

### 3. Notifications
User-specific notifications for:
- Reviews on their extensions/MCPs
- Ratings received
- Milestone achievements

## Usage

### Frontend Components

#### ActivityFeed Component
```tsx
import { ActivityFeed } from './components/ActivityFeed'

// Basic usage
<ActivityFeed />

// With options
<ActivityFeed
  maxItems={50}
  height="400px"
  showPresence={true}
  currentPage="extension-detail"
  targetId="extension-123"
  targetType="extension"
  userId="user-123"
/>
```

#### RealtimePanel Component
```tsx
import { RealtimePanel } from './components/RealtimePanel'

// Shows feed, stats, and notifications
<RealtimePanel userId={currentUser?.id} />
```

### React Hook
```tsx
import { useRealtimeFeed } from './hooks/useRealtimeFeed'

function MyComponent() {
  const {
    activities,
    presenceUsers,
    notifications,
    connectionStatus,
    unreadNotificationCount
  } = useRealtimeFeed({
    maxItems: 50,
    enablePresence: true,
    presencePage: 'home',
    userId: currentUser?.id
  })

  // Use the data...
}
```

### Backend Integration

#### Broadcasting Events
```typescript
import {
  broadcastExtensionAdded,
  broadcastRatingAdded,
  broadcastDownload,
  checkDownloadMilestone
} from './realtime/integration'

// When adding a new extension
await broadcastExtensionAdded({
  id: extension.id,
  name: extension.name,
  author: extension.author,
  authorId: extension.authorId
})

// When someone rates
await broadcastRatingAdded({
  userId: user.id,
  username: user.username,
  targetId: extension.id,
  targetName: extension.name,
  targetType: 'extension',
  rating: 5
})

// Check for milestones
checkDownloadMilestone(
  currentDownloads,
  previousDownloads,
  extension.id,
  extension.name,
  'extension'
)
```

## Architecture

### Connection Management
- Automatic reconnection with exponential backoff
- Connection state monitoring
- Maximum 100 concurrent connections per client
- Rate limiting: 10 events per second

### Data Flow
1. User action triggers API endpoint
2. Backend broadcasts event via Supabase
3. Connected clients receive event in real-time
4. Frontend updates UI automatically

### Performance Considerations
- Events are ephemeral (not stored long-term)
- Activity history kept for 7 days
- Presence data is temporary
- Use pagination for historical data

## Troubleshooting

### Connection Issues
- Check Supabase URL and API key
- Verify network connectivity
- Check browser console for errors
- Monitor connection status indicator

### Missing Events
- Ensure database triggers are created
- Verify table names match triggers
- Check Supabase dashboard for errors
- Review rate limiting settings

### Performance
- Limit concurrent subscriptions
- Use appropriate maxItems limits
- Implement virtual scrolling for large lists
- Monitor WebSocket connection count