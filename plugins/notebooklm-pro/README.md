# NotebookLM Pro - Advanced Research & Analysis

> **Conversational Research with Session-Based RAG and Multi-Source Synthesis**

[![npm version](https://badge.fury.io/js/%40aegntic%2Fnotebooklm-pro.svg)](https://www.npmjs.com/package/@aegntic/notebooklm-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

NotebookLM Pro is a powerful research tool that combines Google's NotebookLM capabilities with advanced features for comprehensive document analysis, knowledge synthesis, and conversational research workflows.

## 🎯 What Makes It "Pro"

### **Session-Based RAG** 🧠
Unlike stateless queries, NotebookLM Pro maintains conversation context across multiple questions:
```
Q1: "What are the main findings?"
Q2: "How does that relate to the methodology?" ← Context from Q1
Q3: "What are the limitations?" ← Context from Q1 & Q2
```

### **Multi-Source Synthesis** 🔗
Analyze and synthesize information across multiple documents:
- **Compare** different sources
- **Identify** contradictions and agreements
- **Create** unified knowledge bases
- **Generate** cross-document insights

### **Gemini 2.5 Integration** 🤖
Powered by Google's most advanced model:
- **1M token context** - Analyze entire books
- **Real-time grounding** - Web search integration
- **Multi-modal** - Text, images, audio, video
- **Citations** - Source-verified answers

## 🚀 Core Features

### **1. Document Upload & Processing**
```bash
# Upload single document
notebooklm upload ./research-paper.pdf

# Upload multiple documents
notebooklm upload ./docs/*.pdf --collection "Project X Research"

# Web sources
notebooklm add-url https://example.com/article --tag "reference"

# YouTube videos
notebooklm add-video https://youtube.com/watch?v=xxx --transcribe
```

**Supported Formats:**
- PDF (text extraction + OCR)
- Word (DOC, DOCX)
- PowerPoint (PPT, PPTX)
- Excel (XLS, XLSX)
- Markdown (MD)
- Text files (TXT, CSV, JSON)
- Web pages (HTML)
- YouTube videos (auto-transcribe)

### **2. Conversational Research**
```bash
# Start interactive session
notebooklm chat --notebook "Project X"

# Ask specific question
notebooklm ask "What are the key takeaways?" --notebook "Project X"

# Deep dive with follow-ups
notebooklm ask "Expand on the methodology section" --context
```

**Session Features:**
- ✅ Context preservation across questions
- ✅ Citation tracking with source references
- ✅ Multi-turn conversations
- ✅ Session export (JSON, Markdown)

### **3. Knowledge Synthesis**
```bash
# Generate summary
notebooklm synthesize --notebook "Project X" --format executive-summary

# Compare sources
notebooklm compare --sources doc1.pdf,doc2.pdf --topic "methodology"

# Find contradictions
notebooklm analyze --notebook "Project X" --detect-contradictions

# Create FAQ
notebooklm generate-faq --notebook "Project X" --questions 20
```

### **4. Audio Generation**
```bash
# Create podcast from research
notebooklm audio --notebook "Project X" --format podcast --voices 2

# Generate deep dive
notebooklm audio --notebook "Project X" --format deep-dive --length 30min

# Export audio
notebooklm export --notebook "Project X" --format mp3
```

## 🎮 Usage Examples

### **Research Workflow**
```bash
# 1. Create research notebook
notebooklm create "AI Ethics Research" --description "Analysis of ethical frameworks"

# 2. Add sources
notebooklm upload ./papers/*.pdf --notebook "AI Ethics Research"
notebooklm add-url https://ai-ethics.org/report --notebook "AI Ethics Research"

# 3. Interactive research session
notebooklm chat --notebook "AI Ethics Research"
> "What are the main ethical frameworks discussed?"
> "How do these frameworks handle autonomous weapons?"
> "Compare the utilitarian vs deontological approaches"

# 4. Generate synthesis
notebooklm synthesize --notebook "AI Ethics Research" --output ./ethics-report.md
```

### **Competitive Analysis**
```bash
# Upload competitor materials
notebooklm upload ./competitor-*.pdf --notebook "Competitive Analysis"

# Compare features
notebooklm compare --notebook "Competitive Analysis" --aspect features

# Identify gaps
notebooklm analyze --notebook "Competitive Analysis" --find-gaps

# Generate strategy doc
notebooklm generate --notebook "Competitive Analysis" --template strategy-brief
```

### **Learning & Study**
```bash
# Create study notebook
notebooklm create "Machine Learning Study" --type educational

# Upload course materials
notebooklm upload ./lectures/*.pdf ./textbook.pdf --notebook "ML Study"

# Generate study guide
notebooklm study-guide --notebook "ML Study" --format flashcards

# Create audio summary for commute
notebooklm audio --notebook "ML Study" --format summary --length 15min
```

## 🛠️ Installation

```bash
# Global installation
npm install -g @aegntic/notebooklm-pro

# Or use with npx
npx @aegntic/notebooklm-pro
```

## 🔐 Authentication

NotebookLM Pro uses Google authentication:

```bash
# Authenticate
notebooklm auth

# Check status
notebooklm status

# Switch accounts
notebooklm auth --switch
```

**Security:**
- OAuth 2.0 with PKCE
- Tokens stored in OS keychain
- Automatic token refresh
- Multi-account support

## 📊 Advanced Features

### **Vector Database Integration**
Automatic semantic indexing for fast retrieval:
```bash
# Enable vector search
notebooklm index --notebook "Project X" --vectors

# Semantic queries
notebooklm search "concepts related to neural networks" --semantic
```

### **Export & Integration**
```bash
# Export formats
notebooklm export --notebook "Project X" --format markdown
notebooklm export --notebook "Project X" --format pdf
notebooklm export --notebook "Project X" --format json

# API access
notebooklm server --port 3000
# Access via: http://localhost:3000/api/notebooks
```

### **Collaboration**
```bash
# Share notebook
notebooklm share --notebook "Project X" --email collaborator@example.com

# Team workspace
notebooklm workspace create "Research Team" --members alice,bob,charlie

# Sync changes
notebooklm sync --notebook "Project X"
```

## 🎯 Use Cases

### **Academic Research**
- Literature reviews
- Thesis research
- Cross-paper analysis
- Citation management

### **Business Intelligence**
- Market research
- Competitor analysis
- Report synthesis
- Strategy development

### **Content Creation**
- Research articles
- Podcast scripts
- Educational content
- Documentation

### **Legal & Compliance**
- Contract analysis
- Regulation research
- Case law synthesis
- Compliance checking

## 🔌 Integration with @aegntic Ecosystem

### **UltraPlan Pro**
```bash
# Use research in strategic planning
ultraplan pro execute "Market entry strategy based on: $(notebooklm synthesize --notebook 'Market Research' --format brief)"
```

### **Red Team Tribunal**
```bash
# Validate research findings
red-team-tribunal --target "$(notebooklm export --notebook 'Research' --format json)"
```

### **Google Labs Extension**
```bash
# Create visual presentations from research
glabs stitch "$(notebooklm synthesize --notebook 'Research' --format visual-brief)"
```

## 📝 Configuration

### **Config File** (`~/.notebooklm/config.json`)
```json
{
  "defaultNotebook": "General Research",
  "autoIndex": true,
  "citationFormat": "APA",
  "audio": {
    "defaultVoice": "female-1",
    "speed": 1.0
  },
  "export": {
    "defaultFormat": "markdown",
    "includeCitations": true
  },
  "sync": {
    "enabled": true,
    "interval": "1h"
  }
}
```

## 🐛 Troubleshooting

### **Authentication Issues**
```bash
# Reset auth
notebooklm auth --reset
notebooklm auth
```

### **Large Files**
```bash
# Process in chunks
notebooklm upload ./large-book.pdf --chunk-size 50
```

### **Session Recovery**
```bash
# Restore interrupted session
notebooklm restore --session-id abc-123
```

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🔗 Links

- **NPM**: https://www.npmjs.com/package/@aegntic/notebooklm-pro
- **Repository**: https://github.com/aegntic/notebooklm-pro
- **Documentation**: https://docs.aegntic.com/notebooklm-pro

---

**Built with ❤️ by the @aegntic team**

*Advanced research powered by conversational AI*