---
description: Manage YouTube channel, upload videos, and access analytics
---

# YouTube Creator Workflow

Comprehensive YouTube channel management directly from Antigravity.

## Setup Requirements

1. **Google Cloud Project** with YouTube Data API v3 enabled
2. **OAuth2 Credentials** configured for your channel
3. **NPM Dependencies** installed in the plugin directory

## Quick Start

### Check Plugin Setup
```bash
cd /home/ae/AE/01_Laboratory/cldcde/plugins/youtube-creator
npm install
```

### Available Operations

**1. Video Upload**
- Upload videos with automated metadata
- Schedule publishing
- Set privacy levels (private/unlisted/public)

**2. Metadata Optimization**
- AI-powered title suggestions
- Smart tag generation
- SEO-optimized descriptions

**3. Analytics Dashboard**
- View performance metrics
- Track subscriber growth
- Analyze engagement rates

**4. Comment Management**
- Moderate comments in bulk
- Auto-filter spam/profanity
- Response templates

**5. Playlist Management**
- Create and organize playlists
- Batch add videos
- Automated playlist creation from uploads

## API Configuration

The plugin expects configuration at:
`/home/ae/AE/01_Laboratory/cldcde/plugins/youtube-creator/config/`

### Required Scopes
- `youtube.readonly` - Read channel information
- `youtube.upload` - Upload videos
- `yt-analytics.readonly` - Access analytics

## Example Usage

### Upload a Video
```typescript
const youtube = new YouTubeCreator();
await youtube.uploadVideo({
  videoPath: '/path/to/video.mp4',
  title: 'My Video Title',
  description: 'Video description here',
  tags: ['tag1', 'tag2'],
  privacy: 'private'
});
```

### Get Channel Analytics
```typescript
const analytics = await youtube.getAnalytics({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  metrics: ['views', 'likes', 'subscribers']
});
```

## Pro Features (youtube-creator-pro)

Upgrade to Pro for:
- AI-powered thumbnail generation
- Advanced SEO optimization
- Batch video processing
- Competitor analysis
- Automated content scheduling

---
*ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ*
