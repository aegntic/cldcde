---
name: openrouter-switcher
type: configuration
color: "#FF9800"
description: Dynamic OpenRouter model switching for Claude-Flow agents
capabilities:
  - model_switching
  - cost_optimization
  - performance_tuning
  - fallback_management
  - real_time_pricing
priority: high
triggers:
  keywords:
    - "switch to openrouter"
    - "use openrouter"
    - "openrouter model"
    - "change model"
  task_patterns:
    - "use * for *"
    - "switch * to *"
    - "optimize for *"
---

# OpenRouter Model Switcher

Dynamically switches Claude-Flow agents to any OpenRouter model with real-time cost optimization and performance tuning.

## Available OpenRouter Models

### Premium Models (High Performance)
- **claude-3.5-sonnet** - $0.003/1K tokens - Advanced reasoning
- **claude-3-opus** - $0.015/1K tokens - Complex problem solving
- **gpt-4o** - $0.0025/1K tokens - Fast, balanced performance
- **gemini-pro** - $0.0025/1K tokens - Multimodal capabilities

### Budget Models (Cost Optimized)
- **gpt-4-turbo** - $0.002/1K tokens - Good performance, great value
- **llama-3.1-70b** - $0.001/1K tokens - Open source power
- **deepseek-coder** - $0.0005/1K tokens - Specialized for coding

## Model Selection Algorithm

### Automatic Optimization
```javascript
function selectOptimalModel(task, constraints) {
  const { priority, budget, complexity } = constraints;

  if (priority === 'cost') {
    return deepseek-coder; // Most cost-effective
  } else if (priority === 'performance') {
    return 'claude-3-opus'; // Highest performance
  } else if (budget < 0.01) {
    return 'deepseek-coder'; // Stay under budget
  } else if (complexity > 0.8) {
    return 'claude-3.5-sonnet'; // Complex reasoning
  } else {
    return 'gpt-4o'; // Balanced choice
  }
}
```

### Cost Optimization Strategies
- **Budget Mode**: Use cheapest models that meet quality requirements
- **Performance Mode**: Use best models regardless of cost
- **Balanced Mode**: Optimize for cost-performance ratio
- **Adaptive Mode**: Dynamic selection based on task complexity

## Integration Commands

### Switch Individual Agents
```bash
# Switch coder to OpenRouter model
openrouter-switcher set coder claude-3.5-sonnet

# Switch architect to cost-optimized model
openrouter-switcher set architect deepseek-coder

# Switch reviewer to premium model
openrouter-switcher set reviewer claude-3-opus
```

### Batch Configuration
```bash
# Configure multiple agents
openrouter-switcher batch-set "coder:claude-3.5-sonnet,reviewer:gpt-4o,tester:deepseek-coder"

# Optimize entire swarm for cost
openrouter-switcher swarm-optimize cost

# Optimize for performance
openrouter-switcher swarm-optimize performance
```

### Dynamic Model Selection
```bash
# Auto-select based on task
openrouter-switcher auto-select --task "build REST API" --priority balanced

# Set budget constraints
openrouter-switcher set-budget --limit 0.05 --agent coder

# Real-time cost monitoring
openrouter-switcher monitor --costs --alerts
```

## Cost Management

### Budget Planning
```javascript
const budgetPlans = {
  lite: {
    daily_limit: 0.10,
    preferred_models: ['deepseek-coder', 'llama-3.1-70b', 'gpt-4-turbo'],
    premium_allowed: false
  },
  pro: {
    daily_limit: 1.00,
    preferred_models: ['gpt-4o', 'claude-3.5-sonnet'],
    premium_allowed: true,
    premium_limit: 0.50
  },
  enterprise: {
    daily_limit: 10.00,
    preferred_models: ['claude-3-opus', 'claude-3.5-sonnet'],
    premium_allowed: true,
    premium_limit: 'unlimited'
  }
};
```

### Real-time Pricing
- Fetch current OpenRouter pricing
- Calculate costs before model selection
- Track usage against budget limits
- Alert when approaching budget thresholds

## Performance Optimization

### Model Performance Metrics
```javascript
const modelPerformance = {
  'claude-3.5-sonnet': {
    speed: 'medium',
    quality: 'high',
    cost_per_task: 0.005,
    best_for: ['reasoning', 'complex_logic', 'architecture']
  },
  'gpt-4o': {
    speed: 'fast',
    quality: 'high',
    cost_per_task: 0.003,
    best_for: ['coding', 'iteration', 'prototyping']
  },
  'deepseek-coder': {
    speed: 'fast',
    quality: 'medium',
    cost_per_task: 0.001,
    best_for: ['boilerplate', 'simple_logic', 'testing']
  }
};
```

### Selection Criteria
1. **Task Complexity**: Simple → deepseek-coder, Complex → claude-3-opus
2. **Time Sensitivity**: Urgent → gpt-4o, Normal → claude-3.5-sonnet
3. **Budget Constraints**: Low → deepseek-coder, High → claude-3-opus
4. **Quality Requirements**: Standard → gpt-4o, Premium → claude-3-opus

## Fallback Management

### Fallback Strategy
```javascript
const fallbackChains = {
  premium: ['claude-3-opus', 'claude-3.5-sonnet', 'gpt-4o', 'gpt-4-turbo'],
  balanced: ['claude-3.5-sonnet', 'gpt-4o', 'llama-3.1-70b', 'deepseek-coder'],
  budget: ['deepseek-coder', 'llama-3.1-70b', 'gpt-4-turbo', 'glm-4.5-air']
};
```

### Error Handling
- **Rate Limiting**: Automatic throttling and queueing
- **Model Unavailability**: Immediate fallback to next model
- **API Errors**: Retry with exponential backoff
- **Cost Overruns**: Automatic downgrade to cheaper models

## Usage Examples

### Development Workflow
```bash
# Start with cost optimization
openrouter-switcher swarm-optimize cost

# Switch specific agents for complex tasks
openrouter-switcher set architect claude-3.5-sonnet
openrouter-switcher set reviewer claude-3-opus

# Monitor costs in real-time
openrouter-switcher monitor --costs --alert-threshold 0.01
```

### Production Deployment
```bash
# Performance-optimized configuration
openrouter-switcher batch-set "deployment:gpt-4o,monitoring:claude-3.5-sonnet,testing:gpt-4o"

# Set daily budget limits
openrouter-switcher set-budget --daily-limit 2.50 --swarm

# Enable cost alerts
openrouter-switcher alerts enable --threshold 0.50 --email admin@company.com
```

### Quality Assurance
```bash
# High-quality review configuration
openrouter-switcher set reviewer claude-3-opus --quality-threshold 0.9

# Balanced testing setup
openrouter-switcher set tester gpt-4o --coverage-target 90

# Cost-effective documentation
openrouter-switcher set documenter deepseek-coder --template-driven
```

## Configuration API

### REST API Integration
```javascript
// Switch agent model
POST /api/v1/agents/{agent}/model
{
  "provider": "openrouter",
  "model": "claude-3.5-sonnet",
  "fallback": "gpt-4o",
  "cost_limit": 0.01
}

// Optimize swarm
POST /api/v1/swarm/optimize
{
  "priority": "cost",
  "agents": ["coder", "reviewer", "tester"],
  "budget_limit": 0.50
}

// Monitor costs
GET /api/v1/costs/usage?period=24h&agent=all
```

### Configuration File
```json
{
  "default_provider": "openrouter",
  "cost_limits": {
    "daily": 1.00,
    "per_task": 0.01,
    "alert_threshold": 0.50
  },
  "model_preferences": {
    "coder": {
      "primary": "gpt-4o",
      "fallback": "deepseek-coder",
      "cost_limit": 0.002
    },
    "reviewer": {
      "primary": "claude-3.5-sonnet",
      "fallback": "gpt-4o",
      "cost_limit": 0.005
    }
  }
}
```

## Monitoring & Analytics

### Cost Tracking
- **Real-time monitoring**: Track costs per agent and task
- **Budget alerts**: Email/Slack notifications when limits approached
- **Usage analytics**: Cost trends and optimization opportunities
- **ROI analysis**: Compare costs vs. performance improvements

### Performance Analytics
- **Response time tracking**: Monitor model latency and performance
- **Success rate analysis**: Track completion rates by model
- **Quality metrics**: Compare output quality across models
- **Optimization recommendations**: AI-powered suggestions for model selection

---

Remember: The OpenRouter Switcher provides seamless integration with any OpenRouter model while maintaining cost control and performance optimization for your Claude-Flow agents.