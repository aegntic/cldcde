# Retrieval Optimization Prompts

## System Configuration Prompts

### Initial Setup and Configuration
```
You are a retrieval system expert specializing in multi-layer RAG architecture. Help me optimize the Obsidian Elite RAG system configuration.

Current system details:
- Multi-layer RAG with 6 layers (Semantic, Knowledge Graph, Graph Traversal, Temporal, Domain, Meta-Knowledge)
- Knowledge graph with 27+ entity types and 40+ relationship types
- Neo4j + Qdrant databases
- Focus on Obsidian vault content

Please provide optimization recommendations for:
1. Layer weight configuration for different use cases
2. Entity and relationship type priorities
3. Retrieval parameter tuning
4. Performance optimization strategies

Consider the user's vault contains technical documentation, research papers, and project notes.
```

### Knowledge Graph Enhancement
```
You are a knowledge graph specialist with expertise in Graphiti and Neo4j. Analyze the current knowledge graph configuration and suggest improvements.

Current configuration:
- Entity types: concept, person, organization, technology, algorithm, framework, system, application, tool, library, database, API, protocol, standard, specification, pattern, principle, theory, model, architecture, design, implementation, project, research, event, location
- Relationship types: part_of, implements, extends, based_on, depends_on, similar_to, contrasts_with, related_to, examples_of, uses, enables, requires, supports, improves, integrates_with, connects_to, references, cites, builds_on, applies_to, defines, describes, explains, demonstrates, validates, tests, analyzes, compares, evaluates, optimizes, automates, manages, monitors, deploys, configures, maintains, documents, teaches, learns

Please suggest:
1. Priority entity types for different domains
2. Most valuable relationship types for knowledge discovery
3. Confidence thresholds for relationship detection
4. Graph traversal optimization strategies
5. Entity resolution and deduplication approaches
```

### Query Strategy Optimization
```
You are an expert in information retrieval and query optimization. Help me design optimal query strategies for the multi-layer RAG system.

System capabilities:
- Semantic search with OpenAI embeddings
- Knowledge graph traversal with Neo4j
- NetworkX-based link traversal
- Temporal and domain-specific filtering
- Meta-knowledge retrieval

For each query type below, provide optimal strategies:
1. Factual queries ("What is X?")
2. Comparative queries ("X vs Y comparison")
3. Procedural queries ("How to do X?")
4. Analytical queries ("Analyze X and Y")
5. Creative queries ("Generate ideas for X")
6. Research queries ("Latest developments in X")

Include recommendations for:
- Layer selection and weighting
- Query expansion and reformulation
- Result filtering and ranking
- Performance optimization
```

## Content Analysis Prompts

### Vault Structure Analysis
```
You are a knowledge management specialist. Analyze the Obsidian vault structure and provide recommendations for optimal organization.

Current structure:
```
00-Core/           # Foundational knowledge
01-Projects/       # Active work
02-Research/       # Learning areas
03-Workflows/      # Reusable processes
04-AI-Paired/      # AI interactions
05-Resources/      # External references
06-Meta/           # System knowledge
07-Archive/        # Historical data
08-Templates/      # Note structures
09-Links/          # External connections
```

Please analyze:
1. Effectiveness of current structure for different content types
2. Gaps or overlaps in organization
3. Improvements for discoverability and retrieval
4. Recommended naming conventions
5. Link density and connection optimization
6. Content migration strategies if needed

Consider the vault contains technical documentation, academic research, project notes, and personal knowledge.
```

### Content Quality Assessment
```
You are a content quality expert. Assess and provide recommendations for improving note quality in the Obsidian vault.

Quality dimensions to evaluate:
1. Content completeness and accuracy
2. Structure and formatting consistency
3. Link quality and relevance
4. Metadata and tagging effectiveness
5. Reference and citation quality
6. Searchability and findability

Please provide:
1. Quality assessment criteria
2. Common quality issues and solutions
3. Improvement templates and guidelines
4. Automated quality check recommendations
5. Content review processes
6. Metrics for measuring content quality over time
```

### Link Analysis and Optimization
```
You are a network analysis expert specializing in knowledge graphs. Analyze the linking patterns in the Obsidian vault and provide optimization recommendations.

Analysis areas:
1. Link density and distribution
2. Hub and authority identification
3. Community detection and clustering
4. Path analysis and knowledge gaps
5. Orphaned content identification
6. Link quality and relevance assessment

Please provide:
1. Link optimization strategies
2. Recommended link density targets
3. Methods for identifying knowledge gaps
4. Automated link suggestion approaches
5. Link maintenance and validation processes
6. Metrics for measuring link effectiveness
```

## Performance Optimization Prompts

### System Performance Tuning
```
You are a performance optimization expert for RAG systems. Analyze the current system configuration and provide performance tuning recommendations.

Current system specs:
- Neo4j knowledge graph database
- Qdrant vector database
- Multi-layer retrieval architecture
- Async processing with Python
- Focus on sub-100ms query response times

Optimization areas:
1. Database query optimization
2. Embedding computation and caching
3. Graph traversal efficiency
4. Memory usage optimization
5. Concurrent processing improvements
6. Caching strategies for different content types

Please provide specific recommendations for:
- Configuration parameter tuning
- Index optimization strategies
- Resource allocation recommendations
- Bottleneck identification and resolution
- Performance monitoring and alerting
```

### Caching Strategy Design
```
You are a caching systems expert. Design a comprehensive caching strategy for the Obsidian Elite RAG system.

System components to cache:
- Query results and embeddings
- Knowledge graph traversal results
- Entity and relationship data
- Frequently accessed documents
- System configuration and metadata

Please design:
1. Multi-level caching architecture
2. Cache invalidation strategies
3. Cache warming and preloading approaches
4. Cache size optimization
5. Cache hit rate improvement strategies
6. Monitoring and analytics for cache performance

Consider memory constraints and the need for real-time updates.
```

### Scalability Planning
```
You are a systems scalability expert. Help design a scalability plan for the Obsidian Elite RAG system as the knowledge base grows.

Growth scenarios:
- Vault size: 1,000 to 100,000+ documents
- Query volume: 10 to 1,000+ queries per hour
- Concurrent users: 1 to 100+ simultaneous users
- Content types: Text, images, documents, code

Please provide:
1. Architectural scalability recommendations
2. Database scaling strategies
3. Load balancing approaches
4. Resource provisioning guidelines
5. Performance degradation prevention
6. Monitoring and alerting for scaling events
```

## Domain-Specific Prompts

### Technical Documentation Optimization
```
You are a technical documentation specialist. Optimize the RAG system for retrieving technical documentation effectively.

Content types:
- API documentation
- Code examples and tutorials
- System architecture documents
- Technical specifications
- Troubleshooting guides
- Best practices and patterns

Optimization focus:
1. Code snippet extraction and indexing
2. Technical term recognition and disambiguation
3. Code-example matching and relevance
4. API documentation structure preservation
5. Cross-reference linking for technical concepts
6. Version-aware retrieval for documentation

Provide specific recommendations for:
- Preprocessing technical content
- Entity extraction for code elements
- Relationship detection for technical dependencies
- Query understanding for technical queries
```

### Research Paper Retrieval
```
You are an academic research specialist. Optimize the RAG system for retrieving research papers and academic content effectively.

Content types:
- Research papers and articles
- Conference proceedings
- Thesis and dissertations
- Technical reports
- Book chapters and sections
- Citation networks and references

Optimization focus:
1. Academic citation and reference extraction
2. Author and institution recognition
3. Research methodology and results extraction
4. Temporal relevance for research trends
5. Domain-specific terminology handling
6. Literature gap identification

Provide recommendations for:
- Academic entity extraction
- Citation network analysis
- Research trend identification
- Scholarly relationship mapping
- Quality assessment for academic content
```

### Project Management Retrieval
```
You are a project management expert. Optimize the RAG system for retrieving project-related information effectively.

Content types:
- Project plans and specifications
- Meeting notes and decisions
- Task lists and progress reports
- Stakeholder communications
- Risk assessments and mitigation plans
- Resource allocation and timelines

Optimization focus:
1. Project status and progress tracking
2. Task dependency mapping
3. Stakeholder relationship identification
4. Risk factor correlation
5. Timeline and milestone extraction
6. Resource requirement analysis

Provide recommendations for:
- Project metadata extraction
- Timeline and progress mapping
- Stakeholder network analysis
- Risk factor identification
- Decision impact assessment
```

## Troubleshooting and Maintenance Prompts

### System Diagnostics
```
You are a system diagnostics expert. Help create comprehensive diagnostic procedures for the Obsidian Elite RAG system.

Diagnostic areas:
1. Database connectivity and performance
2. Knowledge graph integrity and consistency
3. Vector embedding quality and coverage
4. Multi-layer retrieval performance
5. System resource utilization
6. Error detection and reporting

Please provide:
1. Automated diagnostic procedures
2. Health check parameters and thresholds
3. Common issue identification and resolution
4. Performance benchmarking procedures
5. System monitoring dashboards
6. Alerting and notification strategies
```

### Data Quality Maintenance
```
You are a data quality specialist. Design procedures for maintaining high-quality data in the Obsidian Elite RAG system.

Quality dimensions:
1. Content accuracy and completeness
2. Link validity and relevance
3. Entity and relationship consistency
4. Metadata and tagging quality
5. Duplicate detection and resolution
6. Outdated content identification

Please provide:
1. Automated quality assessment procedures
2. Data cleaning and validation workflows
3. Quality metrics and monitoring
4. Maintenance scheduling and automation
5. Quality improvement strategies
6. User feedback integration
```

### System Recovery Procedures
```
You are a disaster recovery specialist. Design comprehensive recovery procedures for the Obsidian Elite RAG system.

Recovery scenarios:
1. Database corruption or failure
2. Knowledge graph inconsistency
3. System configuration corruption
4. Content loss or corruption
5. Performance degradation
6. Security incident recovery

Please provide:
1. Backup and restore procedures
2. System recovery checklists
3. Data validation procedures
4. Performance recovery strategies
5. Communication and notification plans
6. Post-recovery testing procedures
```

## User Experience Optimization

### Query Interface Design
```
You are a user experience designer specializing in search interfaces. Design optimal query interfaces for the Obsidian Elite RAG system.

Interface considerations:
1. Query formulation and suggestion
2. Result presentation and ranking
3. Filtering and refinement options
4. Context and relevance indicators
5. Feedback and learning mechanisms
6. Performance and responsiveness

Please provide:
1. Query interface design recommendations
2. Result display optimization
3. User interaction patterns
4. Personalization and adaptation strategies
5. Accessibility considerations
6. Mobile and cross-platform compatibility
```

### Feedback Integration
```
You are a feedback systems expert. Design mechanisms for collecting and integrating user feedback into the Obsidian Elite RAG system.

Feedback types:
1. Result relevance ratings
2. Query satisfaction scores
3. Content quality assessments
4. System usability feedback
5. Feature requests and suggestions
6. Error reports and issues

Please provide:
1. Feedback collection mechanisms
2. Feedback analysis and processing
3. System improvement integration
4. User engagement strategies
5. Feedback loop optimization
6. Performance measurement and reporting
```

### Personalization Strategies
```
You are a personalization specialist. Design personalization strategies for the Obsidian Elite RAG system.

Personalization dimensions:
1. Content relevance and preferences
2. Search behavior patterns
3. Domain expertise and interests
4. Collaboration and sharing patterns
5. Usage frequency and timing
6. Device and platform preferences

Please provide:
1. User profiling strategies
2. Personalization algorithm design
3. Privacy and security considerations
4. Performance optimization
5. User control and transparency
6. Effectiveness measurement approaches
```

## Advanced Analytics Prompts

### Usage Analytics
```
You are a data analytics expert. Design comprehensive analytics for the Obsidian Elite RAG system usage.

Analytics dimensions:
1. Query patterns and frequencies
2. Content access and usage
3. User behavior and engagement
4. System performance metrics
5. Knowledge graph utilization
6. Feature adoption and effectiveness

Please provide:
1. Analytics architecture and implementation
2. Key performance indicators and metrics
3. Dashboard design and visualization
4. Reporting and alerting strategies
5. Data-driven optimization approaches
6. Privacy and ethical considerations
```

### Knowledge Discovery Analytics
```
You are a knowledge discovery expert. Design analytics for discovering insights from the Obsidian Elite RAG system knowledge base.

Discovery dimensions:
1. Emerging trends and patterns
2. Knowledge gaps and opportunities
3. Expertise identification and mapping
4. Collaboration and sharing patterns
5. Innovation and creativity indicators
6. Learning and development progress

Please provide:
1. Knowledge discovery algorithms
2. Pattern recognition strategies
3. Insight generation frameworks
4. Visualization and presentation approaches
5. Validation and verification methods
6. Integration with user workflows
```

### Predictive Analytics
```
You are a predictive analytics expert. Design predictive analytics for the Obsidian Elite RAG system.

Prediction targets:
1. User query intent and needs
2. Content relevance and importance
3. Knowledge gaps and requirements
4. System performance issues
5. User satisfaction and engagement
6. Future content and feature needs

Please provide:
1. Predictive model design
2. Feature engineering approaches
3. Model training and validation
4. Prediction accuracy and reliability
5. Integration with system operations
6. Ethical and privacy considerations
```

Each prompt includes context, scope, and expected outputs to guide effective system optimization and improvement.