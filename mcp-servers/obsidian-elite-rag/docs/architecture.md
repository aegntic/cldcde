# Elite Knowledge Architecture

## Core Design Principles

### 1. Hierarchical Organization (FPEF-Verified)
```
00-Core/           # Foundational, timeless knowledge
01-Projects/       # Active work with clear outcomes
02-Research/       # Learning and exploration areas
03-Workflows/      # Reusable processes and patterns
04-AI-Paired/      # Claude Code interactions and outputs
05-Resources/      # External references and materials
06-Meta/           # Knowledge about the system itself
07-Archive/        # Historical knowledge (timestamped)
08-Templates/      # Reusable note structures
09-Links/          # External connections and references
```

### 2. Linking Strategy

**Semantic Linking Patterns:**
- `[[Concept]]` - Primary relationship
- `[[Concept#Subtopic]]` - Granular targeting
- `[[Concept|Alias]]` - Alternative naming
- `[[Concept]]` - Bidirectional linking
- `[[]]` - Placeholder for future connections

**Contextual Link Types:**
- `→` (Flow): Sequential progression
- `⇢` (Suggests): Potential connection
- `⇒` (Implies): Logical implication
- `⊕` (Combines): Integration point
- `⊖` (Contradicts): Tension point

### 3. Tagging System

**Hierarchical Tags:**
```
#domain/tech/ai/ml
#domain/workflow/automation
#domain/research/psychology
#status/active/learning
#status/archived/complete
#priority/critical/urgent
#context/work/project-x
#method/rag/semantic-search
#method/workflow/kanban
```

**Metadata Tags:**
```
#type/concept
#type/process
#type/resource
#type/template
#type/question
#type/insight
```

### 4. Note Naming Convention

**Format:** `YYYY-MM-DD - Descriptive Title [Context]`

**Examples:**
- `2024-10-26 - Advanced RAG Techniques [AI/ML]`
- `2024-10-26 - Project Phoenix Architecture [Work/Active]`
- `2024-10-26 - Learning: Graph Databases [Research]`

**Special Prefixes:**
- `!` - Action items: `!2024-10-26 - Review Documentation`
- `?` - Questions: `?2024-10-26 - How to Optimize Vector Search`
- `*` - Important: `*2024-10-26 - Core Architecture Decision`
- `+` - Insights: `+2024-10-26 - Connection Between X and Y`

### 5. Content Structure Templates

**Standard Note Structure:**
```markdown
# Title

**Context:** Brief description of this note's purpose and relationships
**Last Updated:** 2024-10-26
**Status:** #status/active/learning

## Summary
One-sentence summary and key takeaway

## Core Content
Main body with structured sections

## Connections
- Related: [[Concept A]], [[Concept B]]
- Contradicts: [[Concept C]]
- Implies: [[Concept D]]

## Actions
- [ ] Follow-up on X
- [ ] Review Y

## Questions
- How does this relate to Z?

## Metadata
- **Tags:** #domain/tech #method/rag
- **Created:** 2024-10-26
- **Modified:** 2024-10-26
```

### 6. Knowledge Graph Optimization

**Link Density Principles:**
- Each concept should have 3-7 primary connections
- Avoid "orphan" notes (no incoming links)
- Create "hub" notes for central concepts
- Use MOCs (Maps of Content) for topic organization

**MOC Structure:**
```markdown
# MOC: Artificial Intelligence

## Core Concepts
- [[Machine Learning]]
- [[Neural Networks]]
- [[Natural Language Processing]]

## Applications
- [[Computer Vision]]
- [[Recommendation Systems]]
- [[RAG Systems]]

## Research Areas
- [[Transformer Architecture]]
- [[Vector Databases]]
- [[Knowledge Graphs]]

## Related MOCs
- [[MOC: Data Science]]
- [[MOC: Software Engineering]]
```

### 7. Contextual Layering

**Layer 1: Core Knowledge**
- Fundamental concepts and definitions
- Timeless principles and theories
- Domain foundations

**Layer 2: Applied Knowledge**
- Implementation details and examples
- Practical applications and case studies
- Process documentation

**Layer 3: Meta-Knowledge**
- Learning journeys and insights
- Questions and exploration areas
- Personal reflections and synthesis

**Layer 4: Connections**
- Cross-domain relationships
- Pattern recognition
- Higher-level abstractions

### 8. Retrieval Optimization

**Search-Friendly Content:**
- Clear, descriptive titles
- Consistent terminology
- Keyword optimization
- Context-rich summaries

**Indexing Strategy:**
- Use tags for broad categorization
- Use links for specific relationships
- Use aliases for terminology variations
- Use properties for structured metadata

This architecture ensures optimal RAG performance by creating a richly interconnected, hierarchically organized knowledge base that supports multiple retrieval strategies and context synthesis.