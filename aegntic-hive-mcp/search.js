const natural = require('natural');
const nlp = require('compromise');
const Fuse = require('fuse.js');
const stopword = require('stopword');
const stemmer = require('stemmer');

class SearchEngine {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.topics = new Map();
    this.keywordCache = new Map();
    this.initTopicCategories();
  }

  initTopicCategories() {
    // Define topic categories with associated keywords
    this.topicCategories = {
      'Programming': {
        keywords: ['code', 'programming', 'javascript', 'python', 'java', 'html', 'css', 'react', 'node', 'api', 'database', 'sql', 'function', 'variable', 'loop', 'algorithm', 'debug', 'git', 'github', 'framework', 'library', 'typescript', 'php', 'ruby', 'go', 'rust', 'c++', 'c#', 'swift', 'kotlin'],
        patterns: [/\b(def|function|class|import|export|const|let|var|if|else|for|while|try|catch)\b/gi, /\b\w+\(\)/g]
      },
      'AI/ML': {
        keywords: ['machine learning', 'deep learning', 'neural network', 'ai', 'artificial intelligence', 'model', 'training', 'dataset', 'algorithm', 'tensorflow', 'pytorch', 'sklearn', 'pandas', 'numpy', 'data science', 'nlp', 'computer vision', 'regression', 'classification', 'clustering', 'reinforcement learning', 'gpt', 'transformer', 'chatbot', 'automation'],
        patterns: [/\b(train|model|predict|accuracy|loss|epoch|batch)\b/gi]
      },
      'Web Development': {
        keywords: ['web development', 'frontend', 'backend', 'fullstack', 'responsive', 'mobile', 'ui', 'ux', 'design', 'bootstrap', 'tailwind', 'vue', 'angular', 'svelte', 'express', 'flask', 'django', 'laravel', 'wordpress', 'cms', 'seo', 'optimization', 'performance', 'security', 'authentication', 'authorization'],
        patterns: [/\b(component|props|state|render|router|middleware)\b/gi]
      },
      'Data': {
        keywords: ['data', 'database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'analytics', 'visualization', 'chart', 'graph', 'statistics', 'analysis', 'csv', 'json', 'xml', 'api', 'rest', 'graphql', 'etl', 'pipeline', 'warehouse', 'big data'],
        patterns: [/\b(select|insert|update|delete|join|where|group by|order by)\b/gi]
      },
      'DevOps': {
        keywords: ['devops', 'deployment', 'ci/cd', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'cloud', 'server', 'infrastructure', 'monitoring', 'logging', 'scaling', 'load balancer', 'nginx', 'apache', 'jenkins', 'github actions', 'terraform', 'ansible', 'puppet', 'chef', 'microservices'],
        patterns: [/\b(deploy|build|test|production|staging|environment)\b/gi]
      },
      'Business': {
        keywords: ['business', 'startup', 'entrepreneur', 'marketing', 'sales', 'revenue', 'profit', 'customer', 'client', 'project', 'management', 'strategy', 'planning', 'budget', 'finance', 'investment', 'funding', 'product', 'service', 'market', 'competition', 'growth', 'scaling', 'team', 'leadership'],
        patterns: [/\b(roi|kpi|b2b|b2c|saas|mvp|user|customer)\b/gi]
      },
      'Education': {
        keywords: ['learning', 'education', 'course', 'tutorial', 'study', 'teaching', 'student', 'school', 'university', 'degree', 'certification', 'training', 'skill', 'knowledge', 'research', 'paper', 'thesis', 'academic', 'professor', 'lecture', 'online learning', 'mooc', 'bootcamp'],
        patterns: [/\b(learn|teach|study|explain|understand|example)\b/gi]
      },
      'Creative': {
        keywords: ['design', 'art', 'creative', 'graphics', 'illustration', 'photography', 'video', 'audio', 'music', 'writing', 'content', 'blog', 'story', 'novel', 'poetry', 'painting', 'drawing', 'sketch', 'animation', 'game', 'fiction', 'non-fiction', 'editing', 'publishing'],
        patterns: [/\b(create|design|draw|paint|write|compose|edit)\b/gi]
      },
      'Health': {
        keywords: ['health', 'fitness', 'exercise', 'nutrition', 'diet', 'wellness', 'medical', 'doctor', 'medicine', 'treatment', 'symptom', 'disease', 'therapy', 'mental health', 'psychology', 'mindfulness', 'meditation', 'yoga', 'workout', 'weight', 'calories', 'protein', 'vitamin'],
        patterns: [/\b(healthy|fit|exercise|diet|medical|treatment)\b/gi]
      },
      'Travel': {
        keywords: ['travel', 'trip', 'vacation', 'holiday', 'flight', 'hotel', 'booking', 'destination', 'country', 'city', 'culture', 'tourism', 'adventure', 'explore', 'guide', 'itinerary', 'budget', 'backpack', 'visa', 'passport', 'currency', 'language', 'food', 'restaurant'],
        patterns: [/\b(visit|explore|travel|trip|vacation|destination)\b/gi]
      }
    };
  }

  // Extract keywords from text
  extractKeywords(text, limit = 10) {
    if (this.keywordCache.has(text)) {
      return this.keywordCache.get(text);
    }

    // Tokenize and clean text
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const cleaned = stopword.removeStopwords(tokens);
    
    // Extract entities and important terms using compromise
    const doc = nlp(text);
    const entities = [
      ...doc.people().out('array'),
      ...doc.places().out('array'),
      ...doc.organizations().out('array'),
      ...doc.topics().out('array')
    ];

    // Calculate TF-IDF scores
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(cleaned);
    
    const scores = [];
    cleaned.forEach(token => {
      const score = tfidf.tfidf(token, 0);
      if (score > 0) {
        scores.push({ term: token, score, stemmed: stemmer(token) });
      }
    });

    // Sort by score and combine with entities
    const keywords = [
      ...entities.map(e => ({ term: e, score: 2, type: 'entity' })),
      ...scores.sort((a, b) => b.score - a.score).slice(0, limit)
    ];

    this.keywordCache.set(text, keywords);
    return keywords;
  }

  // Categorize text into topics
  categorizeTopics(text) {
    const topics = [];
    const lowerText = text.toLowerCase();

    for (const [topic, config] of Object.entries(this.topicCategories)) {
      let score = 0;
      let matches = 0;

      // Check keywords
      for (const keyword of config.keywords) {
        if (lowerText.includes(keyword)) {
          score += keyword.length > 5 ? 2 : 1; // Longer keywords get higher scores
          matches++;
        }
      }

      // Check patterns
      for (const pattern of config.patterns) {
        const patternMatches = (text.match(pattern) || []).length;
        score += patternMatches * 1.5;
        matches += patternMatches;
      }

      if (score > 0) {
        topics.push({
          topic,
          score,
          matches,
          confidence: Math.min(score / config.keywords.length, 1)
        });
      }
    }

    return topics.sort((a, b) => b.score - a.score);
  }

  // Advanced search with multiple criteria
  searchConversations(conversations, query, options = {}) {
    const {
      searchType = 'fuzzy', // 'exact', 'fuzzy', 'semantic', 'keyword'
      topics = [],
      keywords = [],
      dateRange = null,
      services = [],
      minScore = 0.3,
      limit = 50
    } = options;

    let results = [...conversations];

    // Filter by services
    if (services.length > 0) {
      results = results.filter(conv => services.includes(conv.service));
    }

    // Filter by date range
    if (dateRange) {
      const { start, end } = dateRange;
      results = results.filter(conv => {
        const date = new Date(conv.updated_at);
        return date >= start && date <= end;
      });
    }

    // Search based on type
    switch (searchType) {
      case 'exact':
        results = this.exactSearch(results, query);
        break;
      case 'fuzzy':
        results = this.fuzzySearch(results, query, minScore);
        break;
      case 'semantic':
        results = this.semanticSearch(results, query, minScore);
        break;
      case 'keyword':
        results = this.keywordSearch(results, keywords.length > 0 ? keywords : [query]);
        break;
    }

    // Filter by topics
    if (topics.length > 0) {
      results = results.filter(conv => {
        const convTopics = this.categorizeTopics(conv.content || conv.title || '');
        return convTopics.some(t => topics.includes(t.topic));
      });
    }

    return results.slice(0, limit);
  }

  exactSearch(conversations, query) {
    const lowerQuery = query.toLowerCase();
    return conversations.filter(conv => {
      const title = (conv.title || '').toLowerCase();
      const content = (conv.content || '').toLowerCase();
      return title.includes(lowerQuery) || content.includes(lowerQuery);
    });
  }

  fuzzySearch(conversations, query, minScore = 0.3) {
    const fuse = new Fuse(conversations, {
      keys: ['title', 'content'],
      threshold: 1 - minScore,
      includeScore: true,
      includeMatches: true
    });

    const results = fuse.search(query);
    return results.map(result => ({
      ...result.item,
      searchScore: 1 - result.score,
      matches: result.matches
    }));
  }

  semanticSearch(conversations, query, minScore = 0.3) {
    const queryKeywords = this.extractKeywords(query);
    const queryTopics = this.categorizeTopics(query);

    return conversations.map(conv => {
      const convKeywords = this.extractKeywords(conv.content || conv.title || '');
      const convTopics = this.categorizeTopics(conv.content || conv.title || '');

      // Calculate keyword similarity
      let keywordScore = 0;
      for (const qkw of queryKeywords) {
        for (const ckw of convKeywords) {
          if (qkw.stemmed === ckw.stemmed || qkw.term === ckw.term) {
            keywordScore += Math.min(qkw.score, ckw.score);
          }
        }
      }

      // Calculate topic similarity
      let topicScore = 0;
      for (const qt of queryTopics) {
        for (const ct of convTopics) {
          if (qt.topic === ct.topic) {
            topicScore += Math.min(qt.confidence, ct.confidence);
          }
        }
      }

      const totalScore = (keywordScore + topicScore) / 2;
      return {
        ...conv,
        searchScore: totalScore,
        matchedKeywords: convKeywords.slice(0, 5),
        matchedTopics: convTopics.slice(0, 3)
      };
    }).filter(conv => conv.searchScore >= minScore)
      .sort((a, b) => b.searchScore - a.searchScore);
  }

  keywordSearch(conversations, keywords) {
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    
    return conversations.filter(conv => {
      const text = ((conv.title || '') + ' ' + (conv.content || '')).toLowerCase();
      return lowerKeywords.some(keyword => text.includes(keyword));
    }).map(conv => {
      const text = ((conv.title || '') + ' ' + (conv.content || '')).toLowerCase();
      const matchCount = lowerKeywords.filter(keyword => text.includes(keyword)).length;
      return {
        ...conv,
        searchScore: matchCount / lowerKeywords.length,
        matchedKeywords: lowerKeywords.filter(keyword => text.includes(keyword))
      };
    }).sort((a, b) => b.searchScore - a.searchScore);
  }

  // Analyze conversation content
  analyzeConversation(conversation) {
    const text = (conversation.title || '') + ' ' + (conversation.content || '');
    
    return {
      keywords: this.extractKeywords(text),
      topics: this.categorizeTopics(text),
      sentiment: this.analyzeSentiment(text),
      summary: this.generateSummary(text),
      entities: this.extractEntities(text),
      wordCount: text.split(/\s+/).length,
      readingTime: Math.ceil(text.split(/\s+/).length / 200) // Assuming 200 words per minute
    };
  }

  analyzeSentiment(text) {
    const tokens = this.tokenizer.tokenize(text);
    const score = this.sentiment.getSentiment(tokens);
    
    let label = 'neutral';
    if (score > 0.1) label = 'positive';
    else if (score < -0.1) label = 'negative';
    
    return { score, label };
  }

  generateSummary(text, maxLength = 200) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 2) return text;

    // Score sentences based on keyword frequency
    const keywords = this.extractKeywords(text, 5);
    const keywordTerms = keywords.map(k => k.term.toLowerCase());

    const scoredSentences = sentences.map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const score = keywordTerms.reduce((acc, keyword) => {
        return acc + (lowerSentence.includes(keyword) ? 1 : 0);
      }, 0);
      return { sentence: sentence.trim(), score };
    });

    // Select top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.sentence);

    const summary = topSentences.join('. ');
    return summary.length > maxLength ? summary.substring(0, maxLength) + '...' : summary;
  }

  extractEntities(text) {
    const doc = nlp(text);
    return {
      people: doc.people().out('array'),
      places: doc.places().out('array'),
      organizations: doc.organizations().out('array'),
      dates: doc.dates().out('array'),
      topics: doc.topics().out('array')
    };
  }

  // Get trending topics from conversations
  getTrendingTopics(conversations, limit = 10) {
    const topicCounts = new Map();
    
    conversations.forEach(conv => {
      const topics = this.categorizeTopics(conv.content || conv.title || '');
      topics.forEach(topic => {
        const current = topicCounts.get(topic.topic) || { count: 0, totalScore: 0 };
        topicCounts.set(topic.topic, {
          count: current.count + 1,
          totalScore: current.totalScore + topic.score
        });
      });
    });

    return Array.from(topicCounts.entries())
      .map(([topic, stats]) => ({
        topic,
        count: stats.count,
        avgScore: stats.totalScore / stats.count,
        percentage: (stats.count / conversations.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Get keyword insights
  getKeywordInsights(conversations, limit = 20) {
    const keywordCounts = new Map();
    
    conversations.forEach(conv => {
      const keywords = this.extractKeywords(conv.content || conv.title || '');
      keywords.forEach(keyword => {
        const current = keywordCounts.get(keyword.term) || { count: 0, totalScore: 0 };
        keywordCounts.set(keyword.term, {
          count: current.count + 1,
          totalScore: current.totalScore + keyword.score
        });
      });
    });

    return Array.from(keywordCounts.entries())
      .map(([keyword, stats]) => ({
        keyword,
        count: stats.count,
        avgScore: stats.totalScore / stats.count,
        percentage: (stats.count / conversations.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

module.exports = SearchEngine;
