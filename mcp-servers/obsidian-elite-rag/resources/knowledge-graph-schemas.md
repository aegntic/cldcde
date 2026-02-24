# Knowledge Graph Schemas and Patterns

## Entity Type Schemas

### Core Entity Types

#### Concept
```
- Definition: Abstract idea, principle, or mental construct
- Properties: definition, category, complexity_level, domain
- Examples: Machine Learning, Recursion, Design Patterns
- Relationships: implements, requires, is_prerequisite_for, examples_of
```

#### Person
```
- Definition: Individual human or role
- Properties: name, role, expertise, affiliation, contributions
- Examples: Geoffrey Hinton, Martin Fowler, Donald Knuth
- Relationships: works_for, created_by, collaborated_with, mentored_by
```

#### Organization
```
- Definition: Company, institution, or organized group
- Properties: name, industry, size, founded_date, location
- Examples: Google, OpenAI, MIT, Microsoft Research
- Relationships: employs, produces, competes_with, partners_with
```

#### Technology
```
- Definition: Tool, framework, or technical system
- Properties: name, type, version, language, platform
- Examples: React, TensorFlow, Docker, Kubernetes
- Relationships: implements, extends, compatible_with, alternative_to
```

#### Algorithm
```
- Definition: Computational procedure or method
- Properties: name, complexity, use_case, inputs, outputs
- Examples: QuickSort, Backpropagation, Dijkstra's Algorithm
- Relationships: implemented_in, optimizes, alternative_to, requires
```

#### Framework
```
- Definition: Structural or conceptual framework
- Properties: name, domain, components, principles
- Examples: Agile, MVC, REST, SOLID
- Relationships: defines, includes, used_by, extends
```

#### Methodology
```
- Definition: Systematic approach or method
- Properties: name, process, steps, tools, outcomes
- Examples: Test-Driven Development, Design Thinking, Scrum
- Relationships: includes, requires, produces, improves
```

#### System
```
- Definition: Integrated set of components
- Properties: name, components, interfaces, purpose
- Examples: Operating System, Database System, CI/CD Pipeline
- Relationships: includes, depends_on, integrates_with, manages
```

#### Application
```
- Definition: Software application or program
- Properties: name, purpose, platform, features
- Examples: VS Code, Docker Desktop, Postman
- Relationships: built_with, provides, runs_on, configures
```

#### Tool
```
- Definition: Utility or software tool
- Properties: name, function, platform, usage
- Examples: Git, npm, pytest, webpack
- Relationships: used_for, automates, extends, configures
```

#### Library
```
- Definition: Software library or package
- Properties: name, language, version, dependencies
- Examples: React, NumPy, Express.js, LangChain
- Relationships: provides, depends_on, compatible_with, extends
```

#### Database
```
- Definition: Data storage system
- Properties: name, type, schema, scale, features
- Examples: PostgreSQL, MongoDB, Redis, Neo4j
- Relationships: stores, indexes, queries, manages
```

#### API
```
- Definition: Application Programming Interface
- Properties: name, protocol, endpoints, authentication
- Examples: REST API, GraphQL API, WebSocket
- Relationships: provides, requires, implements, documents
```

#### Protocol
```
- Definition: Communication protocol or standard
- Properties: name, version, specification, use_case
- Examples: HTTP, TCP/IP, SMTP, OAuth 2.0
- Relationships: defines, requires, implements, secures
```

#### Standard
```
- Definition: Technical standard or specification
- Properties: name, organization, version, scope
- Examples: IEEE 802.11, ISO 27001, RFC 2616
- Relationships: defines, requires, complies_with, extends
```

#### Specification
```
- Definition: Detailed specification or documentation
- Properties: name, version, requirements, constraints
- Examples: API Specification, System Requirements
- Relationships: defines, documents, implements, validates
```

#### Pattern
```
- Definition: Design or implementation pattern
- Properties: name, context, problem, solution
- Examples: Singleton Pattern, Observer Pattern, MVC Pattern
- Relationships: solves, used_in, alternative_to, combines_with
```

#### Principle
```
- Definition: Guiding principle or rule
- Properties: name, domain, description, application
- Examples: DRY Principle, SOLID Principles, KISS Principle
- Relationships: guides, requires, contradicts, supports
```

#### Theory
```
- Definition: Scientific or technical theory
- Properties: name, domain, hypotheses, evidence
- Examples: Information Theory, Graph Theory, Complexity Theory
- Relationships: explains, predicts, applies_to, supported_by
```

#### Model
```
- Definition: Conceptual or mathematical model
- Properties: name, type, variables, assumptions
- Examples: Relational Model, Neural Network Model, Statistical Model
- Relationships: represents, predicts, requires, extends
```

#### Architecture
```
- Definition: System architecture or design
- Properties: name, components, relationships, constraints
- Examples: Microservices Architecture, Layered Architecture
- Relationships: defines, includes, enables, constrains
```

#### Design
```
- Definition: Design approach or methodology
- Properties: name, principles, process, outcomes
- Examples: Responsive Design, User-Centered Design
- Relationships: guides, requires, produces, improves
```

#### Implementation
```
- Definition: Specific implementation or approach
- Properties: name, technology, features, tradeoffs
- Examples: Redux Implementation, REST API Implementation
- Relationships: implements, based_on, alternative_to, extends
```

#### Project
```
- Definition: Specific project or initiative
- Properties: name, status, timeline, goals, team
- Examples: Project Alpha, Research Initiative, Product Launch
- Relationships: involves, produces, requires, depends_on
```

#### Research
```
- Definition: Research study or investigation
- Properties: name, methodology, findings, domain
- Examples: Neural Network Research, UX Research Study
- Relationships: investigates, produces, requires, cited_by
```

#### Event
```
- Definition: Event or occurrence
- Properties: name, date, location, participants, outcomes
- Examples: Conference, Meeting, Product Launch
- Relationships: involves, produces, requires, precedes
```

#### Location
```
- Definition: Physical or virtual location
- Properties: name, type, coordinates, features
- Examples: Silicon Valley, GitHub, Conference Center
- Relationships: hosts, located_in, connects_to, accessible_from
```

## Relationship Type Schemas

### Structural Relationships

#### part_of
```
- Definition: Component is part of a larger whole
- Direction: component -> whole
- Properties: cardinality, importance, role
- Examples: Chapter part_of Book, Engine part_of Car
```

#### implements
```
- Definition: Implementation of an interface or specification
- Direction: implementation -> specification
- Properties: compliance_level, features, limitations
- Examples: React implements Component Interface, API implements REST Spec
```

#### extends
```
- Definition: Extension or enhancement of existing entity
- Direction: extension -> base
- Properties: new_features, compatibility, breaking_changes
- Examples: TypeScript extends JavaScript, Microservice extends Monolith
```

#### based_on
```
- Definition: Entity is based on or derived from another
- Direction: derived -> original
- Properties: inspiration_level, modifications, improvements
- Examples: Framework based_on Pattern, Algorithm based_on Theory
```

#### depends_on
```
- Definition: Entity requires or depends on another
- Direction: dependent -> required
- Properties: dependency_type, version_requirements, alternatives
- Examples: Application depends_on Library, System depends_on Infrastructure
```

### Semantic Relationships

#### similar_to
```
- Definition: Entities share similar characteristics or purposes
- Direction: bidirectional
- Properties: similarity_score, shared_features, differences
- Examples: React similar_to Vue, SQL similar_to NoSQL
```

#### contrasts_with
```
- Definition: Entities have contrasting or opposite characteristics
- Direction: bidirectional
- Properties: contrast_points, use_cases, tradeoffs
- Examples: Monolith contrasts_with Microservices, Waterfall contrasts_with Agile
```

#### related_to
```
- Definition: General relationship between entities
- Direction: bidirectional
- Properties: relationship_type, strength, context
- Examples: AI related_to Machine Learning, Security related_to Authentication
```

#### examples_of
```
- Definition: Entity is an example of a concept or category
- Direction: example -> concept
- Properties: representativeness, completeness, context
- Examples: React examples_of Component Library, Scrum examples_of Agile
```

### Functional Relationships

#### uses
```
- Definition: Entity uses or utilizes another entity
- Direction: user -> used
- Properties: usage_frequency, purpose, alternatives
- Examples: Developer uses IDE, Application uses Database
```

#### enables
```
- Definition: Entity enables or makes possible another entity
- Direction: enabler -> enabled
- Properties: capability, requirements, limitations
- Examples: Cloud Computing enables Scalability, API enables Integration
```

#### requires
```
- Definition: Entity requires another entity to function
- Direction: requiring -> required
- Properties: necessity_level, alternatives, constraints
- Examples: Authentication requires Identity Provider, ML requires Data
```

#### supports
```
- Definition: Entity supports or backs another entity
- Direction: supporter -> supported
- Properties: support_type, capacity, limitations
- Examples: Team supports Project, Infrastructure supports Application
```

#### improves
```
- Definition: Entity improves or enhances another entity
- Direction: improvement -> improved
- Properties: improvement_type, metrics, tradeoffs
- Examples: Caching improves Performance, Testing improves Quality
```

#### integrates_with
```
- Definition: Entity integrates with another entity
- Direction: bidirectional
- Properties: integration_type, data_flow, configuration
- Examples: Frontend integrates_with Backend, System integrates_with API
```

### Cognitive Relationships

#### defines
```
- Definition: Entity defines or specifies another entity
- Direction: definition -> defined
- Properties: scope, precision, authority
- Examples: Standard defines Implementation, Theory defines Concepts
```

#### describes
```
- Definition: Entity describes or explains another entity
- Direction: description -> described
- Properties: detail_level, perspective, completeness
- Examples: Documentation describes System, Model describes Phenomenon
```

#### explains
```
- Definition: Entity explains or provides rationale for another
- Direction: explanation -> explained
- Properties: reasoning_type, evidence, clarity
- Examples: Theory explains Observations, Pattern explains Solution
```

#### demonstrates
```
- Definition: Entity demonstrates or shows another entity
- Direction: demonstration -> demonstrated
- Properties: example_type, completeness, context
- Examples: Code demonstrates Pattern, Case Study demonstrates Method
```

#### teaches
```
- Definition: Entity teaches or instructs about another entity
- Direction: teaching -> taught
- Properties: pedagogical_approach, difficulty_level, objectives
- Examples: Tutorial teaches Framework, Book teaches Theory
```

### Development Relationships

#### builds_on
```
- Definition: Entity builds upon or extends previous work
- Direction: builder -> base
- Properties: enhancement_type, compatibility, innovation
- Examples: Framework builds_on Library, Research builds_on Theory
```

#### applies_to
```
- Definition: Entity applies to or is used in a specific context
- Direction: applied -> context
- Properties: application_domain, effectiveness, constraints
- Examples: Pattern applies_to Problem, Method applies_to Domain
```

#### references
```
- Definition: Entity references or cites another entity
- Direction: referrer -> referenced
- Properties: reference_type, context, importance
- Examples: Paper references Research, Code comments references Documentation
```

#### cites
```
- Definition: Entity formally cites or acknowledges another entity
- Direction: citation -> cited
- Properties: citation_type, credibility, context
- Examples: Research cites Previous Work, Documentation cites Standards
```

#### tests
```
- Definition: Entity tests or validates another entity
- Direction: test -> tested
- Properties: test_type, coverage, results
- Examples: Unit Test tests Function, Integration Test tests System
```

### Operational Relationships

#### manages
```
- Definition: Entity manages or controls another entity
- Direction: manager -> managed
- Properties: management_type, scope, authority
- Examples: Manager manages Team, Orchestration manages Containers
```

#### monitors
```
- Definition: Entity monitors or observes another entity
- Direction: monitor -> monitored
- Properties: metrics, frequency, alerts
- Examples: Monitoring Service monitors Application, Log monitors Events
```

#### deploys
```
- Definition: Entity deploys or releases another entity
- Direction: deployer -> deployed
- Properties: deployment_type, environment, version
- Examples: CI/CD deploys Application, Platform deploys Service
```

#### configures
```
- Definition: Entity configures or sets up another entity
- Direction: configurator -> configured
- Properties: configuration_type, parameters, validation
- Examples: Setup Script configures Environment, UI configures Settings
```

#### maintains
```
- Definition: Entity maintains or supports another entity
- Direction: maintainer -> maintained
- Properties: maintenance_type, frequency, scope
- Examples: Team maintains Codebase, Service maintains Infrastructure
```

## Schema Validation Rules

### Entity Validation
1. Each entity must have at least one defining property
2. Entity types should not overlap significantly
3. Properties must be relevant to the entity type
4. Names should be unique within their scope

### Relationship Validation
1. Relationships must connect compatible entity types
2. Direction should follow natural semantic flow
3. Properties should provide meaningful context
4. Relationships should avoid circular dependencies where possible

### Graph Structure Rules
1. Graph should remain connected and navigable
2. Avoid isolated subgraphs
3. Maintain reasonable depth and breadth
4. Ensure clear paths between related concepts