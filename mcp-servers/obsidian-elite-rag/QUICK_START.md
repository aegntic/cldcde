# Quick Start Guide - Elite Obsidian RAG System

## 🚀 5-Minute Setup

### Prerequisites
- Obsidian (installed)
- Docker (for vector database)
- Python 3.9+
- Node.js 18+
- OpenAI API key (for embeddings)

### 1. Initialize Your Vault
```bash
# Clone or download this system
cd obsidian-elite-rag

# Create your elite vault
./scripts/setup-vault.sh /path/to/your/vault

# Open in Obsidian
obsidian /path/to/your/vault
```

### 2. Start the RAG Engine
```bash
# Install dependencies
pip install -r requirements.txt
npm install

# Start Qdrant vector database
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant:latest

# Start the RAG engine
export VAULT_PATH="/path/to/your/vault"
python3 integrations/rag-engine.py --ingest --vault "$VAULT_PATH"
```

### 3. Configure Claude Integration
```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# Test the system
python3 integrations/rag-engine.py --vault "$VAULT_PATH" --query "How does this RAG system work?"
```

## 🎯 First Day Workflow

### Morning Setup (5 minutes)
1. Open Obsidian to your vault
2. Create daily plan: `04-AI-Paired/Daily Plan - YYYY-MM-DD`
3. Review yesterday's AI-Paired notes
4. Set 3 key focus areas

### Throughout the Day
1. **Quick Capture**: Use `04-AI-Paired/Quick Capture` for instant notes
2. **AI Integration**: Use Claude Code with context:
   ```bash
   ./scripts/claude-context.sh /path/to/vault "Your question here"
   ```
3. **Knowledge Building**: Link new notes to existing concepts
4. **Template Usage**: Use templates from `08-Templates/`

### Evening Review (10 minutes)
1. Review all notes created today
2. Create synthesis: `04-AI-Paired/Daily Synthesis - YYYY-MM-DD`
3. Update MOCs with new connections
4. Plan tomorrow's focus

## 🔧 Essential Commands

### Claude Integration
```bash
# Basic query with context
./scripts/claude-context.sh /path/to/vault "Your query"

# Project-specific help
./scripts/claude-context.sh /path/to/vault "How to implement X?" "Project Name"

# Research assistance
./scripts/claude-context.sh /path/to/vault "Explain concept Y" "" "research"
```

### RAG Engine
```bash
# Ingest/Update vault
python3 integrations/rag-engine.py --vault /path/to/vault --ingest

# Query the system
python3 integrations/rag-engine.py --vault /path/to/vault --query "Your question"

# Domain-specific query
python3 integrations/rag-engine.py --vault /path/to/vault --query "Technical question" --query-type technical
```

## 📁 Vault Structure Navigation

```
00-Core/           # 🧠 Foundational knowledge
01-Projects/       # 🚀 Active work  
02-Research/       # 🔬 Learning areas
03-Workflows/      # ⚙️ Reusable processes
04-AI-Paired/      # 🤖 Claude interactions
05-Resources/      # 📚 External references
06-Meta/           # 📊 System knowledge
07-Archive/        # 📦 Historical data
08-Templates/      # 📋 Note structures
09-Links/          # 🔗 External connections
```

## 🏷️ Tagging System

### Core Tags
- `#domain/tech` - Technical topics
- `#domain/research` - Research topics  
- `#domain/workflow` - Workflow topics
- `#status/active` - Active items
- `#status/learning` - Learning in progress
- `#type/concept` - Concept notes
- `#type/process` - Process documentation

### Context Tags
- `#context/work/project-name` - Work context
- `#context/learning/topic` - Learning context
- `#method/rag/semantic-search` - Method used

## 🎨 Note Templates

### Quick Note
Title: `YYYY-MM-DD - Note Title [Context]`
Use: Standard template from `08-Templates/Standard Note.md`

### Project
Title: `Project Name - Overview [Project]`
Use: Project template from `08-Templates/Project.md`

### Research
Title: `Research Topic [Research]`
Use: Research template from `08-Templates/Research.md`

## 🔄 Daily Workflow Example

### Morning
```
# 04-AI-Paired/Daily Plan - 2024-10-26

## Focus Areas
1. Complete user authentication feature
2. Research vector database optimizations
3. Plan knowledge management workshop

## Context Loaded
- Project: Phoenix API
- Domain: Technical Development
- Recent: Authentication patterns

## Questions for Claude
- What are the best practices for JWT refresh tokens?
- How can I optimize vector search performance?
```

### During Work
```
# 04-AI-Paired/Quick Capture - JWT Implementation Ideas

## Key Insight
The refresh token rotation pattern provides better security than static refresh tokens.

## Connection
Related to [[Authentication Patterns]] and [[Security Best Practices]]

## Action
- [ ] Implement token rotation in Phoenix API
- [ ] Update security documentation
```

### Evening
```
# 04-AI-Paired/Daily Synthesis - 2024-10-26

## Key Learnings
1. Token rotation prevents refresh token reuse attacks
2. Vector indexing can be optimized with HNSW graphs
3. Knowledge management requires daily maintenance

## Connections Made
- JWT rotation ↔ Security Architecture
- Vector optimization ↔ Search Performance
- Daily maintenance ↔ Knowledge Quality

## Tomorrow's Focus
1. Implement token rotation
2. Benchmark vector indexes
3. Create knowledge maintenance workflow
```

## 🚨 Troubleshooting

### Common Issues

**RAG Engine Not Starting**
```bash
# Check Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker restart qdrant
```

**Claude Integration Not Working**
```bash
# Check API key
echo $OPENAI_API_KEY

# Test connection
python3 -c "import openai; print(openai.api_key)"
```

**Vault Not Indexed**
```bash
# Re-index vault
python3 integrations/rag-engine.py --vault /path/to/vault --ingest

# Check logs
tail -f logs/rag-engine.log
```

## 📈 Next Steps

### Week 1: Foundation
- [ ] Complete daily workflow for 5 days
- [ ] Create 10 core concept notes
- [ ] Set up automation scripts

### Week 2: Integration  
- [ ] Master Claude Code integration
- [ ] Automate knowledge processing
- [ ] Create custom templates

### Week 3: Optimization
- [ ] Fine-tune RAG retrieval
- [ ] Implement advanced workflows
- [ ] Set up performance monitoring

### Week 4: Mastery
- [ ] Create custom automation rules
- [ ] Integrate external services
- [ ] Share knowledge with team

## 🎯 Pro Tips

1. **Link Liberally**: Create connections between concepts whenever possible
2. **Use Templates**: Maintain consistency with provided templates
3. **Daily Reviews**: Never skip the daily synthesis process
4. **Context First**: Always note the context when capturing information
5. **AI Partnership**: Use Claude as a thinking partner, not just a tool

## 📞 Support

- **Documentation**: Check `/docs/` folder for detailed guides
- **Templates**: Customize templates in `08-Templates/`
- **Configuration**: Modify settings in `config/automation-config.yaml`
- **Community**: Join the Discord community for support

---

**Welcome to your elite second brain! 🧠✨**

This system will transform how you manage knowledge and work with AI. Start small, stay consistent, and watch your knowledge graph grow into a powerful cognitive asset.