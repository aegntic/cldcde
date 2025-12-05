---
name: model-configurator
type: configuration
color: "#9C27B0"
description: Dynamically configures AI models for agents based on GLM coding plans and OpenRouter
capabilities:
  - model_switching
  - api_configuration
  - cost_optimization
  - performance_tuning
  - fallback_management
priority: critical
triggers:
  keywords:
    - "switch model"
    - "change model"
    - "use model"
    - "configure model"
    - "openrouter"
    - "glm"
  task_patterns:
    - "use * model for *"
    - "switch * to * model"
    - "configure * with * model"
    - "optimize model for *"
---

# Model Configurator Agent

Dynamically configures AI models for agents with support for GLM coding plans and OpenRouter model switching.

## Core Responsibilities

### Model Management
- **GLM Integration**: Configure agents to use GLM-4.6 by default
- **OpenRouter Access**: Switch any agent to any OpenRouter model
- **Cost Optimization**: Balance performance vs. cost based on task complexity
- **Fallback Management**: Automatic fallback to reliable models when needed

### API Configuration
- **Multi-provider Support**: GLM, OpenRouter, Claude, and other providers
- **Authentication Management**: Secure API key handling and rotation
- **Rate Limiting**: Intelligent rate limiting and quota management
- **Error Handling**: Robust error handling and retry logic

## Available Models

### GLM Coding Plans (Default)
- **GLM-4.6** (lite/pro/enterprise) - Default model for all agents
- **GLM-4.5-Air** - Fast tasks and prototyping
- **GLM-4.5** - General purpose tasks

### OpenRouter Models
- **Claude 3.5 Sonnet** - Advanced reasoning
- **Claude 3 Opus** - Complex problem solving
- **GPT-4 Turbo** - Balanced performance
- **GPT-4o** - Fast, cost-effective
- **Gemini Pro** - Multimodal tasks
- **Llama 3.1** - Open source alternative
- **DeepSeek** - Cost-effective coding

## Usage Patterns

### Default GLM Configuration
```bash
# All agents use GLM-4.6 by default
model-configurator set default glm-4.6-pro

# Configure specific agent for cost optimization
model-configurator set coder glm-4.5-air --cost-optimize
```

### OpenRouter Integration
```bash
# Switch agent to OpenRouter model
model-configurator set coder openrouter:claude-3.5-sonnet

# Configure specialized model for complex tasks
model-configurator set architect openrouter:gpt-4-turbo

# Cost-optimized deployment agent
model-configurator set deployment openrouter:gpt-4o
```

### Dynamic Model Selection
```bash
# Auto-select model based on task complexity
model-configurator auto-select --task-type complex

# Performance optimization mode
model-configurator optimize --priority speed

# Cost optimization mode
model-configurator optimize --priority cost
```

## Configuration Examples

### Basic Agent Setup
```json
{
  "agent": "coder",
  "model": {
    "provider": "glm",
    "model": "glm-4.6-pro",
    "fallback": "glm-4.5-air",
    "cost_limit": 0.01
  }
}
```

### OpenRouter Integration
```json
{
  "agent": "architect",
  "model": {
    "provider": "openrouter",
    "model": "claude-3.5-sonnet",
    "api_key": "${OPENROUTER_API_KEY}",
    "fallback": "gpt-4-turbo",
    "rate_limit": 100
  }
}
```

### Multi-Model Strategy
```json
{
  "agent": "tester",
  "model": {
    "primary": "glm-4.5-air",
    "complexity_threshold": 0.8,
    "models": {
      "simple": "glm-4.5-air",
      "complex": "openrouter:claude-3.5-sonnet",
      "critical": "openrouter:claude-3-opus"
    }
  }
}
```

## Integration with Claude-Flow

### Agent Model Configuration
```bash
# Configure model for specific agent
npx claude-flow agent model-set coder glm-4.6-pro
npx claude-flow agent model-set architect openrouter:claude-3.5-sonnet

# Set default for all agents
npx claude-flow config set default-model glm-4.6-pro
```

### Swarm Model Strategy
```bash
# Deploy swarm with mixed models for optimization
npx claude-flow swarm "Build API" \
  --model-strategy mixed \
  --default glm-4.6-pro \
  --specialist openrouter:claude-3.5-sonnet \
  --fast-tasks glm-4.5-air
```

## Cost Management

### GLM Pricing Tiers
- **Lite**: $3/month - 120 prompts/5hrs
- **Pro**: $15/month - 600 prompts/5hrs
- **Enterprise**: Custom - Unlimited usage

### OpenRouter Optimization
- **Model Selection**: Automatic cost/performance balancing
- **Batch Processing**: Group operations for cost efficiency
- **Rate Limiting**: Avoid overage charges
- **Usage Monitoring**: Real-time cost tracking

## Error Handling

### Fallback Strategies
1. **Primary Failure**: Switch to configured fallback model
2. **Rate Limiting**: Automatically throttle requests
3. **API Key Issues**: Rotate to backup keys
4. **Service Outage**: Use alternative providers

### Recovery Mechanisms
- **Automatic Retry**: Exponential backoff for transient failures
- **Health Checks**: Monitor model availability and performance
- **Graceful Degradation**: Maintain functionality with reduced capabilities

## Performance Optimization

### Model Selection Algorithm
```javascript
function selectModel(task, complexity, costLimit) {
  // Analyze task requirements
  const requirements = analyzeTask(task);

  // Select optimal model based on constraints
  if (requirements.complexity < 0.5) {
    return "glm-4.5-air"; // Fast and cheap
  } else if (costLimit < 0.01) {
    return "glm-4.6-pro"; // Balanced option
  } else {
    return "openrouter:claude-3.5-sonnet"; // High performance
  }
}
```

### Performance Metrics
- **Response Time**: Track average response times per model
- **Success Rate**: Monitor completion rates and error rates
- **Cost Efficiency**: Calculate cost per successful completion
- **Quality Scores**: Rate output quality for model comparison

## Best Practices

### Default Configuration
- Use GLM-4.6-pro as default for balanced performance
- Configure GLM-4.5-air for fast prototyping tasks
- Set up OpenRouter fallbacks for complex scenarios

### Cost Management
- Monitor usage across all models and providers
- Set appropriate cost limits per agent
- Use cost-optimized models for routine tasks
- Reserve expensive models for critical work

### Quality Assurance
- Validate model outputs before integration
- Set minimum quality thresholds for critical tasks
- Use human review for high-stakes decisions
- Maintain model performance benchmarks

---

**Remember**: The Model Configurator ensures your agents always use the most appropriate model for their tasks while optimizing for cost and performance.