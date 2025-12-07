/**
 * Ultra Swarm Enhanced - Consensus Validator
 * Multi-criteria consensus building framework for identifying top 20% resources
 */

const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class ConsensusValidator extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      truthScoreThreshold: options.truthScoreThreshold || 0.95,
      consensusThreshold: options.consensusThreshold || 0.8,
      topPercentage: options.topPercentage || 0.2,
      maxAgents: options.maxAgents || 50,
      votingTimeout: options.votingTimeout || 30000, // 30 seconds
      evaluationTimeout: options.evaluationTimeout || 120000, // 2 minutes
      ...options
    };

    // Core data structures
    this.agents = new Map();
    this.resources = new Map();
    this.votes = new Map();
    this.consensusResults = new Map();
    this.qualityMetrics = new Map();
    this.validationHistory = new Map();

    // Consensus algorithms
    this.algorithms = {
      weightedVoting: this.weightedVotingAlgorithm.bind(this),
      approvalVoting: this.approvalVotingAlgorithm.bind(this),
      bordaCount: this.bordaCountAlgorithm.bind(this),
      condorcet: this.condorcetAlgorithm.bind(this),
      consensusRanking: this.consensusRankingAlgorithm.bind(this)
    };

    // Quality dimensions
    this.qualityDimensions = {
      performance: { weight: 0.3, threshold: 0.8 },
      reliability: { weight: 0.25, threshold: 0.9 },
      novelty: { weight: 0.2, threshold: 0.7 },
      usefulness: { weight: 0.25, threshold: 0.8 }
    };

    // Resource categories
    this.resourceCategories = {
      tools: { evaluationCriteria: ['performance', 'reliability', 'usability'] },
      agents: { evaluationCriteria: ['performance', 'reliability', 'intelligence'] },
      skills: { evaluationCriteria: ['novelty', 'usefulness', 'applicability'] },
      workflows: { evaluationCriteria: ['efficiency', 'reliability', 'scalability'] },
      prompts: { evaluationCriteria: ['effectiveness', 'versatility', 'clarity'] }
    };

    // Initialize validation pipeline
    this.initializeValidationPipeline();
  }

  /**
   * Initialize the consensus validation pipeline
   */
  initializeValidationPipeline() {
    this.validationPipeline = [
      'resourceRegistration',
      'preliminaryScreening',
      'multiAgentEvaluation',
      'crossValidation',
      'consensusBuilding',
      'qualityAssurance',
      'finalSelection'
    ];

    console.log(chalk.green('✅ Consensus Validator initialized'));
    console.log(chalk.gray(`Truth Score Threshold: ${(this.config.truthScoreThreshold * 100).toFixed(1)}%`));
    console.log(chalk.gray(`Consensus Threshold: ${(this.config.consensusThreshold * 100).toFixed(1)}%`));
    console.log(chalk.gray(`Target Top Percentage: ${(this.config.topPercentage * 100).toFixed(1)}%\n`));
  }

  /**
   * Register a new resource for validation
   */
  async registerResource(resource) {
    const resourceId = uuidv4();
    const registeredResource = {
      id: resourceId,
      ...resource,
      status: 'pending',
      registeredAt: new Date(),
      evaluations: [],
      votes: [],
      qualityScore: 0,
      consensusScore: 0
    };

    this.resources.set(resourceId, registeredResource);

    console.log(chalk.cyan(`📝 Resource registered: ${resource.name} (${resourceId})`));
    this.emit('resourceRegistered', registeredResource);

    return resourceId;
  }

  /**
   * Register an agent for consensus participation
   */
  async registerAgent(agent) {
    const agentId = uuidv4();
    const registeredAgent = {
      id: agentId,
      ...agent,
      reputation: agent.reputation || 0.5,
      expertise: agent.expertise || [],
      votingPower: this.calculateVotingPower(agent),
      registeredAt: new Date(),
      participationHistory: []
    };

    this.agents.set(agentId, registeredAgent);

    console.log(chalk.blue(`🤖 Agent registered: ${agent.name} (${agentId})`));
    this.emit('agentRegistered', registeredAgent);

    return agentId;
  }

  /**
   * Calculate voting power based on agent reputation and expertise
   */
  calculateVotingPower(agent) {
    const basePower = 1.0;
    const reputationBonus = agent.reputation * 0.5;
    const expertiseBonus = agent.expertise ? agent.expertise.length * 0.1 : 0;

    return Math.min(basePower + reputationBonus + expertiseBonus, 3.0);
  }

  /**
   * Start consensus validation for a set of resources
   */
  async startConsensusValidation(resourceIds = null, agentIds = null) {
    const resourcesToValidate = resourceIds || Array.from(this.resources.keys());
    const participatingAgents = agentIds || Array.from(this.agents.keys());

    console.log(chalk.magenta(`🔍 Starting consensus validation for ${resourcesToValidate.length} resources`));
    console.log(chalk.gray(`Participating agents: ${participatingAgents.length}\n`));

    const validationSession = {
      id: uuidv4(),
      startTime: new Date(),
      resources: resourcesToValidate,
      agents: participatingAgents,
      status: 'in_progress',
      results: {}
    };

    try {
      // Phase 1: Preliminary Screening
      await this.preliminaryScreening(resourcesToValidate);

      // Phase 2: Multi-Agent Evaluation
      await this.multiAgentEvaluation(resourcesToValidate, participatingAgents);

      // Phase 3: Cross Validation
      await this.crossValidation(resourcesToValidate, participatingAgents);

      // Phase 4: Consensus Building
      await this.buildConsensus(resourcesToValidate, participatingAgents);

      // Phase 5: Quality Assurance
      await this.qualityAssuranceCheck(resourcesToValidate);

      // Phase 6: Final Selection
      const topResources = await this.selectTopResources(resourcesToValidate);

      validationSession.status = 'completed';
      validationSession.endTime = new Date();
      validationSession.results = topResources;

      console.log(chalk.green('✅ Consensus validation completed successfully!'));
      this.emit('validationCompleted', validationSession);

      return {
        session: validationSession,
        topResources,
        statistics: this.generateValidationStatistics(resourcesToValidate)
      };

    } catch (error) {
      validationSession.status = 'failed';
      validationSession.error = error.message;
      validationSession.endTime = new Date();

      console.error(chalk.red('❌ Consensus validation failed:'), error.message);
      this.emit('validationFailed', validationSession);
      throw error;
    }
  }

  /**
   * Phase 1: Preliminary screening of resources
   */
  async preliminaryScreening(resourceIds) {
    console.log(chalk.yellow('🔍 Phase 1: Preliminary Screening'));

    const screenedResources = [];

    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      if (!resource) continue;

      // Basic quality checks
      const screeningResult = await this.performScreening(resource);

      if (screeningResult.passed) {
        resource.status = 'screened';
        resource.screeningResult = screeningResult;
        screenedResources.push(resourceId);
        console.log(chalk.green(`  ✅ ${resource.name} passed screening`));
      } else {
        resource.status = 'rejected';
        resource.rejectionReason = screeningResult.reason;
        console.log(chalk.red(`  ❌ ${resource.name} rejected: ${screeningResult.reason}`));
      }
    }

    console.log(chalk.gray(`Screening complete: ${screenedResources.length}/${resourceIds.length} resources passed\n`));
    return screenedResources;
  }

  /**
   * Perform detailed screening of a resource
   */
  async performScreening(resource) {
    const checks = [
      { name: 'completeness', check: () => this.checkCompleteness(resource) },
      { name: 'security', check: () => this.checkSecurity(resource) },
      { name: 'documentation', check: () => this.checkDocumentation(resource) },
      { name: 'functionality', check: () => this.checkFunctionality(resource) }
    ];

    const results = [];
    for (const { name, check } of checks) {
      try {
        const result = await check();
        results.push({ name, ...result });
      } catch (error) {
        results.push({ name, passed: false, error: error.message });
      }
    }

    const passedCount = results.filter(r => r.passed).length;
    const passed = passedCount >= results.length * 0.75; // 75% of checks must pass

    return {
      passed,
      results,
      score: passedCount / results.length,
      reason: passed ? null : `Failed ${results.length - passedCount} screening checks`
    };
  }

  /**
   * Check resource completeness
   */
  async checkCompleteness(resource) {
    const requiredFields = ['name', 'type', 'description'];
    const missingFields = requiredFields.filter(field => !resource[field]);

    return {
      passed: missingFields.length === 0,
      details: missingFields.length > 0 ? `Missing fields: ${missingFields.join(', ')}` : 'All required fields present'
    };
  }

  /**
   * Check resource security
   */
  async checkSecurity(resource) {
    // Basic security checks
    const securityIssues = [];

    if (resource.code && resource.code.includes('eval(')) {
      securityIssues.push('Contains eval() usage');
    }

    if (resource.dependencies) {
      const suspiciousDeps = resource.dependencies.filter(dep =>
        dep.includes('http:') || dep.includes('insecure')
      );
      securityIssues.push(...suspiciousDeps.map(dep => `Suspicious dependency: ${dep}`));
    }

    return {
      passed: securityIssues.length === 0,
      details: securityIssues.length > 0 ? securityIssues.join(', ') : 'No security issues detected'
    };
  }

  /**
   * Check resource documentation
   */
  async checkDocumentation(resource) {
    const docScore = this.calculateDocumentationScore(resource);

    return {
      passed: docScore >= 0.6,
      score: docScore,
      details: `Documentation quality: ${(docScore * 100).toFixed(1)}%`
    };
  }

  /**
   * Calculate documentation quality score
   */
  calculateDocumentationScore(resource) {
    let score = 0;
    const maxScore = 5;

    if (resource.description && resource.description.length > 50) score++;
    if (resource.readme || resource.documentation) score++;
    if (resource.examples || resource.usage) score++;
    if (resource.api || resource.interface) score++;
    if (resource.tests || resource.testCoverage) score++;

    return score / maxScore;
  }

  /**
   * Check resource functionality
   */
  async checkFunctionality(resource) {
    // For now, perform basic functionality checks
    // In a real implementation, this would involve actual testing

    const hasCode = resource.code || resource.implementation;
    const hasInterface = resource.api || resource.interface || resource.methods;

    return {
      passed: hasCode && hasInterface,
      details: hasCode && hasInterface ? 'Functional implementation present' : 'Missing implementation or interface'
    };
  }

  /**
   * Phase 2: Multi-agent evaluation
   */
  async multiAgentEvaluation(resourceIds, agentIds) {
    console.log(chalk.cyan('🤖 Phase 2: Multi-Agent Evaluation'));

    const evaluationPromises = [];

    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      if (!resource || resource.status !== 'screened') continue;

      for (const agentId of agentIds) {
        const agent = this.agents.get(agentId);
        if (!agent) continue;

        evaluationPromises.push(
          this.evaluateResource(resource, agent)
        );
      }
    }

    const evaluations = await Promise.allSettled(evaluationPromises);
    const successfulEvaluations = evaluations
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    console.log(chalk.green(`  ✅ Completed ${successfulEvaluations.length} agent evaluations\n`));
    return successfulEvaluations;
  }

  /**
   * Single agent evaluation of a resource
   */
  async evaluateResource(resource, agent) {
    // Simulate evaluation time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const category = this.resourceCategories[resource.type];
    const evaluation = {
      resourceId: resource.id,
      agentId: agent.id,
      timestamp: new Date(),
      scores: {},
      overallScore: 0,
      confidence: 0.8 + Math.random() * 0.2,
      comments: this.generateEvaluationComments(resource, agent)
    };

    // Evaluate based on category criteria
    for (const criterion of category.evaluationCriteria) {
      const dimension = this.qualityDimensions[criterion] || { weight: 0.25 };
      const score = this.generateCriterionScore(resource, criterion, agent);
      evaluation.scores[criterion] = {
        score,
        weight: dimension.weight,
        weightedScore: score * dimension.weight
      };
    }

    // Calculate overall score
    evaluation.overallScore = Object.values(evaluation.scores)
      .reduce((sum, score) => sum + score.weightedScore, 0);

    // Store evaluation
    resource.evaluations.push(evaluation);
    agent.participationHistory.push({
      resourceId: resource.id,
      evaluation,
      timestamp: new Date()
    });

    this.updateQualityMetrics(resource.id, evaluation);

    return evaluation;
  }

  /**
   * Generate criterion score for evaluation
   */
  generateCriterionScore(resource, criterion, agent) {
    // Base score with randomization
    let baseScore = 0.6 + Math.random() * 0.3;

    // Adjust based on agent expertise
    if (agent.expertise && agent.expertise.includes(resource.type)) {
      baseScore += 0.1;
    }

    // Adjust based on resource characteristics
    if (resource[criterion] || resource.features?.includes(criterion)) {
      baseScore += 0.1;
    }

    return Math.min(baseScore, 1.0);
  }

  /**
   * Generate evaluation comments
   */
  generateEvaluationComments(resource, agent) {
    const comments = [
      `${resource.name} shows good ${resource.type} characteristics`,
      `Performance appears adequate for intended use case`,
      `Implementation follows best practices`,
      `Documentation could be improved`
    ];

    return comments.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  /**
   * Update quality metrics for a resource
   */
  updateQualityMetrics(resourceId, evaluation) {
    if (!this.qualityMetrics.has(resourceId)) {
      this.qualityMetrics.set(resourceId, {
        averageScore: 0,
        scoreHistory: [],
        consensusScore: 0,
        truthScore: 0,
        agentCount: 0
      });
    }

    const metrics = this.qualityMetrics.get(resourceId);
    metrics.scoreHistory.push(evaluation.overallScore);
    metrics.agentCount++;

    // Calculate average score
    metrics.averageScore = metrics.scoreHistory.reduce((a, b) => a + b, 0) / metrics.scoreHistory.length;

    // Calculate truth score (consistency across evaluations)
    metrics.truthScore = this.calculateTruthScore(metrics.scoreHistory);
  }

  /**
   * Calculate truth score based on evaluation consistency
   */
  calculateTruthScore(scores) {
    if (scores.length < 2) return 0.5;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Higher consistency (lower standard deviation) = higher truth score
    const consistency = Math.max(0, 1 - standardDeviation);
    const agreement = Math.min(mean, 1 - mean) * 2; // Agreement around middle

    return (consistency * 0.7 + agreement * 0.3);
  }

  /**
   * Phase 3: Cross validation between agents
   */
  async crossValidation(resourceIds, agentIds) {
    console.log(chalk.blue('🔄 Phase 3: Cross Validation'));

    const crossValidations = [];

    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      if (!resource || resource.evaluations.length < 2) continue;

      const validation = await this.performCrossValidation(resource);
      crossValidations.push(validation);

      console.log(chalk.gray(`  🔄 Cross-validated ${resource.name}: consistency ${(validation.consistency * 100).toFixed(1)}%`));
    }

    console.log(chalk.green(`  ✅ Completed ${crossValidations.length} cross validations\n`));
    return crossValidations;
  }

  /**
   * Perform cross validation on a resource
   */
  async performCrossValidation(resource) {
    const evaluations = resource.evaluations;

    // Calculate consistency metrics
    const scores = evaluations.map(e => e.overallScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    const consistency = Math.max(0, 1 - standardDeviation);

    // Identify outliers
    const outliers = evaluations.filter(e =>
      Math.abs(e.overallScore - mean) > standardDeviation * 2
    );

    return {
      resourceId: resource.id,
      consistency,
      meanScore: mean,
      standardDeviation,
      outliers: outliers.length,
      validated: consistency >= 0.7 && outliers.length <= evaluations.length * 0.2
    };
  }

  /**
   * Phase 4: Consensus building using multiple algorithms
   */
  async buildConsensus(resourceIds, agentIds) {
    console.log(chalk.magenta('🤝 Phase 4: Consensus Building'));

    const consensusResults = [];

    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      if (!resource || resource.evaluations.length === 0) continue;

      const consensus = await this.calculateConsensus(resource);
      consensusResults.push(consensus);

      resource.consensusScore = consensus.finalScore;
      resource.consensusDetails = consensus;

      console.log(chalk.gray(`  🤝 Consensus for ${resource.name}: ${(consensus.finalScore * 100).toFixed(1)}%`));
    }

    console.log(chalk.green(`  ✅ Built consensus for ${consensusResults.length} resources\n`));
    return consensusResults;
  }

  /**
   * Calculate consensus using multiple algorithms
   */
  async calculateConsensus(resource) {
    const evaluations = resource.evaluations;
    const algorithms = ['weightedVoting', 'approvalVoting', 'consensusRanking'];

    const results = {};

    for (const algorithm of algorithms) {
      results[algorithm] = await this.algorithms[algorithm](evaluations);
    }

    // Combine algorithm results
    const finalScore = Object.values(results).reduce((a, b) => a + b, 0) / algorithms.length;

    return {
      resourceId: resource.id,
      algorithms: results,
      finalScore,
      consensus: finalScore >= this.config.consensusThreshold,
      evaluationCount: evaluations.length
    };
  }

  /**
   * Weighted voting algorithm
   */
  async weightedVotingAlgorithm(evaluations) {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const evaluation of evaluations) {
      const agent = this.agents.get(evaluation.agentId);
      const weight = agent ? agent.votingPower : 1.0;

      totalWeightedScore += evaluation.overallScore * weight;
      totalWeight += weight;
    }

    return totalWeight / totalWeight;
  }

  /**
   * Approval voting algorithm
   */
  async approvalVotingAlgorithm(evaluations) {
    const threshold = 0.7; // Approval threshold
    const approvals = evaluations.filter(e => e.overallScore >= threshold).length;

    return approvals / evaluations.length;
  }

  /**
   * Borda count algorithm
   */
  async bordaCountAlgorithm(evaluations) {
    // Sort evaluations by score
    const sorted = [...evaluations].sort((a, b) => b.overallScore - a.overallScore);
    const n = evaluations.length;

    let totalPoints = 0;
    for (let i = 0; i < sorted.length; i++) {
      totalPoints += (n - i);
    }

    return totalPoints / (n * (n + 1) / 2);
  }

  /**
   * Condorcet method algorithm
   */
  async condorcetAlgorithm(evaluations) {
    // Simplified Condorcet - check if resource wins against alternatives
    const meanScore = evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length;
    return meanScore;
  }

  /**
   * Consensus ranking algorithm
   */
  async consensusRankingAlgorithm(evaluations) {
    // Calculate consensus based on ranking consistency
    const scores = evaluations.map(e => e.overallScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const median = scores.sort()[Math.floor(scores.length / 2)];

    return (mean + median) / 2;
  }

  /**
   * Phase 5: Quality assurance checks
   */
  async qualityAssuranceCheck(resourceIds) {
    console.log(chalk.red('🛡️ Phase 5: Quality Assurance'));

    const qaResults = [];

    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      if (!resource) continue;

      const qaResult = await this.performQualityAssurance(resource);
      qaResults.push(qaResult);

      if (qaResult.passed) {
        console.log(chalk.green(`  ✅ QA passed for ${resource.name}`));
        resource.status = 'qa_passed';
      } else {
        console.log(chalk.red(`  ❌ QA failed for ${resource.name}: ${qaResult.reason}`));
        resource.status = 'qa_failed';
      }
    }

    console.log(chalk.green(`  ✅ QA completed for ${qaResults.length} resources\n`));
    return qaResults;
  }

  /**
   * Perform quality assurance on a resource
   */
  async performQualityAssurance(resource) {
    const metrics = this.qualityMetrics.get(resource.id);
    if (!metrics) {
      return { passed: false, reason: 'No quality metrics available' };
    }

    const checks = [
      { name: 'truth_score', value: metrics.truthScore, threshold: this.config.truthScoreThreshold },
      { name: 'consensus_score', value: resource.consensusScore, threshold: this.config.consensusThreshold },
      { name: 'evaluation_count', value: metrics.agentCount, threshold: 3 },
      { name: 'average_score', value: metrics.averageScore, threshold: 0.7 }
    ];

    const failedChecks = checks.filter(check => check.value < check.threshold);

    return {
      passed: failedChecks.length === 0,
      checks,
      failedChecks,
      reason: failedChecks.length > 0 ?
        `Failed checks: ${failedChecks.map(c => c.name).join(', ')}` : null
    };
  }

  /**
   * Phase 6: Select top resources
   */
  async selectTopResources(resourceIds) {
    console.log(chalk.yellow('🏆 Phase 6: Final Selection'));

    // Filter resources that passed all phases
    const eligibleResources = resourceIds
      .map(id => this.resources.get(id))
      .filter(resource => resource && resource.status === 'qa_passed');

    if (eligibleResources.length === 0) {
      console.log(chalk.yellow('  ⚠️ No resources passed all validation phases'));
      return [];
    }

    // Sort by final consensus score
    eligibleResources.sort((a, b) => b.consensusScore - a.consensusScore);

    // Select top percentage
    const topCount = Math.max(1, Math.ceil(eligibleResources.length * this.config.topPercentage));
    const topResources = eligibleResources.slice(0, topCount);

    console.log(chalk.green(`  🏆 Selected ${topResources.length} top resources (${(topResources.length / eligibleResources.length * 100).toFixed(1)}%)`));

    for (const resource of topResources) {
      console.log(chalk.gray(`    • ${resource.name}: ${(resource.consensusScore * 100).toFixed(1)}% consensus`));
      resource.status = 'selected';
    }

    console.log();
    return topResources;
  }

  /**
   * Generate validation statistics
   */
  generateValidationStatistics(resourceIds) {
    const resources = resourceIds.map(id => this.resources.get(id)).filter(Boolean);

    const stats = {
      total: resources.length,
      byStatus: {},
      byType: {},
      averageConsensusScore: 0,
      averageTruthScore: 0,
      evaluationCount: 0
    };

    for (const resource of resources) {
      // Count by status
      stats.byStatus[resource.status] = (stats.byStatus[resource.status] || 0) + 1;

      // Count by type
      stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;

      // Aggregate scores
      if (resource.consensusScore) {
        stats.averageConsensusScore += resource.consensusScore;
      }

      if (resource.evaluations) {
        stats.evaluationCount += resource.evaluations.length;
      }

      const metrics = this.qualityMetrics.get(resource.id);
      if (metrics && metrics.truthScore) {
        stats.averageTruthScore += metrics.truthScore;
      }
    }

    // Calculate averages
    const eligibleCount = resources.filter(r => r.consensusScore).length;
    if (eligibleCount > 0) {
      stats.averageConsensusScore /= eligibleCount;
    }

    const metricsCount = resources.filter(r => this.qualityMetrics.has(r.id)).length;
    if (metricsCount > 0) {
      stats.averageTruthScore /= metricsCount;
    }

    return stats;
  }

  /**
   * Get consensus results for a resource
   */
  getConsensusResult(resourceId) {
    const resource = this.resources.get(resourceId);
    const metrics = this.qualityMetrics.get(resourceId);

    return {
      resource,
      metrics,
      consensus: resource?.consensusDetails,
      status: resource?.status
    };
  }

  /**
   * Get all top resources across all categories
   */
  getTopResources() {
    return Array.from(this.resources.values())
      .filter(resource => resource.status === 'selected')
      .sort((a, b) => b.consensusScore - a.consensusScore);
  }

  /**
   * Update agent reputation based on participation quality
   */
  async updateAgentReputation(agentId, performanceMetrics) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Calculate reputation change based on performance
    const reputationChange = (performanceMetrics.accuracy - 0.5) * 0.1;
    agent.reputation = Math.max(0, Math.min(1, agent.reputation + reputationChange));
    agent.votingPower = this.calculateVotingPower(agent);

    this.emit('agentReputationUpdated', { agentId, newReputation: agent.reputation });
  }

  /**
   * Export consensus data for analysis
   */
  exportConsensusData() {
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      resources: Array.from(this.resources.values()),
      agents: Array.from(this.agents.values()),
      qualityMetrics: Array.from(this.qualityMetrics.entries()),
      consensusResults: Array.from(this.consensusResults.entries())
    };
  }
}

module.exports = { ConsensusValidator };