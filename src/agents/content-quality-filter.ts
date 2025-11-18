import { z } from 'zod';

// Content quality levels
export enum ContentQuality {
  INNOVATIVE = 'innovative',
  ADVANCED = 'advanced',
  INTERMEDIATE = 'intermediate',
  BASIC = 'basic',
  LOW_QUALITY = 'low_quality',
  SPAM = 'spam'
}

// Platform types
export enum Platform {
  GITHUB = 'github',
  YOUTUBE = 'youtube',
  X = 'x',
  BLOG = 'blog',
  REDDIT = 'reddit',
  HACKERNEWS = 'hackernews'
}

// Content analysis result
export interface ContentAnalysis {
  quality: ContentQuality;
  score: number; // 0-100
  signals: QualitySignals;
  reasons: string[];
  confidence: number; // 0-1
  platformSpecificScore: number;
  mlFeatures: MLFeatures;
}

// Quality signals detected
export interface QualitySignals {
  technicalDepth: number;
  innovation: number;
  uniqueness: number;
  codeComplexity: number;
  academicReferences: number;
  industryRelevance: number;
  authorCredibility: number;
  communityEngagement: number;
  contentFreshness: number;
}

// ML-ready feature vector
export interface MLFeatures {
  textComplexity: number;
  vocabularyDiversity: number;
  sentenceVariability: number;
  technicalTermDensity: number;
  codeSnippetQuality: number;
  externalReferences: number;
  structuralComplexity: number;
  topicNovelty: number;
}

// Filter configuration
export interface FilterConfig {
  minQualityScore: number;
  excludeQualities: ContentQuality[];
  platformRules: Map<Platform, PlatformConfig>;
  keywordWeights: Map<string, number>;
  patternPenalties: Map<RegExp, number>;
  mlModelPath?: string;
  enableLearning: boolean;
}

// Platform-specific configuration
export interface PlatformConfig {
  minScore: number;
  requiredSignals: (keyof QualitySignals)[];
  customRules: ((content: ContentInput) => number)[];
  blacklistPatterns: RegExp[];
}

// Input content structure
export interface ContentInput {
  title: string;
  description?: string;
  content?: string;
  platform: Platform;
  author?: string;
  metadata?: Record<string, any>;
  url?: string;
  timestamp?: Date;
}

// Feedback for learning
export interface QualityFeedback {
  contentId: string;
  actualQuality: ContentQuality;
  wasCorrect: boolean;
  userFeedback?: string;
}

export class ContentQualityFilter {
  private config: FilterConfig;
  private keywordPatterns: Map<ContentQuality, RegExp[]>;
  private complexityAnalyzer: ComplexityAnalyzer;
  private innovationDetector: InnovationDetector;
  private platformAnalyzers: Map<Platform, PlatformAnalyzer>;
  private learningData: QualityFeedback[] = [];

  constructor(config: FilterConfig) {
    this.config = config;
    this.keywordPatterns = this.initializeKeywordPatterns();
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.innovationDetector = new InnovationDetector();
    this.platformAnalyzers = this.initializePlatformAnalyzers();
  }

  /**
   * Main filtering method - analyzes content and returns quality assessment
   */
  async analyzeContent(content: ContentInput): Promise<ContentAnalysis> {
    // Stage 1: Quick rejection based on blacklist patterns
    const blacklistScore = this.checkBlacklistPatterns(content);
    if (blacklistScore > 0.8) {
      return this.createLowQualityResult('Matches spam/low-quality patterns', blacklistScore);
    }

    // Stage 2: Keyword and pattern analysis
    const keywordAnalysis = this.analyzeKeywords(content);
    
    // Stage 3: Content complexity analysis
    const complexityScore = this.complexityAnalyzer.analyze(content);
    
    // Stage 4: Innovation detection
    const innovationScore = await this.innovationDetector.detect(content);
    
    // Stage 5: Platform-specific analysis
    const platformScore = await this.platformAnalyzers.get(content.platform)?.analyze(content) || 0;
    
    // Stage 6: Generate quality signals
    const signals = this.generateQualitySignals(content, keywordAnalysis, complexityScore, innovationScore);
    
    // Stage 7: Calculate ML features
    const mlFeatures = this.extractMLFeatures(content, signals);
    
    // Stage 8: Final scoring and classification
    const finalScore = this.calculateFinalScore(signals, platformScore, mlFeatures);
    const quality = this.classifyQuality(finalScore, signals);
    
    // Stage 9: Generate reasoning
    const reasons = this.generateReasons(quality, signals, keywordAnalysis);

    return {
      quality,
      score: finalScore,
      signals,
      reasons,
      confidence: this.calculateConfidence(signals, mlFeatures),
      platformSpecificScore: platformScore,
      mlFeatures
    };
  }

  /**
   * Check content against blacklist patterns
   */
  private checkBlacklistPatterns(content: ContentInput): number {
    const text = this.getContentText(content).toLowerCase();
    let penaltyScore = 0;

    // Common low-quality patterns
    const lowQualityPatterns = [
      /^(how to|tutorial|guide|getting started|introduction to|basics of)/i,
      /^(5|7|10|top \d+) (best|ways|tips|tricks)/i,
      /^(beginner'?s?|newbie|noob|starter) guide/i,
      /^(quick|easy|simple) (tutorial|guide|way)/i,
      /for beginners|for dummies|made easy/i,
      /step[- ]by[- ]step|click here|learn more/i,
      /^what is|^why you should|^how to install/i
    ];

    // Auto-generated content patterns
    const autoGenPatterns = [
      /automatically generated|auto[- ]generated/i,
      /this (post|article|content) was (created|generated) by/i,
      /\[ad\]|\[sponsored\]|\[affiliate\]/i,
      /️⃣{3,}|💰{3,}|🔥{3,}/  // Excessive emoji spam
    ];

    // Check patterns
    [...lowQualityPatterns, ...autoGenPatterns].forEach(pattern => {
      if (pattern.test(text)) {
        penaltyScore += 0.3;
      }
    });

    // Platform-specific patterns
    const platformPatterns = this.config.platformRules.get(content.platform)?.blacklistPatterns || [];
    platformPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        penaltyScore += 0.4;
      }
    });

    return Math.min(penaltyScore, 1);
  }

  /**
   * Analyze keywords and phrases for quality indicators
   */
  private analyzeKeywords(content: ContentInput): KeywordAnalysis {
    const text = this.getContentText(content).toLowerCase();
    const analysis: KeywordAnalysis = {
      positiveSignals: 0,
      negativeSignals: 0,
      technicalTerms: 0,
      innovativeTerms: 0
    };

    // Positive quality indicators
    const positiveKeywords = [
      // Technical depth
      /algorithm|optimization|architecture|implementation/gi,
      /performance|scalability|distributed|concurrent/gi,
      /abstract syntax tree|ast|compiler|interpreter/gi,
      /machine learning|neural network|deep learning/gi,
      /cryptography|encryption|security|authentication/gi,
      
      // Innovation indicators
      /novel approach|innovative|breakthrough|cutting[- ]edge/gi,
      /research|paper|publication|academic/gi,
      /experiment|hypothesis|methodology|analysis/gi,
      /benchmark|comparison|evaluation|metrics/gi,
      
      // Advanced concepts
      /design pattern|architectural pattern|microservice/gi,
      /event[- ]driven|reactive|functional programming/gi,
      /graph theory|computational complexity|big o/gi,
      /quantum|blockchain|edge computing|webassembly/gi
    ];

    // Negative quality indicators
    const negativeKeywords = [
      /hello world|todo app|calculator app/gi,
      /copy[- ]paste|quick fix|hack|workaround/gi,
      /outdated|deprecated|old version|legacy/gi,
      /clickbait|must read|you won't believe/gi,
      /affiliate|sponsored|advertisement|promo/gi
    ];

    // Count matches
    positiveKeywords.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        analysis.positiveSignals += matches.length;
        analysis.technicalTerms += matches.length * 0.5;
      }
    });

    negativeKeywords.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        analysis.negativeSignals += matches.length;
      }
    });

    // Detect innovative terms
    const innovativePatterns = [
      /first[- ]of[- ]its[- ]kind|pioneering|groundbreaking/gi,
      /patent|intellectual property|proprietary/gi,
      /state[- ]of[- ]the[- ]art|latest|emerging/gi
    ];

    innovativePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        analysis.innovativeTerms += matches.length;
      }
    });

    return analysis;
  }

  /**
   * Generate quality signals from various analyses
   */
  private generateQualitySignals(
    content: ContentInput,
    keywordAnalysis: KeywordAnalysis,
    complexityScore: number,
    innovationScore: number
  ): QualitySignals {
    const text = this.getContentText(content);
    
    return {
      technicalDepth: this.calculateTechnicalDepth(text, keywordAnalysis),
      innovation: innovationScore,
      uniqueness: this.calculateUniqueness(text),
      codeComplexity: this.analyzeCodeComplexity(content),
      academicReferences: this.countAcademicReferences(text),
      industryRelevance: this.assessIndustryRelevance(content),
      authorCredibility: this.assessAuthorCredibility(content),
      communityEngagement: this.assessCommunityEngagement(content),
      contentFreshness: this.assessContentFreshness(content)
    };
  }

  /**
   * Calculate technical depth score
   */
  private calculateTechnicalDepth(text: string, keywords: KeywordAnalysis): number {
    const baseScore = keywords.technicalTerms / Math.max(text.split(/\s+/).length / 100, 1);
    const complexityBonus = keywords.positiveSignals * 0.1;
    const negativePenalty = keywords.negativeSignals * 0.15;
    
    return Math.max(0, Math.min(100, (baseScore + complexityBonus - negativePenalty) * 10));
  }

  /**
   * Calculate content uniqueness
   */
  private calculateUniqueness(text: string): number {
    // Check for common phrases and clichés
    const clichePatterns = [
      /in this (article|post|tutorial)/gi,
      /as we all know|obviously|clearly/gi,
      /without further ado|let's (dive|jump) in/gi,
      /stay tuned|more to come|to be continued/gi
    ];

    let clicheCount = 0;
    clichePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) clicheCount += matches.length;
    });

    // Calculate vocabulary diversity
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const diversity = uniqueWords.size / words.length;

    const clichePenalty = Math.min(clicheCount * 5, 50);
    const diversityScore = diversity * 100;

    return Math.max(0, Math.min(100, diversityScore - clichePenalty));
  }

  /**
   * Analyze code complexity in content
   */
  private analyzeCodeComplexity(content: ContentInput): number {
    const text = this.getContentText(content);
    
    // Extract code blocks
    const codeBlockPattern = /```[\s\S]*?```|`[^`]+`/g;
    const codeBlocks = text.match(codeBlockPattern) || [];
    
    if (codeBlocks.length === 0) return 0;

    let complexityScore = 0;

    codeBlocks.forEach(block => {
      // Remove markdown backticks
      const code = block.replace(/```\w*\n?|```|`/g, '');
      
      // Check for complex patterns
      const complexPatterns = [
        /class\s+\w+|interface\s+\w+/g,  // OOP
        /async\s+function|await\s+/g,     // Async programming
        /=>/g,                            // Arrow functions
        /\.\s*map\s*\(|\.\s*filter\s*\(|\.\s*reduce\s*\(/g,  // Functional programming
        /try\s*{[\s\S]*?catch/g,          // Error handling
        /import\s+{[\s\S]*?}/g,           // Module imports
        /export\s+(default|class|function)/g,  // Exports
        /generic|<\w+>/g,                 // Generics
        /implements|extends/g,            // Inheritance
      ];

      complexPatterns.forEach(pattern => {
        const matches = code.match(pattern);
        if (matches) {
          complexityScore += matches.length * 2;
        }
      });

      // Penalize trivial code
      const trivialPatterns = [
        /console\.log/g,
        /alert\(/g,
        /document\.write/g,
        /var\s+\w+\s*=\s*['"\d]/g  // Simple variable assignments
      ];

      trivialPatterns.forEach(pattern => {
        const matches = code.match(pattern);
        if (matches) {
          complexityScore -= matches.length;
        }
      });
    });

    return Math.max(0, Math.min(100, complexityScore * 5));
  }

  /**
   * Count academic references
   */
  private countAcademicReferences(text: string): number {
    const referencePatterns = [
      /\[\d+\]/g,                       // [1] style references
      /\(\w+\s+et\s+al\.\s*,?\s*\d{4}\)/g,  // (Author et al., 2024)
      /doi:\s*10\.\d+/gi,               // DOI references
      /arxiv:\d+\.\d+/gi,               // arXiv papers
      /isbn[:\s]+[\d-]+/gi,             // ISBN references
    ];

    let count = 0;
    referencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });

    return Math.min(100, count * 10);
  }

  /**
   * Assess industry relevance
   */
  private assessIndustryRelevance(content: ContentInput): number {
    const text = this.getContentText(content).toLowerCase();
    
    const industryTerms = [
      // Current tech trends
      /artificial intelligence|machine learning|deep learning/g,
      /cloud native|kubernetes|docker|containerization/g,
      /serverless|edge computing|microservices/g,
      /web3|blockchain|cryptocurrency|nft/g,
      /quantum computing|quantum algorithm/g,
      
      // Industry practices
      /devops|ci\/cd|continuous integration/g,
      /agile|scrum|kanban|lean/g,
      /test[- ]driven development|tdd|bdd/g,
      /domain[- ]driven design|ddd/g,
      
      // Enterprise concerns
      /scalability|high availability|fault tolerance/g,
      /security|encryption|authentication|authorization/g,
      /compliance|gdpr|hipaa|sox/g,
      /monitoring|observability|metrics|logging/g
    ];

    let relevanceScore = 0;
    industryTerms.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        relevanceScore += matches.length * 3;
      }
    });

    return Math.min(100, relevanceScore);
  }

  /**
   * Assess author credibility
   */
  private assessAuthorCredibility(content: ContentInput): number {
    if (!content.author || !content.metadata) return 50; // Neutral if no data

    let score = 50; // Base score

    // Check for credibility indicators
    const { metadata } = content;
    
    // GitHub specific
    if (content.platform === Platform.GITHUB && metadata.authorStats) {
      const stats = metadata.authorStats;
      if (stats.followers > 1000) score += 20;
      else if (stats.followers > 100) score += 10;
      
      if (stats.contributions > 1000) score += 15;
      else if (stats.contributions > 100) score += 7;
      
      if (stats.stars > 10000) score += 15;
      else if (stats.stars > 1000) score += 7;
    }

    // Check for professional indicators
    const authorLower = content.author.toLowerCase();
    const credibilityMarkers = [
      /phd|professor|researcher/,
      /engineer|developer|architect/,
      /founder|cto|ceo|lead/,
      /google|microsoft|amazon|meta|apple/,
      /university|institute|laboratory/
    ];

    credibilityMarkers.forEach(pattern => {
      if (pattern.test(authorLower)) {
        score += 5;
      }
    });

    return Math.min(100, score);
  }

  /**
   * Assess community engagement
   */
  private assessCommunityEngagement(content: ContentInput): number {
    if (!content.metadata) return 0;

    const { metadata } = content;
    let score = 0;

    // Platform-specific engagement metrics
    switch (content.platform) {
      case Platform.GITHUB:
        if (metadata.stars) score += Math.min(metadata.stars / 10, 30);
        if (metadata.forks) score += Math.min(metadata.forks / 5, 20);
        if (metadata.issues) score += Math.min(metadata.issues / 10, 10);
        if (metadata.contributors) score += Math.min(metadata.contributors * 2, 20);
        if (metadata.commits) score += Math.min(metadata.commits / 100, 20);
        break;

      case Platform.YOUTUBE:
        if (metadata.views) score += Math.min(metadata.views / 10000, 30);
        if (metadata.likes) score += Math.min(metadata.likes / 1000, 20);
        if (metadata.comments) score += Math.min(metadata.comments / 100, 20);
        if (metadata.likeRatio && metadata.likeRatio > 0.95) score += 30;
        break;

      case Platform.X:
        if (metadata.retweets) score += Math.min(metadata.retweets / 10, 30);
        if (metadata.likes) score += Math.min(metadata.likes / 20, 30);
        if (metadata.replies) score += Math.min(metadata.replies / 5, 20);
        if (metadata.impressions) score += Math.min(metadata.impressions / 10000, 20);
        break;

      case Platform.REDDIT:
        if (metadata.upvotes) score += Math.min(metadata.upvotes / 100, 40);
        if (metadata.comments) score += Math.min(metadata.comments / 10, 30);
        if (metadata.awards) score += Math.min(metadata.awards * 10, 30);
        break;
    }

    return Math.min(100, score);
  }

  /**
   * Assess content freshness
   */
  private assessContentFreshness(content: ContentInput): number {
    if (!content.timestamp) return 50; // Neutral if no timestamp

    const now = new Date();
    const contentDate = new Date(content.timestamp);
    const ageInDays = (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24);

    // Scoring based on age
    if (ageInDays < 7) return 100;        // Less than a week old
    if (ageInDays < 30) return 90;        // Less than a month old
    if (ageInDays < 90) return 70;        // Less than 3 months old
    if (ageInDays < 180) return 50;       // Less than 6 months old
    if (ageInDays < 365) return 30;       // Less than a year old
    
    // Check if content mentions current year or recent technologies
    const text = this.getContentText(content);
    const currentYear = now.getFullYear();
    
    if (text.includes(currentYear.toString())) return 40;
    if (text.includes((currentYear - 1).toString())) return 30;
    
    return 10; // Very old content
  }

  /**
   * Extract ML features for potential model training
   */
  private extractMLFeatures(content: ContentInput, signals: QualitySignals): MLFeatures {
    const text = this.getContentText(content);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    return {
      textComplexity: this.calculateTextComplexity(text),
      vocabularyDiversity: this.calculateVocabularyDiversity(words),
      sentenceVariability: this.calculateSentenceVariability(sentences),
      technicalTermDensity: this.calculateTechnicalTermDensity(text),
      codeSnippetQuality: signals.codeComplexity,
      externalReferences: this.countExternalReferences(text),
      structuralComplexity: this.assessStructuralComplexity(text),
      topicNovelty: signals.innovation
    };
  }

  /**
   * Calculate text complexity using various metrics
   */
  private calculateTextComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    // Average sentence length
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    
    // Average word length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / Math.max(words.length, 1);
    
    // Complex word ratio (words > 6 characters)
    const complexWords = words.filter(w => w.length > 6).length;
    const complexWordRatio = complexWords / Math.max(words.length, 1);
    
    // Normalize and combine metrics
    const sentenceLengthScore = Math.min(avgSentenceLength / 25, 1) * 30;
    const wordLengthScore = Math.min(avgWordLength / 6, 1) * 30;
    const complexityScore = complexWordRatio * 40;
    
    return sentenceLengthScore + wordLengthScore + complexityScore;
  }

  /**
   * Calculate vocabulary diversity
   */
  private calculateVocabularyDiversity(words: string[]): number {
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const diversity = uniqueWords.size / Math.max(words.length, 1);
    
    // Hapax legomena (words appearing only once)
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      const lower = word.toLowerCase();
      wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1);
    });
    
    const hapaxCount = Array.from(wordCounts.values()).filter(count => count === 1).length;
    const hapaxRatio = hapaxCount / Math.max(uniqueWords.size, 1);
    
    return (diversity * 50) + (hapaxRatio * 50);
  }

  /**
   * Calculate sentence variability
   */
  private calculateSentenceVariability(sentences: string[]): number {
    if (sentences.length < 2) return 0;
    
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    // Calculate standard deviation
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize standard deviation (higher is better for variety)
    return Math.min((stdDev / avgLength) * 100, 100);
  }

  /**
   * Calculate technical term density
   */
  private calculateTechnicalTermDensity(text: string): number {
    const technicalTerms = [
      /api|sdk|cli|gui|ide|cpu|gpu|ram|ssd/gi,
      /http|https|tcp|udp|dns|ssl|tls/gi,
      /json|xml|yaml|toml|csv|sql|nosql/gi,
      /oauth|jwt|saml|ldap|sso|mfa|2fa/gi,
      /docker|kubernetes|helm|terraform|ansible/gi,
      /react|angular|vue|svelte|nextjs|nuxtjs/gi,
      /python|javascript|typescript|rust|golang/gi,
      /aws|azure|gcp|cloud|serverless|lambda/gi,
      /git|github|gitlab|bitbucket|svn|mercurial/gi,
      /ci\/cd|devops|agile|scrum|kanban/gi
    ];

    let termCount = 0;
    technicalTerms.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) termCount += matches.length;
    });

    const wordCount = text.split(/\s+/).length;
    const density = (termCount / Math.max(wordCount, 1)) * 100;
    
    return Math.min(density * 10, 100);
  }

  /**
   * Count external references
   */
  private countExternalReferences(text: string): number {
    const referencePatterns = [
      /https?:\/\/[^\s]+/g,              // URLs
      /\[\d+\]/g,                        // Numbered references
      /\[[\w\s]+\]/g,                    // Named references
      /see\s+(also\s+)?[\w\s]+/gi,       // "See also" references
      /refer\s+to\s+[\w\s]+/gi,          // "Refer to" references
      /based\s+on\s+[\w\s]+/gi,          // "Based on" references
    ];

    let count = 0;
    referencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });

    return Math.min(count * 5, 100);
  }

  /**
   * Assess structural complexity
   */
  private assessStructuralComplexity(text: string): number {
    let score = 0;

    // Check for headers (markdown style)
    const headers = text.match(/^#{1,6}\s+.+$/gm);
    if (headers) score += Math.min(headers.length * 5, 20);

    // Check for lists
    const lists = text.match(/^[\*\-\+\d]+\.\s+.+$/gm);
    if (lists) score += Math.min(lists.length * 2, 20);

    // Check for code blocks
    const codeBlocks = text.match(/```[\s\S]*?```/g);
    if (codeBlocks) score += Math.min(codeBlocks.length * 10, 30);

    // Check for tables (markdown style)
    const tables = text.match(/\|.+\|/g);
    if (tables && tables.length > 3) score += 15;

    // Check for diagrams/images
    const images = text.match(/!\[.*?\]\(.*?\)/g);
    if (images) score += Math.min(images.length * 5, 15);

    return Math.min(score, 100);
  }

  /**
   * Calculate final score combining all signals
   */
  private calculateFinalScore(
    signals: QualitySignals, 
    platformScore: number, 
    mlFeatures: MLFeatures
  ): number {
    // Weight different components
    const weights = {
      technicalDepth: 0.20,
      innovation: 0.25,
      uniqueness: 0.10,
      codeComplexity: 0.15,
      academicReferences: 0.05,
      industryRelevance: 0.10,
      authorCredibility: 0.05,
      communityEngagement: 0.05,
      contentFreshness: 0.05
    };

    // Calculate weighted signal score
    let signalScore = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      signalScore += signals[key as keyof QualitySignals] * weight;
    });

    // Incorporate ML features (weighted average of normalized features)
    const mlScore = Object.values(mlFeatures).reduce((sum, val) => sum + val, 0) / 
                    Object.keys(mlFeatures).length;

    // Combine scores
    const combinedScore = (signalScore * 0.6) + (platformScore * 0.2) + (mlScore * 0.2);

    return Math.round(Math.max(0, Math.min(100, combinedScore)));
  }

  /**
   * Classify content quality based on score and signals
   */
  private classifyQuality(score: number, signals: QualitySignals): ContentQuality {
    // Check for spam indicators first
    if (score < 20 && signals.technicalDepth < 10) {
      return ContentQuality.SPAM;
    }

    // Check for innovative content
    if (signals.innovation > 80 && signals.technicalDepth > 70) {
      return ContentQuality.INNOVATIVE;
    }

    // Score-based classification
    if (score >= 80) return ContentQuality.ADVANCED;
    if (score >= 60) return ContentQuality.INTERMEDIATE;
    if (score >= 40) return ContentQuality.BASIC;
    
    return ContentQuality.LOW_QUALITY;
  }

  /**
   * Calculate confidence in the assessment
   */
  private calculateConfidence(signals: QualitySignals, mlFeatures: MLFeatures): number {
    // Base confidence on signal strength and consistency
    const signalValues = Object.values(signals);
    const avgSignal = signalValues.reduce((a, b) => a + b, 0) / signalValues.length;
    
    // Calculate variance to check consistency
    const variance = signalValues.reduce((sum, val) => sum + Math.pow(val - avgSignal, 2), 0) / signalValues.length;
    const consistency = 1 - (Math.sqrt(variance) / 100);

    // Factor in ML feature strength
    const mlStrength = Object.values(mlFeatures).reduce((a, b) => a + b, 0) / 
                      (Object.keys(mlFeatures).length * 100);

    return Math.max(0.1, Math.min(1, (consistency * 0.6) + (mlStrength * 0.4)));
  }

  /**
   * Generate human-readable reasons for the classification
   */
  private generateReasons(
    quality: ContentQuality, 
    signals: QualitySignals, 
    keywordAnalysis: KeywordAnalysis
  ): string[] {
    const reasons: string[] = [];

    // Quality-specific reasons
    switch (quality) {
      case ContentQuality.INNOVATIVE:
        reasons.push('Content demonstrates novel approaches or breakthrough concepts');
        if (signals.innovation > 80) reasons.push('High innovation score indicates cutting-edge material');
        if (signals.academicReferences > 50) reasons.push('Strong academic foundation with research references');
        break;

      case ContentQuality.ADVANCED:
        reasons.push('Content shows advanced technical depth and complexity');
        if (signals.codeComplexity > 70) reasons.push('Complex code examples demonstrate sophisticated concepts');
        if (signals.technicalDepth > 70) reasons.push('High density of technical terminology and concepts');
        break;

      case ContentQuality.INTERMEDIATE:
        reasons.push('Content provides moderate technical depth');
        if (signals.industryRelevance > 60) reasons.push('Good industry relevance and practical applications');
        break;

      case ContentQuality.BASIC:
        reasons.push('Content covers fundamental or introductory concepts');
        if (keywordAnalysis.negativeSignals > 5) reasons.push('Contains basic tutorial or beginner-focused keywords');
        break;

      case ContentQuality.LOW_QUALITY:
        reasons.push('Content lacks technical depth or innovation');
        if (signals.uniqueness < 30) reasons.push('High use of clichés and common phrases');
        if (signals.contentFreshness < 30) reasons.push('Content appears outdated or stale');
        break;

      case ContentQuality.SPAM:
        reasons.push('Content matches spam or auto-generated patterns');
        if (keywordAnalysis.negativeSignals > 10) reasons.push('Excessive low-quality keywords detected');
        break;
    }

    // Signal-based reasons
    if (signals.communityEngagement > 80) {
      reasons.push('Strong community engagement indicates valuable content');
    }
    if (signals.authorCredibility > 80) {
      reasons.push('Author has established credibility in the field');
    }
    if (signals.codeComplexity < 20 && signals.technicalDepth > 50) {
      reasons.push('Technical discussion without practical code examples');
    }

    return reasons;
  }

  /**
   * Record feedback for learning
   */
  recordFeedback(feedback: QualityFeedback): void {
    if (this.config.enableLearning) {
      this.learningData.push(feedback);
      
      // Trigger retraining if enough feedback accumulated
      if (this.learningData.length >= 100) {
        this.retrain();
      }
    }
  }

  /**
   * Retrain internal models based on feedback
   */
  private retrain(): void {
    // This would integrate with an ML pipeline
    // For now, we'll adjust internal thresholds based on feedback
    
    const correctPredictions = this.learningData.filter(f => f.wasCorrect).length;
    const accuracy = correctPredictions / this.learningData.length;
    
    if (accuracy < 0.8) {
      // Adjust thresholds based on common misclassifications
      this.adjustThresholds();
    }
    
    // Clear old learning data
    this.learningData = this.learningData.slice(-50);
  }

  /**
   * Adjust classification thresholds based on feedback
   */
  private adjustThresholds(): void {
    // Analyze misclassifications and adjust accordingly
    // This is a simplified version - real implementation would use ML
    
    const misclassified = this.learningData.filter(f => !f.wasCorrect);
    
    // Group by actual vs predicted quality
    const adjustments = new Map<string, number>();
    
    misclassified.forEach(item => {
      const key = `${item.actualQuality}`;
      adjustments.set(key, (adjustments.get(key) || 0) + 1);
    });
    
    // Apply adjustments to config
    // This would be more sophisticated in production
  }

  /**
   * Get combined text from content input
   */
  private getContentText(content: ContentInput): string {
    return [
      content.title,
      content.description || '',
      content.content || ''
    ].join(' ');
  }

  /**
   * Initialize keyword patterns for different quality levels
   */
  private initializeKeywordPatterns(): Map<ContentQuality, RegExp[]> {
    const patterns = new Map<ContentQuality, RegExp[]>();
    
    patterns.set(ContentQuality.INNOVATIVE, [
      /breakthrough|revolutionary|paradigm shift/gi,
      /first of its kind|never before|unprecedented/gi,
      /patent pending|proprietary algorithm/gi
    ]);
    
    patterns.set(ContentQuality.ADVANCED, [
      /advanced techniques|complex implementation/gi,
      /optimization strategy|performance tuning/gi,
      /architectural decision|design consideration/gi
    ]);
    
    patterns.set(ContentQuality.BASIC, [
      /getting started|beginner guide|introduction to/gi,
      /hello world|simple example|basic tutorial/gi,
      /step by step|easy to follow/gi
    ]);
    
    patterns.set(ContentQuality.LOW_QUALITY, [
      /click here|buy now|limited time/gi,
      /amazing trick|doctors hate|one weird/gi,
      /make money fast|work from home/gi
    ]);
    
    return patterns;
  }

  /**
   * Initialize platform-specific analyzers
   */
  private initializePlatformAnalyzers(): Map<Platform, PlatformAnalyzer> {
    const analyzers = new Map<Platform, PlatformAnalyzer>();
    
    analyzers.set(Platform.GITHUB, new GitHubAnalyzer());
    analyzers.set(Platform.YOUTUBE, new YouTubeAnalyzer());
    analyzers.set(Platform.X, new XAnalyzer());
    analyzers.set(Platform.BLOG, new BlogAnalyzer());
    analyzers.set(Platform.REDDIT, new RedditAnalyzer());
    analyzers.set(Platform.HACKERNEWS, new HackerNewsAnalyzer());
    
    return analyzers;
  }
}

// Supporting classes
interface KeywordAnalysis {
  positiveSignals: number;
  negativeSignals: number;
  technicalTerms: number;
  innovativeTerms: number;
}

// Complexity analyzer class
class ComplexityAnalyzer {
  analyze(content: ContentInput): number {
    const text = [content.title, content.description, content.content].join(' ');
    
    // Implement complexity analysis
    // This is a simplified version
    const sentenceLength = text.split('.').map(s => s.split(' ').length);
    const avgLength = sentenceLength.reduce((a, b) => a + b, 0) / sentenceLength.length;
    
    return Math.min(100, avgLength * 5);
  }
}

// Innovation detector class
class InnovationDetector {
  async detect(content: ContentInput): Promise<number> {
    const text = [content.title, content.description, content.content].join(' ').toLowerCase();
    
    // Innovation indicators
    const indicators = [
      { pattern: /novel approach|new method|innovative solution/g, weight: 3 },
      { pattern: /research paper|academic study|peer reviewed/g, weight: 2.5 },
      { pattern: /experiment|hypothesis|methodology/g, weight: 2 },
      { pattern: /benchmark|evaluation|comparison/g, weight: 1.5 },
      { pattern: /state of the art|cutting edge|latest/g, weight: 1.5 },
      { pattern: /breakthrough|discovery|advancement/g, weight: 3 },
      { pattern: /patent|intellectual property/g, weight: 2.5 },
      { pattern: /original work|original research/g, weight: 2 }
    ];
    
    let score = 0;
    indicators.forEach(({ pattern, weight }) => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * weight;
      }
    });
    
    // Check for research paper formatting
    if (text.includes('abstract') && text.includes('conclusion') && text.includes('references')) {
      score += 20;
    }
    
    return Math.min(100, score * 2);
  }
}

// Platform-specific analyzer interfaces
interface PlatformAnalyzer {
  analyze(content: ContentInput): Promise<number>;
}

// GitHub analyzer
class GitHubAnalyzer implements PlatformAnalyzer {
  async analyze(content: ContentInput): Promise<number> {
    let score = 50; // Base score
    
    if (!content.metadata) return score;
    
    const { metadata } = content;
    
    // Repository metrics
    if (metadata.stars > 1000) score += 20;
    else if (metadata.stars > 100) score += 10;
    
    if (metadata.forks > 100) score += 15;
    else if (metadata.forks > 10) score += 7;
    
    // Code quality indicators
    if (metadata.hasTests) score += 10;
    if (metadata.hasCi) score += 10;
    if (metadata.hasDocumentation) score += 10;
    if (metadata.license) score += 5;
    
    // Activity metrics
    if (metadata.lastCommit) {
      const daysSinceCommit = (Date.now() - new Date(metadata.lastCommit).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCommit < 30) score += 10;
      else if (daysSinceCommit < 90) score += 5;
    }
    
    // Language complexity
    if (metadata.languages) {
      const complexLanguages = ['rust', 'c++', 'scala', 'haskell', 'erlang'];
      const hasComplexLanguage = Object.keys(metadata.languages).some(lang => 
        complexLanguages.includes(lang.toLowerCase())
      );
      if (hasComplexLanguage) score += 10;
    }
    
    return Math.min(100, score);
  }
}

// YouTube analyzer
class YouTubeAnalyzer implements PlatformAnalyzer {
  async analyze(content: ContentInput): Promise<number> {
    let score = 40; // Base score (lower due to more basic content on average)
    
    if (!content.metadata) return score;
    
    const { metadata } = content;
    
    // Engagement metrics
    if (metadata.likeRatio && metadata.likeRatio > 0.95) score += 20;
    else if (metadata.likeRatio && metadata.likeRatio > 0.90) score += 10;
    
    // View/subscriber ratio
    if (metadata.views && metadata.subscriberCount) {
      const ratio = metadata.views / metadata.subscriberCount;
      if (ratio > 10) score += 15; // Viral beyond subscriber base
    }
    
    // Content indicators
    if (metadata.duration) {
      if (metadata.duration > 1200) score += 10; // 20+ minute videos suggest depth
      else if (metadata.duration < 300) score -= 10; // Short videos often basic
    }
    
    // Channel credibility
    if (metadata.channelVerified) score += 10;
    if (metadata.subscriberCount > 100000) score += 10;
    else if (metadata.subscriberCount > 10000) score += 5;
    
    // Technical content indicators in title/description
    const text = (content.title + ' ' + (content.description || '')).toLowerCase();
    const technicalIndicators = [
      'architecture', 'algorithm', 'implementation', 'deep dive',
      'advanced', 'optimization', 'performance', 'under the hood'
    ];
    
    const hassTechnicalIndicators = technicalIndicators.some(term => text.includes(term));
    if (hassTechnicalIndicators) score += 15;
    
    return Math.min(100, score);
  }
}

// X (Twitter) analyzer
class XAnalyzer implements PlatformAnalyzer {
  async analyze(content: ContentInput): Promise<number> {
    let score = 50; // Base score
    
    if (!content.metadata) return score;
    
    const { metadata } = content;
    
    // Engagement quality
    if (metadata.retweets && metadata.likes) {
      const engagementRatio = metadata.retweets / Math.max(metadata.likes, 1);
      if (engagementRatio > 0.3) score += 15; // High retweet ratio indicates value
    }
    
    // Author influence
    if (metadata.authorFollowers > 10000) score += 10;
    if (metadata.authorVerified) score += 10;
    
    // Thread detection (indicates depth)
    if (metadata.isThread && metadata.threadLength > 5) score += 20;
    
    // Technical discussion indicators
    if (metadata.hasCodeSnippet) score += 15;
    if (metadata.hasLinks) score += 5;
    if (metadata.quoteTweets > 10) score += 10; // Indicates discussion
    
    return Math.min(100, score);
  }
}

// Blog analyzer
class BlogAnalyzer implements PlatformAnalyzer {
  async analyze(content: ContentInput): Promise<number> {
    let score = 60; // Base score (blogs tend to be more detailed)
    
    if (!content.content) return score;
    
    // Word count analysis
    const wordCount = content.content.split(/\s+/).length;
    if (wordCount > 3000) score += 15;
    else if (wordCount > 1500) score += 10;
    else if (wordCount < 500) score -= 20;
    
    // Check for technical blog indicators
    const technicalDomains = [
      'medium.com/@', 'dev.to', 'hackernoon.com', 'dzone.com',
      'infoq.com', 'martinfowler.com', 'joelonsoftware.com'
    ];
    
    if (content.url && technicalDomains.some(domain => content.url!.includes(domain))) {
      score += 10;
    }
    
    // Academic or corporate blog
    if (content.url && (content.url.includes('.edu') || content.url.includes('research'))) {
      score += 15;
    }
    
    // Check for series/part indicators
    if (content.title.match(/part \d+|chapter \d+|section \d+/i)) {
      score += 10; // Multi-part content suggests depth
    }
    
    return Math.min(100, score);
  }
}

// Reddit analyzer
class RedditAnalyzer implements PlatformAnalyzer {
  async analyze(content: ContentInput): Promise<number> {
    let score = 50; // Base score
    
    if (!content.metadata) return score;
    
    const { metadata } = content;
    
    // Subreddit quality
    const technicalSubreddits = [
      'programming', 'compsci', 'machinelearning', 'rust', 'golang',
      'javascript', 'python', 'datascience', 'artificialintelligence'
    ];
    
    if (metadata.subreddit && technicalSubreddits.includes(metadata.subreddit.toLowerCase())) {
      score += 15;
    }
    
    // Post quality metrics
    if (metadata.upvoteRatio && metadata.upvoteRatio > 0.95) score += 20;
    else if (metadata.upvoteRatio && metadata.upvoteRatio > 0.85) score += 10;
    
    if (metadata.awards && metadata.awards > 0) score += metadata.awards * 5;
    if (metadata.isPinned || metadata.isStickied) score += 10;
    
    // Discussion quality
    if (metadata.commentCount > 100) score += 10;
    if (metadata.crossposts > 5) score += 10;
    
    return Math.min(100, score);
  }
}

// HackerNews analyzer
class HackerNewsAnalyzer implements PlatformAnalyzer {
  async analyze(content: ContentInput): Promise<number> {
    let score = 70; // Higher base score for HN
    
    if (!content.metadata) return score;
    
    const { metadata } = content;
    
    // HN points are good quality indicator
    if (metadata.points > 500) score += 20;
    else if (metadata.points > 100) score += 10;
    
    // Comment discussion quality
    if (metadata.commentCount > 200) score += 10;
    else if (metadata.commentCount > 50) score += 5;
    
    // Front page status
    if (metadata.onFrontPage) score += 10;
    
    // Type of content
    if (metadata.type === 'article' || metadata.type === 'pdf') score += 5;
    
    return Math.min(100, score);
  }
}

// Helper function to create low quality result
function createLowQualityResult(reason: string, penaltyScore: number): ContentAnalysis {
  return {
    quality: ContentQuality.LOW_QUALITY,
    score: Math.max(0, 100 - (penaltyScore * 100)),
    signals: {
      technicalDepth: 0,
      innovation: 0,
      uniqueness: 0,
      codeComplexity: 0,
      academicReferences: 0,
      industryRelevance: 0,
      authorCredibility: 0,
      communityEngagement: 0,
      contentFreshness: 0
    },
    reasons: [reason],
    confidence: 0.9,
    platformSpecificScore: 0,
    mlFeatures: {
      textComplexity: 0,
      vocabularyDiversity: 0,
      sentenceVariability: 0,
      technicalTermDensity: 0,
      codeSnippetQuality: 0,
      externalReferences: 0,
      structuralComplexity: 0,
      topicNovelty: 0
    }
  };
}

// Export default configuration factory
export function createDefaultFilterConfig(): FilterConfig {
  return {
    minQualityScore: 60,
    excludeQualities: [ContentQuality.LOW_QUALITY, ContentQuality.SPAM],
    platformRules: new Map([
      [Platform.GITHUB, {
        minScore: 65,
        requiredSignals: ['codeComplexity', 'technicalDepth'],
        customRules: [],
        blacklistPatterns: [
          /todo[- ]app|hello[- ]world/i,
          /my[- ]first[- ](repo|project)/i,
          /learning[- ](javascript|python|programming)/i
        ]
      }],
      [Platform.YOUTUBE, {
        minScore: 70,
        requiredSignals: ['technicalDepth', 'communityEngagement'],
        customRules: [],
        blacklistPatterns: [
          /in \d+ minutes?|learn .+ fast/i,
          /absolute beginner|complete novice/i,
          /day \d+ of \d+|#\d+days?ofcode/i
        ]
      }],
      [Platform.X, {
        minScore: 60,
        requiredSignals: ['innovation', 'authorCredibility'],
        customRules: [],
        blacklistPatterns: [
          /unpopular opinion|hot take/i,
          /a thread 🧵/i,
          /like and retweet|follow for more/i
        ]
      }],
      [Platform.BLOG, {
        minScore: 65,
        requiredSignals: ['technicalDepth', 'uniqueness'],
        customRules: [],
        blacklistPatterns: [
          /top \d+ reasons?|you won't believe/i,
          /every developer should|must know/i,
          /copy paste|quick hack/i
        ]
      }]
    ]),
    keywordWeights: new Map([
      ['innovative', 3],
      ['breakthrough', 3],
      ['research', 2],
      ['algorithm', 2],
      ['architecture', 2],
      ['optimization', 2],
      ['beginner', -3],
      ['tutorial', -2],
      ['basic', -2],
      ['simple', -1]
    ]),
    patternPenalties: new Map([
      [/^(how to|what is|why you should)/i, 0.3],
      [/for beginners|getting started/i, 0.4],
      [/in \d+ (minutes?|hours?|days?)/i, 0.3],
      [/click here|learn more|buy now/i, 0.5]
    ]),
    enableLearning: true
  };
}

// Example usage function
export async function filterContent(
  contents: ContentInput[],
  config: FilterConfig = createDefaultFilterConfig()
): Promise<Array<{ content: ContentInput; analysis: ContentAnalysis; passed: boolean }>> {
  const filter = new ContentQualityFilter(config);
  
  const results = await Promise.all(
    contents.map(async (content) => {
      const analysis = await filter.analyzeContent(content);
      const passed = analysis.score >= config.minQualityScore &&
                     !config.excludeQualities.includes(analysis.quality);
      
      return { content, analysis, passed };
    })
  );
  
  return results.sort((a, b) => b.analysis.score - a.analysis.score);
}