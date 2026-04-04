# Inngest Workflow Integration

This directory contains the complete Inngest integration for the CLDCDE platform, providing event-driven workflows for user management, extension processing, innovation tracking, content generation, and system monitoring.

## 🚀 Features

- **Event-Driven Architecture**: Replace cron-based polling with efficient event-driven workflows
- **Reliable Processing**: Built-in retries, error handling, and dead-letter queues
- **Real-time Monitoring**: Track workflow execution and system health
- **Scalable**: Handle high-volume events with distributed processing
- **Developer Friendly**: Easy to create, test, and deploy new workflows

## 📁 Structure

```
src/workflows/
├── index.ts                    # Main entry point and exports
├── inngest-client.ts           # Inngest client configuration
├── types.ts                    # TypeScript type definitions
├── functions/                  # Workflow function implementations
│   ├── user-workflows.ts       # User onboarding and management
│   ├── extension-workflows.ts  # Extension submission and stats
│   ├── innovation-workflows.ts # GitHub trend scanning and analysis
│   ├── content-workflows.ts    # Content generation and moderation
│   └── system-workflows.ts     # Health checks and maintenance
└── README.md                   # This documentation
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install inngest
# or
bun add inngest
```

### 2. Environment Configuration

Add these variables to your `.env` file:

```env
# Inngest Configuration
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
INNGEST_BASE_URL=http://localhost:8288  # Development
# INNGEST_BASE_URL=https://api.inngest.com  # Production
INNGEST_PORT=8288
```

### 3. Start Inngest Development Server

```bash
npm run inngest:dev
# or
bun run inngest:dev
```

This will start the Inngest dev server on port 8288 and register all your functions.

### 4. Start Your Application

```bash
npm run dev
# or
bun run dev
```

## 📊 Available Workflows

### User Workflows

- **`onboard-user`**: Triggers when a user signs up
  - Sends welcome email
  - Creates user profile
  - Initializes recommendations
  - Tracks onboarding completion

- **`update-user-recommendations`**: Triggers when user installs extension
  - Analyzes user preferences
  - Updates recommendation scores
  - Finds similar users

### Extension Workflows

- **`process-extension-submission`**: Triggers when extension is created
  - Validates metadata
  - Runs security scan
  - Quality assessment
  - Generates preview
  - Notifies moderators

- **`update-extension-stats`**: Triggers on install/uninstall
  - Updates download counts
  - Calculates popularity scores
  - Updates author statistics
  - Performs trend analysis

### Innovation Workflows

- **`scan-github-trends`**: Runs every 30 minutes
  - Fetches trending repositories
  - Analyzes relevance to CLDCDE
  - Sends events for new discoveries

- **`update-innovation-scores`**: Runs daily and on new repository discovery
  - Calculates innovation scores
  - Updates database records
  - Detects emerging trends

### Content Workflows

- **`generate-weekly-digest`**: Runs weekly on Mondays
  - Gathers content from past week
  - Generates digest content
  - Sends to subscribers
  - Publishes to website

- **`moderate-content`**: Triggers when content is published
  - Runs automated content checks
  - Auto-approves or flags for review
  - Notifies moderators if needed

### System Workflows

- **`system-health-check`**: Runs every 5 minutes
  - Checks database connectivity
  - Monitors cache systems
  - Tests search service
  - Validates API response times
  - Checks background workers

- **`cleanup-expired-data`**: Runs daily at 3 AM
  - Cleans up expired sessions
  - Clears old cache entries
  - Archives old logs
  - Removes temporary files
  - Optimizes database

## 🎯 Event Types

### User Events
- `user/signed-up`
- `user/profile-updated`
- `user/installed-extension`
- `user/uninstalled-extension`

### Extension Events
- `extension/created`
- `extension/updated`
- `extension/approved`
- `extension/featured`

### Content Events
- `content/generated`
- `content/published`
- `content/flagged`

### System Events
- `system/alert`
- `system/performance-degraded`
- `system/error-reported`

### Innovation Events
- `innovation/trend-detected`
- `innovation/new-repository-found`

## 🔄 Sending Events

### From Your Application Code

```typescript
import { sendEvent, EventNames } from '../src/workflows'

// Send user signup event
await sendEvent(EventNames.USER_SIGNED_UP, {
  userId: 'user-123',
  email: 'user@example.com'
})

// Send extension created event
await sendEvent(EventNames.Extension_CREATED, {
  extensionId: 'ext-456',
  name: 'Awesome Extension',
  authorId: 'user-123',
  category: 'development'
})
```

### Via API Endpoints

```bash
# User signup event
curl -X POST http://localhost:3000/api/events/user-signup \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "email": "user@example.com"}'

# Extension created event
curl -X POST http://localhost:3000/api/events/extension-created \
  -H "Content-Type: application/json" \
  -d '{
    "extensionId": "ext-456",
    "name": "Awesome Extension",
    "authorId": "user-123",
    "category": "development"
  }'
```

### Via Webhooks

Send events to the webhook endpoint:

```bash
curl -X POST http://localhost:3000/api/inngest/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user/installed-extension",
    "data": {
      "userId": "user-123",
      "extensionId": "ext-456"
    }
  }'
```

## 📈 Monitoring

### Web Dashboard

Access the Inngest dashboard at `http://localhost:8288` during development to:
- View running functions
- Monitor event history
- Debug failed executions
- Check system health

### API Health Check

```bash
curl http://localhost:3000/api/inngest/health
```

### Function List

```bash
curl http://localhost:3000/api/inngest
```

## 🚢 Deployment

### Production Deployment

1. **Set Production Environment**:
   ```env
   INNGEST_BASE_URL=https://api.inngest.com
   NODE_ENV=production
   ```

2. **Deploy Functions**:
   ```bash
   npm run inngest:deploy
   # or
   bun run inngest:deploy
   ```

3. **Verify Deployment**:
   - Check Inngest dashboard
   - Test event sending
   - Monitor function execution

### Environment-Specific Configuration

- **Development**: Local Inngest dev server
- **Staging**: Inngest staging environment
- **Production**: Inngest cloud platform

## 🔧 Customization

### Adding New Workflows

1. Create a new file in `src/workflows/functions/`
2. Import and define your function:

```typescript
import { inngest, EventNames, FunctionNames } from '../inngest-client'

export const myCustomWorkflow = inngest.createFunction(
  {
    id: FunctionNames.MY_CUSTOM_WORKFLOW,
    name: 'My Custom Workflow',
    retries: 3,
  },
  { event: 'custom/event-triggered' },
  async ({ event, step }) => {
    // Your workflow logic here
    await step.run('process-data', async () => {
      // Process the event data
      return { processed: true }
    })

    return { success: true }
  }
)
```

3. Export the function in `src/workflows/index.ts`

### Modifying Existing Workflows

- Update retry strategies
- Add new steps
- Change event triggers
- Modify retry behavior

## 🐛 Troubleshooting

### Common Issues

1. **Functions not registering**: Check Inngest dev server is running
2. **Events not being processed**: Verify event names and payloads
3. **Retries failing**: Check step error handling and logs
4. **Performance issues**: Monitor function execution times

### Debugging

- Enable verbose logging in development
- Use Inngest dashboard for execution traces
- Check API health endpoints
- Monitor system resources

## 📚 Additional Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest TypeScript Guide](https://www.inngest.com/docs/reference/typescript)
- [Event-Driven Architecture Best Practices](https://www.inngest.com/docs/guides/event-driven-architecture)

## 🤝 Contributing

1. Follow the existing code patterns
2. Add proper TypeScript types
3. Include error handling and retries
4. Update documentation
5. Test workflows thoroughly

## 📄 License

This integration follows the same MIT license as the main CLDCDE platform.