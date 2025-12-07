/**
 * Resource Classification and Ranking System
 * Advanced categorization, ranking, and hidden gem identification for Ultra Swarm
 */

const chalk = require('chalk');
const { EventEmitter } = require('events');

class ResourceClassifier extends EventEmitter {
  constructor(consensusValidator, qualityAssurance) {
    super();
    this.consensusValidator = consensusValidator;
    this.qualityAssurance = qualityAssurance;

    this.classificationSchemes = new Map();
    this.rankingAlgorithms = new Map();
    this.resourceCategories = new Map();
    this.rankingResults = new Map();
    this.hiddenGemDetector = null;

    this.initializeClassificationSchemes();
    this.initializeRankingAlgorithms();
    this.initializeResourceCategories();
    this.setupHiddenGemDetection();
  }

  /**
   * Initialize classification schemes
   */
  initializeClassificationSchemes() {
    // Functional classification
    this.classificationSchemes.set('functional', {
      name: 'Functional Classification',
      description: 'Categorize by primary function and purpose',
      classify: this.functionalClassification.bind(this)
    });

    // Complexity classification
    this.classificationSchemes.set('complexity', {
      name: 'Complexity Classification',
      description: 'Categorize by implementation and usage complexity',
      classify: this.complexityClassification.bind(this)
    });

    // Impact classification
    this.classificationSchemes.set('impact', {
      name: 'Impact Classification',
      description: 'Categorize by potential impact and value',
      classify: this.impactClassification.bind(this)
    });

    // Maturity classification
    this.classificationSchemes.set('maturity', {
      name: 'Maturity Classification',
      description: 'Categorize by development and adoption maturity',
      classify: this.maturityClassification.bind(this)
    });

    // Use case classification
    this.classificationSchemes.set('usecase', {
      name: 'Use Case Classification',
      description: 'Categorize by target use cases and scenarios',
      classify: this.useCaseClassification.bind(this)
    });

    // Technology stack classification
    this.classificationSchemes.set('techstack', {
      name: 'Technology Stack Classification',
      description: 'Categorize by underlying technologies and dependencies',
      classify: this.techStackClassification.bind(this)
    });
  }

  /**
   * Initialize ranking algorithms
   */
  initializeRankingAlgorithms() {
    // Multi-criteria ranking
    this.rankingAlgorithms.set('multicriteria', {
      name: 'Multi-Criteria Ranking',
      description: 'Rank based on weighted multiple criteria',
      rank: this.multiCriteriaRanking.bind(this)
    });

    // Performance-based ranking
    this.rankingAlgorithms.set('performance', {
      name: 'Performance Ranking',
      description: 'Rank based on performance metrics',
      rank: this.performanceRanking.bind(this)
    });

    // Popularity ranking
    this.rankingAlgorithms.set('popularity', {
      name: 'Popularity Ranking',
      description: 'Rank based on adoption and usage',
      rank: this.popularityRanking.bind(this)
    });

    // Innovation ranking
    this.rankingAlgorithms.set('innovation', {
      name: 'Innovation Ranking',
      description: 'Rank based on novelty and innovation',
      rank: this.innovationRanking.bind(this)
    });

    // Composite ranking
    this.rankingAlgorithms.set('composite', {
      name: 'Composite Ranking',
      description: 'Combine multiple ranking methods',
      rank: this.compositeRanking.bind(this)
    });

    // Contextual ranking
    this.rankingAlgorithms.set('contextual', {
      name: 'Contextual Ranking',
      description: 'Rank based on specific context and requirements',
      rank: this.contextualRanking.bind(this)
    });
  }

  /**
   * Initialize resource categories
   */
  initializeResourceCategories() {
    // Tool categories
    this.resourceCategories.set('tools', {
      name: 'Tools',
      subcategories: {
        'development': { name: 'Development Tools', priority: 1.0 },
        'testing': { name: 'Testing Tools', priority: 0.9 },
        'deployment': { name: 'Deployment Tools', priority: 0.8 },
        'monitoring': { name: 'Monitoring Tools', priority: 0.7 },
        'security': { name: 'Security Tools', priority: 0.95 },
        'productivity': { name: 'Productivity Tools', priority: 0.6 },
        'automation': { name: 'Automation Tools', priority: 0.85 },
        'analysis': { name: 'Analysis Tools', priority: 0.75 }
      },
      characteristics: ['performance', 'reliability', 'usability', 'integration']
    });

    // Agent categories
    this.resourceCategories.set('agents', {
      name: 'Agents',
      subcategories: {
        'autonomous': { name: 'Autonomous Agents', priority: 1.0 },
        'assistant': { name: 'Assistant Agents', priority: 0.9 },
        'coordinator': { name: 'Coordinator Agents', priority: 0.85 },
        'specialist': { name: 'Specialist Agents', priority: 0.8 },
        'generalist': { name: 'Generalist Agents', priority: 0.7 },
        'learning': { name: 'Learning Agents', priority: 0.95 },
        'reactive': { name: 'Reactive Agents', priority: 0.6 }
      },
      characteristics: ['intelligence', 'reliability', 'autonomy', 'adaptability']
    });

    // Skill categories
    this.resourceCategories.set('skills', {
      name: 'Skills',
      subcategories: {
        'technical': { name: 'Technical Skills', priority: 1.0 },
        'creative': { name: 'Creative Skills', priority: 0.9 },
        'analytical': { name: 'Analytical Skills', priority: 0.85 },
        'communication': { name: 'Communication Skills', priority: 0.8 },
        'problem_solving': { name: 'Problem Solving Skills', priority: 0.95 },
        'domain_expertise': { name: 'Domain Expertise Skills', priority: 0.9 },
        'interdisciplinary': { name: 'Interdisciplinary Skills', priority: 1.0 }
      },
      characteristics: ['novelty', 'usefulness', 'applicability', 'transferability']
    });

    // Workflow categories
    this.resourceCategories.set('workflows', {
      name: 'Workflows',
      subcategories: {
        'automation': { name: 'Automation Workflows', priority: 1.0 },
        'collaboration': { name: 'Collaboration Workflows', priority: 0.9 },
        'approval': { name: 'Approval Workflows', priority: 0.8 },
        'monitoring': { name: 'Monitoring Workflows', priority: 0.7 },
        'deployment': { name: 'Deployment Workflows', priority: 0.85 },
        'testing': { name: 'Testing Workflows', priority: 0.8 },
        'integration': { name: 'Integration Workflows', priority: 0.9 }
      },
      characteristics: ['efficiency', 'reliability', 'scalability', 'maintainability']
    });

    // Prompt categories
    this.resourceCategories.set('prompts', {
      name: 'Prompts',
      subcategories: {
        'instructional': { name: 'Instructional Prompts', priority: 1.0 },
        'creative': { name: 'Creative Prompts', priority: 0.9 },
        'analytical': { name: 'Analytical Prompts', priority: 0.85 },
        'conversational': { name: 'Conversational Prompts', priority: 0.8 },
        'technical': { name: 'Technical Prompts', priority: 0.95 },
        'educational': { name: 'Educational Prompts', priority: 0.9 },
        'problem_solving': { name: 'Problem Solving Prompts', priority: 0.95 }
      },
      characteristics: ['effectiveness', 'versatility', 'clarity', 'adaptability']
    });
  }

  /**
   * Setup hidden gem detection
   */
  setupHiddenGemDetection() {
    this.hiddenGemDetector = {
      criteria: [
        { name: 'high_quality_low_popularity', weight: 0.3 },
        { name: 'innovative_solution', weight: 0.25 },
        { name: 'nicke_applicability', weight: 0.2 },
        { name: 'emerging_potential', weight: 0.15 },
        { name: 'underrated_value', weight: 0.1 }
      ],

      detect: this.detectHiddenGems.bind(this)
    };
  }

  /**
   * Classify all resources using multiple schemes
   */
  async classifyResources(resourceIds = null, schemes = null) {
    const resourcesToClassify = resourceIds || Array.from(this.consensusValidator.resources.keys());
    const classificationSchemes = schemes || Array.from(this.classificationSchemes.keys());

    console.log(chalk.magenta('🏷️ Starting Resource Classification'));
    console.log(chalk.gray(`Resources: ${resourcesToClassify.length}`));
    console.log(chalk.gray(`Schemes: ${classificationSchemes.join(', ')}\n`));

    const classificationResults = new Map();

    for (const resourceId of resourcesToClassify) {
      const resource = this.consensusValidator.resources.get(resourceId);
      if (!resource) continue;

      console.log(chalk.cyan(`🏷️ Classifying: ${resource.name}`));

      const resourceClassifications = {};

      for (const schemeName of classificationSchemes) {
        const scheme = this.classificationSchemes.get(schemeName);
        if (!scheme) continue;

        try {
          const classification = await scheme.classify(resource);
          resourceClassifications[schemeName] = classification;
          console.log(chalk.gray(`  ${scheme.name}: ${classification.primary} (${classification.confidence.toFixed(2)})`));
        } catch (error) {
          console.error(chalk.red(`    ❌ Error in ${scheme.name}: ${error.message}`));
          resourceClassifications[schemeName] = {
            primary: 'unknown',
            confidence: 0,
            error: error.message
          };
        }
      }

      classificationResults.set(resourceId, resourceClassifications);

      // Store classifications in resource
      resource.classifications = resourceClassifications;

      this.emit('resourceClassified', { resourceId, classifications: resourceClassifications });
    }

    console.log(chalk.green(`✅ Classification complete for ${classificationResults.size} resources\n`));

    return {
      results: classificationResults,
      summary: this.generateClassificationSummary(classificationResults),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Functional classification
   */
  async functionalClassification(resource) {
    const category = this.resourceCategories.get(resource.type);
    if (!category) {
      return { primary: 'unknown', secondary: [], confidence: 0 };
    }

    // Analyze resource features and description
    const text = (resource.description + ' ' + (resource.features || []).join(' ')).toLowerCase();
    const scores = {};

    for (const [subcategoryId, subcategory] of Object.entries(category.subcategories)) {
      scores[subcategoryId] = this.calculateFunctionalScore(text, subcategory.name, subcategoryId);
    }

    // Find best match
    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
    const primary = sortedScores[0][0];
    const confidence = sortedScores[0][1];
    const secondary = sortedScores.slice(1, 3).map(([id]) => id);

    return {
      primary,
      secondary,
      confidence,
      scores,
      category: category.name
    };
  }

  /**
   * Calculate functional score for text matching
   */
  calculateFunctionalScore(text, categoryName, categoryId) {
    const keywords = {
      development: ['develop', 'code', 'programming', 'build', 'create', 'implement'],
      testing: ['test', 'verify', 'validate', 'check', 'debug', 'qa'],
      deployment: ['deploy', 'release', 'publish', 'distribute', 'ship'],
      monitoring: ['monitor', 'observe', 'track', 'measure', 'analytics'],
      security: ['security', 'secure', 'protect', 'encrypt', 'authenticate'],
      productivity: ['productivity', 'efficiency', 'optimize', 'automate', 'streamline'],
      automation: ['automate', 'automation', 'script', 'workflow', 'batch'],
      analysis: ['analyze', 'analysis', 'report', 'insight', 'data'],
      autonomous: ['autonomous', 'self', 'independent', 'auto'],
      assistant: ['assistant', 'helper', 'support', 'aid'],
      coordinator: ['coordinate', 'orchestrate', 'manage', 'organize'],
      specialist: ['specialist', 'expert', 'focused', 'dedicated'],
      generalist: ['general', 'versatile', 'flexible', 'adaptive'],
      learning: ['learn', 'adapt', 'train', 'improve', 'evolve'],
      reactive: ['react', 'respond', 'trigger', 'event'],
      technical: ['technical', 'code', 'programming', 'development'],
      creative: ['creative', 'design', 'artistic', 'innovative'],
      analytical: ['analyze', 'analysis', 'logic', 'reasoning'],
      communication: ['communicate', 'talk', 'discuss', 'collaborate'],
      problem_solving: ['solve', 'problem', 'solution', 'resolve'],
      domain_expertise: ['expert', 'domain', 'specialized', 'industry'],
      interdisciplinary: ['interdisciplinary', 'cross', 'multi', 'integrated'],
      collaboration: ['collaborate', 'team', 'together', 'shared'],
      approval: ['approve', 'review', 'signoff', 'authorize'],
      integration: ['integrate', 'connect', 'link', 'bridge'],
      instructional: ['instruct', 'guide', 'teach', 'explain'],
      conversational: ['conversation', 'dialogue', 'chat', 'talk'],
      educational: ['education', 'learn', 'study', 'knowledge']
    };

    const categoryKeywords = keywords[categoryId] || [];
    let score = 0;

    for (const keyword of categoryKeywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }

    // Normalize score
    score = Math.min(score / categoryKeywords.length, 1.0);

    // Boost score if category name is in text
    if (text.includes(categoryName.toLowerCase())) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Complexity classification
   */
  async complexityClassification(resource) {
    const factors = {
      codeComplexity: this.calculateCodeComplexity(resource),
      dependencyComplexity: this.calculateDependencyComplexity(resource),
      configurationComplexity: this.calculateConfigurationComplexity(resource),
      learningCurve: this.estimateLearningCurve(resource)
    };

    const overallComplexity = Object.values(factors).reduce((sum, f) => sum + f.score, 0) / Object.keys(factors).length;

    let complexityLevel;
    if (overallComplexity < 0.3) {
      complexityLevel = 'simple';
    } else if (overallComplexity < 0.6) {
      complexityLevel = 'moderate';
    } else if (overallComplexity < 0.8) {
      complexityLevel = 'complex';
    } else {
      complexityLevel = 'very_complex';
    }

    return {
      primary: complexityLevel,
      secondary: [],
      confidence: 0.8,
      factors,
      overallComplexity
    };
  }

  /**
   * Calculate code complexity
   */
  calculateCodeComplexity(resource) {
    if (!resource.code) return { score: 0, details: 'No code provided' };

    const lines = resource.code.split('\n').length;
    const functions = (resource.code.match(/function|def|class/g) || []).length;
    const complexity = Math.min((lines / 100 + functions / 10) / 2, 1.0);

    return {
      score: complexity,
      details: { lines, functions }
    };
  }

  /**
   * Calculate dependency complexity
   */
  calculateDependencyComplexity(resource) {
    const deps = resource.dependencies || [];
    const complexity = Math.min(deps.length / 20, 1.0);

    return {
      score: complexity,
      details: { dependencyCount: deps.length }
    };
  }

  /**
   * Calculate configuration complexity
   */
  calculateConfigurationComplexity(resource) {
    const configFields = Object.keys(resource.configuration || {}).length;
    const complexity = Math.min(configFields / 10, 1.0);

    return {
      score: complexity,
      details: { configFields }
    };
  }

  /**
   * Estimate learning curve
   */
  estimateLearningCurve(resource) {
    let complexity = 0.5; // Base complexity

    // Factors that increase learning curve
    if (resource.code && resource.code.split('\n').length > 500) complexity += 0.2;
    if (resource.dependencies && resource.dependencies.length > 10) complexity += 0.1;
    if (!resource.documentation && !resource.readme) complexity += 0.2;
    if (!resource.examples && !resource.usage) complexity += 0.1;

    // Factors that decrease learning curve
    if (resource.tutorial) complexity -= 0.1;
    if (resource.quickstart) complexity -= 0.1;
    if (resource.examples && resource.examples.length > 3) complexity -= 0.1;

    return {
      score: Math.max(0, Math.min(1, complexity)),
      details: 'Based on code size, dependencies, and documentation'
    };
  }

  /**
   * Impact classification
   */
  async impactClassification(resource) {
    const qualityData = this.qualityAssurance.qualityMetrics.get(resource.id);

    const factors = {
      qualityScore: qualityData?.overallQuality || 0.5,
      consensusScore: resource.consensusScore || 0.5,
      innovationScore: this.assessInnovation(resource),
      applicabilityScore: this.assessApplicability(resource)
    };

    const overallImpact = Object.values(factors).reduce((sum, f) => sum + f, 0) / Object.keys(factors).length;

    let impactLevel;
    if (overallImpact < 0.4) {
      impactLevel = 'low';
    } else if (overallImpact < 0.7) {
      impactLevel = 'medium';
    } else if (overallImpact < 0.85) {
      impactLevel = 'high';
    } else {
      impactLevel = 'critical';
    }

    return {
      primary: impactLevel,
      secondary: [],
      confidence: 0.75,
      factors,
      overallImpact
    };
  }

  /**
   * Assess innovation score
   */
  assessInnovation(resource) {
    let innovation = 0.5; // Base score

    // Innovation indicators
    if (resource.novel || resource.innovative) innovation += 0.2;
    if (resource.patent || resource.research) innovation += 0.1;
    if (resource.breakthrough) innovation += 0.2;
    if (resource.firstOfKind) innovation += 0.1;

    // Check for innovative features
    const innovativeKeywords = ['novel', 'innovative', 'breakthrough', 'revolutionary', 'first'];
    const text = (resource.description + ' ' + (resource.features || []).join(' ')).toLowerCase();
    const keywordMatches = innovativeKeywords.filter(keyword => text.includes(keyword)).length;
    innovation += Math.min(keywordMatches * 0.05, 0.2);

    return Math.min(innovation, 1.0);
  }

  /**
   * Assess applicability score
   */
  assessApplicability(resource) {
    let applicability = 0.5; // Base score

    // Applicability indicators
    if (resource.useCases && resource.useCases.length > 2) applicability += 0.2;
    if (resource.scenarios && resource.scenarios.length > 3) applicability += 0.1;
    if (resource.industry && resource.industry.length > 1) applicability += 0.1;
    if (resource.versatile || resource.flexible) applicability += 0.1;

    return Math.min(applicability, 1.0);
  }

  /**
   * Maturity classification
   */
  async maturityClassification(resource) {
    const factors = {
      developmentMaturity: this.assessDevelopmentMaturity(resource),
      adoptionMaturity: this.assessAdoptionMaturity(resource),
      communityMaturity: this.assessCommunityMaturity(resource),
      documentationMaturity: this.assessDocumentationMaturity(resource)
    };

    const overallMaturity = Object.values(factors).reduce((sum, f) => sum + f.score, 0) / Object.keys(factors).length;

    let maturityLevel;
    if (overallMaturity < 0.3) {
      maturityLevel = 'experimental';
    } else if (overallMaturity < 0.6) {
      maturityLevel = 'development';
    } else if (overallMaturity < 0.8) {
      maturityLevel = 'stable';
    } else {
      maturityLevel = 'production';
    }

    return {
      primary: maturityLevel,
      secondary: [],
      confidence: 0.7,
      factors,
      overallMaturity
    };
  }

  /**
   * Assess development maturity
   */
  assessDevelopmentMaturity(resource) {
    let maturity = 0.3; // Base score for experimental

    if (resource.version && resource.version !== '0.0.1') maturity += 0.2;
    if (resource.changelog || resource.releaseNotes) maturity += 0.1;
    if (resource.tests || resource.testCoverage) maturity += 0.2;
    if (resource.ci || resource.cicd) maturity += 0.1;
    if (resource.stable || resource.production) maturity += 0.1;

    return Math.min(maturity, 1.0);
  }

  /**
   * Assess adoption maturity
   */
  assessAdoptionMaturity(resource) {
    // In a real implementation, this would check actual usage metrics
    let maturity = 0.3; // Base score

    if (resource.users || resource.downloads) maturity += 0.2;
    if (resource.reviews && resource.reviews.length > 0) maturity += 0.1;
    if (resource.stars || resource.popularity) maturity += 0.1;
    if (resource.enterprise || resource.commercial) maturity += 0.2;
    if (resource.casestudies || resource.testimonials) maturity += 0.1;

    return Math.min(maturity, 1.0);
  }

  /**
   * Assess community maturity
   */
  assessCommunityMaturity(resource) {
    let maturity = 0.3; // Base score

    if (resource.contributors && resource.contributors.length > 1) maturity += 0.2;
    if (resource.forum || resource.discord || resource.slack) maturity += 0.1;
    if (resource.issues || resource.discussions) maturity += 0.1;
    if (resource.community || resource.ecosystem) maturity += 0.2;
    if (resource.maintainers && resource.maintainers.length > 1) maturity += 0.1;

    return Math.min(maturity, 1.0);
  }

  /**
   * Assess documentation maturity
   */
  assessDocumentationMaturity(resource) {
    let maturity = 0.3; // Base score

    if (resource.readme || resource.documentation) maturity += 0.2;
    if (resource.api || resource.apidocs) maturity += 0.1;
    if (resource.tutorial || resource.guide) maturity += 0.1;
    if (resource.examples || resource.demos) maturity += 0.1;
    if (resource.faq || resource.support) maturity += 0.1;

    return Math.min(maturity, 1.0);
  }

  /**
   * Use case classification
   */
  async useCaseClassification(resource) {
    const text = (resource.description + ' ' + (resource.useCases || []).join(' ')).toLowerCase();

    const useCases = {
      'development': ['develop', 'code', 'programming', 'build'],
      'testing': ['test', 'quality', 'assurance', 'validation'],
      'deployment': ['deploy', 'release', 'production'],
      'monitoring': ['monitor', 'observe', 'track'],
      'security': ['security', 'protection', 'defense'],
      'automation': ['automate', 'workflow', 'script'],
      'analysis': ['analyze', 'report', 'insights'],
      'collaboration': ['collaborate', 'team', 'share'],
      'learning': ['learn', 'education', 'training'],
      'productivity': ['productivity', 'efficiency', 'optimize']
    };

    const scores = {};
    for (const [useCase, keywords] of Object.entries(useCases)) {
      scores[useCase] = keywords.filter(keyword => text.includes(keyword)).length / keywords.length;
    }

    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
    const primary = sortedScores[0][0] || 'general';
    const confidence = sortedScores[0][1];
    const secondary = sortedScores.slice(1, 3).filter(([,score]) => score > 0.1).map(([id]) => id);

    return {
      primary,
      secondary,
      confidence,
      scores,
      category: 'use_case'
    };
  }

  /**
   * Technology stack classification
   */
  async techStackClassification(resource) {
    const techStacks = {
      'javascript': ['javascript', 'node', 'npm', 'yarn', 'react', 'vue', 'angular'],
      'python': ['python', 'pip', 'django', 'flask', 'fastapi', 'jupyter'],
      'java': ['java', 'maven', 'gradle', 'spring', 'jsp'],
      'go': ['go', 'golang', 'gopath'],
      'rust': ['rust', 'cargo', 'crates'],
      'typescript': ['typescript', 'ts'],
      'docker': ['docker', 'container', 'kubernetes', 'k8s'],
      'aws': ['aws', 'amazon', 'ec2', 's3', 'lambda'],
      'database': ['sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis'],
      'ai_ml': ['ai', 'ml', 'machine learning', 'tensorflow', 'pytorch', 'sklearn']
    };

    const text = (resource.technologies + ' ' + resource.dependencies?.join(' ') + ' ' + (resource.description || '')).toLowerCase();
    const scores = {};

    for (const [stack, keywords] of Object.entries(techStacks)) {
      scores[stack] = keywords.filter(keyword => text.includes(keyword)).length / keywords.length;
    }

    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
    const primary = sortedScores[0][0] || 'unknown';
    const confidence = sortedScores[0][1];
    const secondary = sortedScores.slice(1, 3).filter(([,score]) => score > 0.1).map(([id]) => id);

    return {
      primary,
      secondary,
      confidence,
      scores,
      category: 'tech_stack'
    };
  }

  /**
   * Rank resources using specified algorithms
   */
  async rankResources(resourceIds = null, algorithms = null, options = {}) {
    const resourcesToRank = resourceIds || Array.from(this.consensusValidator.resources.keys());
    const rankingAlgorithms = algorithms || ['composite', 'multicriteria'];

    console.log(chalk.yellow('🏆 Starting Resource Ranking'));
    console.log(chalk.gray(`Resources: ${resourcesToRank.length}`));
    console.log(chalk.gray(`Algorithms: ${rankingAlgorithms.join(', ')}\n`));

    const rankingResults = new Map();

    for (const algorithmName of rankingAlgorithms) {
      const algorithm = this.rankingAlgorithms.get(algorithmName);
      if (!algorithm) continue;

      console.log(chalk.cyan(`🏆 Applying ${algorithm.name} algorithm`));

      try {
        const rankings = await algorithm.rank(resourcesToRank, options);
        rankingResults.set(algorithmName, rankings);

        console.log(chalk.gray(`  ✅ Ranked ${rankings.length} resources`));
      } catch (error) {
        console.error(chalk.red(`    ❌ Error in ${algorithm.name}: ${error.message}`));
      }
    }

    // Calculate composite ranking if multiple algorithms used
    let finalRankings;
    if (rankingResults.size > 1) {
      finalRankings = this.combineRankings(rankingResults);
    } else if (rankingResults.size === 1) {
      finalRankings = Array.from(rankingResults.values())[0];
    } else {
      finalRankings = [];
    }

    console.log(chalk.green(`✅ Ranking complete - top resource: ${finalRankings[0]?.resource?.name || 'N/A'}\n`));

    return {
      results: rankingResults,
      finalRankings,
      summary: this.generateRankingSummary(finalRankings),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Multi-criteria ranking algorithm
   */
  async multiCriteriaRanking(resourceIds, options = {}) {
    const weights = options.weights || {
      quality: 0.3,
      consensus: 0.25,
      innovation: 0.2,
      usability: 0.15,
      popularity: 0.1
    };

    const rankings = [];

    for (const resourceId of resourceIds) {
      const resource = this.consensusValidator.resources.get(resourceId);
      if (!resource) continue;

      const qualityData = this.qualityAssurance.qualityMetrics.get(resourceId);

      const scores = {
        quality: qualityData?.overallQuality || 0.5,
        consensus: resource.consensusScore || 0.5,
        innovation: this.assessInnovation(resource),
        usability: this.assessUsability(resource),
        popularity: this.assessPopularity(resource)
      };

      const weightedScore = Object.entries(scores).reduce((sum, [criterion, score]) => {
        return sum + (score * (weights[criterion] || 0));
      }, 0);

      rankings.push({
        resource,
        score: weightedScore,
        scores,
        rank: 0
      });
    }

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Performance-based ranking algorithm
   */
  async performanceRanking(resourceIds, options = {}) {
    const rankings = [];

    for (const resourceId of resourceIds) {
      const resource = this.consensusValidator.resources.get(resourceId);
      if (!resource) continue;

      const performanceScore = this.calculatePerformanceScore(resource);

      rankings.push({
        resource,
        score: performanceScore,
        rank: 0
      });
    }

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(resource) {
    const metrics = this.consensusValidator.qualityMetrics.get(resource.id);
    if (!metrics) return 0.5;

    const factors = {
      consensusScore: resource.consensusScore || 0.5,
      truthScore: metrics.truthScore || 0.5,
      evaluationCount: Math.min(metrics.agentCount / 10, 1.0),
      consistency: 1 - (Math.abs(metrics.averageScore - 0.5) * 2)
    };

    return Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;
  }

  /**
   * Popularity ranking algorithm
   */
  async popularityRanking(resourceIds, options = {}) {
    const rankings = [];

    for (const resourceId of resourceIds) {
      const resource = this.consensusValidator.resources.get(resourceId);
      if (!resource) continue;

      const popularityScore = this.assessPopularity(resource);

      rankings.push({
        resource,
        score: popularityScore,
        rank: 0
      });
    }

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Assess popularity
   */
  assessPopularity(resource) {
    let popularity = 0.3; // Base score

    if (resource.downloads || resource.users) popularity += 0.2;
    if (resource.stars || resource.likes) popularity += 0.1;
    if (resource.forks || resource.contributions) popularity += 0.1;
    if (resource.reviews && resource.reviews.length > 5) popularity += 0.1;
    if (resource.shares || resource.views) popularity += 0.1;

    return Math.min(popularity, 1.0);
  }

  /**
   * Innovation ranking algorithm
   */
  async innovationRanking(resourceIds, options = {}) {
    const rankings = [];

    for (const resourceId of resourceIds) {
      const resource = this.consensusValidator.resources.get(resourceId);
      if (!resource) continue;

      const innovationScore = this.assessInnovation(resource);

      rankings.push({
        resource,
        score: innovationScore,
        rank: 0
      });
    }

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Composite ranking algorithm
   */
  async compositeRanking(resourceIds, options = {}) {
    const methods = ['multicriteria', 'performance', 'popularity', 'innovation'];
    const allRankings = new Map();

    // Get rankings from all methods
    for (const method of methods) {
      const algorithm = this.rankingAlgorithms.get(method);
      if (algorithm) {
        const rankings = await algorithm.rank(resourceIds, options);
        allRankings.set(method, rankings);
      }
    }

    return this.combineRankings(allRankings);
  }

  /**
   * Contextual ranking algorithm
   */
  async contextualRanking(resourceIds, options = {}) {
    const { context, requirements, preferences } = options;

    if (!context && !requirements) {
      // Fall back to multi-criteria ranking
      return await this.multiCriteriaRanking(resourceIds, options);
    }

    const rankings = [];

    for (const resourceId of resourceIds) {
      const resource = this.consensusValidator.resources.get(resourceId);
      if (!resource) continue;

      const contextScore = this.calculateContextualScore(resource, context, requirements, preferences);

      rankings.push({
        resource,
        score: contextScore,
        rank: 0
      });
    }

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Calculate contextual score
   */
  calculateContextualScore(resource, context, requirements, preferences) {
    let score = 0.5; // Base score

    // Match against requirements
    if (requirements) {
      for (const [requirement, weight] of Object.entries(requirements)) {
        if (resource[requirement] || resource.features?.includes(requirement)) {
          score += weight * 0.2;
        }
      }
    }

    // Match against preferences
    if (preferences) {
      for (const preference of preferences) {
        if (resource.tags?.includes(preference) || resource.categories?.includes(preference)) {
          score += 0.1;
        }
      }
    }

    // Context matching
    if (context) {
      const text = (resource.description + ' ' + (resource.tags || []).join(' ')).toLowerCase();
      if (text.includes(context.toLowerCase())) {
        score += 0.2;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Combine rankings from multiple algorithms
   */
  combineRankings(rankingsMap) {
    const resourceScores = new Map();

    // Collect scores from all algorithms
    for (const [algorithm, rankings] of rankingsMap) {
      const weight = 1 / rankingsMap.size; // Equal weight for now

      for (const ranking of rankings) {
        if (!resourceScores.has(ranking.resource.id)) {
          resourceScores.set(ranking.resource.id, {
            resource: ranking.resource,
            scores: {},
            totalScore: 0
          });
        }

        const resourceScore = resourceScores.get(ranking.resource.id);
        resourceScore.scores[algorithm] = ranking.score;
        resourceScore.totalScore += ranking.score * weight;
      }
    }

    // Convert to array and sort
    const combinedRankings = Array.from(resourceScores.values());
    combinedRankings.sort((a, b) => b.totalScore - a.totalScore);

    combinedRankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return combinedRankings;
  }

  /**
   * Assess usability
   */
  assessUsability(resource) {
    let usability = 0.5; // Base score

    if (resource.documentation || resource.readme) usability += 0.1;
    if (resource.examples || resource.usage) usability += 0.1;
    if (resource.tutorial || resource.quickstart) usability += 0.1;
    if (resource.api || resource.interface) usability += 0.1;
    if (resource.tests || resource.testCoverage) usability += 0.1;

    return Math.min(usability, 1.0);
  }

  /**
   * Detect hidden gems
   */
  async detectHiddenGems(resourceIds = null) {
    const resourcesToCheck = resourceIds || Array.from(this.consensusValidator.resources.keys());

    console.log(chalk.green('💎 Starting Hidden Gem Detection'));
    console.log(chalk.gray(`Checking ${resourcesToCheck.length} resources\n`));

    const hiddenGems = [];

    for (const resourceId of resourcesToCheck) {
      const resource = this.consensusValidator.resources.get(resourceId);
      if (!resource) continue;

      const gemScore = this.calculateHiddenGemScore(resource);

      if (gemScore.total > 0.7) { // Hidden gem threshold
        hiddenGems.push({
          resource,
          gemScore,
          reasons: this.getHiddenGemReasons(resource, gemScore)
        });

        console.log(chalk.yellow(`💎 Hidden gem detected: ${resource.name} (${gemScore.total.toFixed(2)})`));
      }
    }

    console.log(chalk.green(`✅ Found ${hiddenGems.length} hidden gems\n`));

    return {
      hiddenGems: hiddenGems.sort((a, b) => b.gemScore.total - a.gemScore.total),
      summary: {
        totalFound: hiddenGems.length,
        averageScore: hiddenGems.reduce((sum, gem) => sum + gem.gemScore.total, 0) / hiddenGems.length || 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate hidden gem score
   */
  calculateHiddenGemScore(resource) {
    const qualityData = this.qualityAssurance.qualityMetrics.get(resource.id);

    const criteria = {
      high_quality_low_popularity: {
        score: this.assessHighQualityLowPopularity(resource, qualityData),
        weight: 0.3
      },
      innovative_solution: {
        score: this.assessInnovation(resource),
        weight: 0.25
      },
      niche_applicability: {
        score: this.assessNicheApplicability(resource),
        weight: 0.2
      },
      emerging_potential: {
        score: this.assessEmergingPotential(resource),
        weight: 0.15
      },
      underrated_value: {
        score: this.assessUnderratedValue(resource, qualityData),
        weight: 0.1
      }
    };

    const totalScore = Object.entries(criteria).reduce((sum, [name, criterion]) => {
      return sum + (criterion.score * criterion.weight);
    }, 0);

    return {
      criteria,
      total: totalScore
    };
  }

  /**
   * Assess high quality but low popularity
   */
  assessHighQualityLowPopularity(resource, qualityData) {
    const quality = qualityData?.overallQuality || 0.5;
    const popularity = this.assessPopularity(resource);

    // High quality (>0.8) with low popularity (<0.5)
    if (quality > 0.8 && popularity < 0.5) {
      return Math.min((quality * 0.7 + (1 - popularity) * 0.3), 1.0);
    }

    return 0;
  }

  /**
   * Assess niche applicability
   */
  assessNicheApplicability(resource) {
    // Check for specialized use cases or domains
    const text = (resource.description + ' ' + (resource.features || []).join(' ')).toLowerCase();

    const nicheKeywords = [
      'specialized', 'domain-specific', 'niche', 'specific',
      'industry', 'vertical', 'targeted', 'focused'
    ];

    const matches = nicheKeywords.filter(keyword => text.includes(keyword)).length;
    return Math.min(matches / 3, 1.0);
  }

  /**
   * Assess emerging potential
   */
  assessEmergingPotential(resource) {
    let potential = 0.3; // Base score

    if (resource.experimental || resource.prototype) potential += 0.2;
    if (resource.research || resource.academic) potential += 0.2;
    if (resource.betä || resource.alpha) potential += 0.1;
    if (resource.roadmap || resource.planned) potential += 0.1;

    return Math.min(potential, 1.0);
  }

  /**
   * Assess underrated value
   */
  assessUnderratedValue(resource, qualityData) {
    const consensusScore = resource.consensusScore || 0.5;
    const actualQuality = qualityData?.overallQuality || 0.5;

    // If actual quality is much higher than consensus score
    if (actualQuality - consensusScore > 0.2) {
      return Math.min((actualQuality - consensusScore) * 2, 1.0);
    }

    return 0;
  }

  /**
   * Get reasons why something is a hidden gem
   */
  getHiddenGemReasons(resource, gemScore) {
    const reasons = [];

    for (const [criterion, data] of Object.entries(gemScore.criteria)) {
      if (data.score > 0.6) {
        reasons.push({
          criterion,
          score: data.score,
          description: this.getHiddenGemReasonDescription(criterion, resource)
        });
      }
    }

    return reasons;
  }

  /**
   * Get description for hidden gem reason
   */
  getHiddenGemReasonDescription(criterion, resource) {
    const descriptions = {
      high_quality_low_popularity: `High quality resource (${(this.qualityAssurance.qualityMetrics.get(resource.id)?.overallQuality * 100 || 0).toFixed(1)}%) with low popularity`,
      innovative_solution: `Innovative approach with novel features and unique solutions`,
      niche_applicability: `Specialized for specific use cases or domains`,
      emerging_potential: `Shows promise for future growth and adoption`,
      underrated_value: `Actual quality exceeds current recognition and consensus`
    };

    return descriptions[criterion] || 'Exceptional qualities detected';
  }

  /**
   * Generate classification summary
   */
  generateClassificationSummary(classificationResults) {
    const summary = {
      totalResources: classificationResults.size,
      schemes: {},
      distribution: {}
    };

    for (const [resourceId, classifications] of classificationResults) {
      for (const [scheme, classification] of Object.entries(classifications)) {
        if (!summary.schemes[scheme]) {
          summary.schemes[scheme] = {};
        }

        const primary = classification.primary;
        summary.schemes[scheme][primary] = (summary.schemes[scheme][primary] || 0) + 1;
      }
    }

    return summary;
  }

  /**
   * Generate ranking summary
   */
  generateRankingSummary(rankings) {
    if (!rankings || rankings.length === 0) {
      return { totalRanked: 0, averageScore: 0 };
    }

    const totalRanked = rankings.length;
    const averageScore = rankings.reduce((sum, ranking) => sum + ranking.score, 0) / totalRanked;
    const topScore = rankings[0].score;
    const bottomScore = rankings[rankings.length - 1].score;

    return {
      totalRanked,
      averageScore,
      topScore,
      bottomScore,
      scoreRange: topScore - bottomScore
    };
  }

  /**
   * Get top resources by category
   */
  getTopResourcesByCategory(category, limit = 10) {
    const resources = Array.from(this.consensusValidator.resources.values())
      .filter(resource => resource.type === category && resource.status === 'selected');

    return resources
      .sort((a, b) => (b.consensusScore || 0) - (a.consensusScore || 0))
      .slice(0, limit);
  }

  /**
   * Export classification and ranking data
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      classificationSchemes: Object.fromEntries(this.classificationSchemes),
      rankingAlgorithms: Object.fromEntries(this.rankingAlgorithms),
      resourceCategories: Object.fromEntries(this.resourceCategories),
      rankingResults: Array.from(this.rankingResults.entries())
    };
  }
}

module.exports = { ResourceClassifier };