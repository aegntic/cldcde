# Examples & Use Cases

## Basic Usage Examples

### Example 1: Code Review Session
```python
# Start a focused code review session
session_id = start_collaboration({
    "max_exchanges": 10,
    "require_approval": True
})

# Send code for review with full context
response = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Review this React component for performance issues, accessibility concerns, and best practices",
    "context": """
    Component: UserProfile.jsx
    
    import React, { useState, useEffect } from 'react';
    import { getUserData, updateUserProfile } from '../api/userService';
    
    const UserProfile = ({ userId }) => {
        const [user, setUser] = useState(null);
        const [loading, setLoading] = useState(true);
        
        useEffect(() => {
            const fetchUser = async () => {
                try {
                    const userData = await getUserData(userId);
                    setUser(userData);
                } finally {
                    setLoading(false);
                }
            };
            
            if (userId) {
                fetchUser();
            }
        }, [userId]);
        
        // ... rest of component
    };
    
    Package.json dependencies:
    - react: ^18.2.0
    - axios: ^1.6.0
    """
})

# Continue the conversation with follow-up questions
follow_up = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Based on your review, what would be the top 3 priority improvements to implement first?"
})
```

### Example 2: Architecture Planning
```python
# Plan a new microservice architecture
session_id = start_collaboration({
    "max_exchanges": 15,
    "require_approval": True
})

# Provide system requirements and constraints
architecture_plan = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Design a scalable microservices architecture for an e-commerce platform",
    "context": """
    Requirements:
    - Handle 100k+ concurrent users
    - Support multiple payment methods
    - Real-time inventory management
    - Recommendation engine
    - Order tracking and notifications
    
    Constraints:
    - Cloud-native (AWS/GCP)
    - Kubernetes deployment
    - Budget: $50k/month infrastructure
    - Team: 8 developers, 2 DevOps
    
    Current Tech Stack:
    - Frontend: React + Next.js
    - Backend: Node.js + Express
    - Database: PostgreSQL + Redis
    - Message Queue: RabbitMQ
    """
})

# Dive deeper into specific components
database_design = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Focus on the database architecture. How should we handle data consistency across microservices?"
})
```

## Advanced Use Cases

### Large Codebase Analysis
```python
# Analyze an entire project for technical debt
session_id = start_collaboration({
    "max_exchanges": 20,
    "require_approval": True
})

# Include comprehensive project context
analysis = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Analyze this entire codebase for technical debt, security issues, and modernization opportunities",
    "context": """
    Project Structure:
    src/
    ├── components/     (45 React components)
    ├── services/       (12 API services)
    ├── utils/          (8 utility modules)
    ├── hooks/          (15 custom hooks)
    ├── pages/          (23 page components)
    └── styles/         (CSS modules)
    
    Key Files:
    [Include contents of package.json, tsconfig.json, major components, services, etc.]
    
    Git History:
    - 2 years of development
    - 847 commits
    - 5 major feature releases
    - Last major refactor: 8 months ago
    
    Performance Issues:
    - Bundle size: 2.3MB
    - Initial load: 3.2s
    - Lighthouse score: 67
    
    Dependencies:
    - 156 npm packages
    - 23 outdated packages
    - 4 security vulnerabilities
    """
})
```

### AI Pair Programming
```python
# Collaborative feature development
session_id = start_collaboration({
    "max_exchanges": 25,
    "require_approval": True
})

# Start with feature requirements
feature_plan = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Let's build a real-time chat feature with file sharing capabilities",
    "context": """
    Current Application:
    - React + TypeScript frontend
    - Node.js + Express backend
    - Socket.io for real-time features
    - MongoDB for data storage
    - AWS S3 for file storage
    
    Requirements:
    - Private and group chat rooms
    - File upload/download (images, documents)
    - Message history and search
    - Online status indicators
    - Push notifications
    - Mobile responsive design
    
    Existing Code:
    [Include relevant existing components, API endpoints, database schemas]
    """
})

# Iterative development with implementation steps
implementation = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Let's start with the backend API design. What endpoints do we need and how should we structure the data models?"
})

# Continue with frontend implementation
frontend_design = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Now let's design the React components. Show me the component hierarchy and key props/state management."
})
```

## Domain-Specific Examples

### DevOps & Infrastructure
```python
# Kubernetes deployment optimization
session_id = start_collaboration({"max_exchanges": 12})

k8s_review = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Review and optimize this Kubernetes deployment for production",
    "context": """
    [Include YAML files: deployment.yaml, service.yaml, ingress.yaml, configmap.yaml]
    
    Current Issues:
    - Pod restarts under load
    - Slow startup times
    - Resource consumption spikes
    
    Environment:
    - GKE cluster with 10 nodes
    - 50+ microservices
    - 1000+ requests/second peak
    """
})
```

### Data Science Pipeline
```python
# ML model optimization
session_id = start_collaboration({"max_exchanges": 15})

ml_review = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Optimize this machine learning pipeline for better accuracy and performance",
    "context": """
    Model: Customer churn prediction
    Dataset: 500k records, 50 features
    Current accuracy: 82%
    Training time: 45 minutes
    Inference time: 200ms
    
    Pipeline code:
    [Include Python scripts for data preprocessing, feature engineering, model training, evaluation]
    
    Issues:
    - Overfitting on training data
    - High feature correlation
    - Slow inference for real-time predictions
    """
})
```

### Security Audit
```python
# Comprehensive security review
session_id = start_collaboration({"max_exchanges": 18})

security_audit = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Conduct a thorough security audit of this web application",
    "context": """
    Application: Financial SaaS platform
    
    Technology Stack:
    - Frontend: React + Redux
    - Backend: Python + Django REST
    - Database: PostgreSQL
    - Authentication: JWT + OAuth2
    - Hosting: AWS with CloudFront
    
    Code to Review:
    [Include authentication logic, API endpoints, database models, frontend components handling sensitive data]
    
    Focus Areas:
    - Input validation and sanitization
    - Authentication and authorization
    - Data encryption and storage
    - API security and rate limiting
    - Frontend security (XSS, CSRF)
    """
})
```

## Workflow Patterns

### Iterative Refinement
```python
# Start with broad analysis
session_id = start_collaboration({"max_exchanges": 20})

# Step 1: High-level overview
overview = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Provide a high-level analysis of this system's architecture and identify the top 5 areas that need attention"
})

# Step 2: Deep dive into priority areas
deep_dive = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Let's focus on the database performance issues you mentioned. Provide specific optimization recommendations."
})

# Step 3: Implementation planning
implementation = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Create a step-by-step implementation plan for these database optimizations, including testing strategies."
})
```

### Multi-Perspective Analysis
```python
# Get different viewpoints on the same problem
session_id = start_collaboration({"max_exchanges": 25})

# Technical perspective
technical = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Analyze this from a technical architecture perspective - scalability, performance, maintainability"
})

# Business perspective  
business = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Now analyze the same system from a business perspective - cost, time-to-market, risk factors"
})

# User experience perspective
ux = collaborate_with_gemini({
    "session_id": session_id,
    "content": "Finally, evaluate this from a user experience perspective - usability, accessibility, performance impact"
})
```