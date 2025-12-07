/**
 * Quality Assurance Mechanisms
 * Truth scoring, continuous monitoring, and quality validation for Ultra Swarm
 */

const chalk = require('chalk');
const { EventEmitter } = require('events');

class QualityAssurance extends EventEmitter {
  constructor(consensusValidator, options = {}) {
    super();
    this.consensusValidator = consensusValidator;

    this.config = {
      truthScoreThreshold: options.truthScoreThreshold || 0.95,
      qualityThreshold: options.qualityThreshold || 0.8,
      monitoringInterval: options.monitoringInterval || 60000, // 1 minute
      driftThreshold: options.driftThreshold || 0.1,
      stabilityWindow: options.stabilityWindow || 10,
      reevaluationFrequency: options.reevaluationFrequency || 5,
      ...options
    };

    this.qualityMetrics = new Map();
    this.truthScores = new Map();
    this.monitoringData = new Map();
    this.driftDetection = new Map();
    this.qualityHistory = new Map();
    this.alerts = [];

    this.qualityDimensions = {
      accuracy: { weight: 0.3, threshold: 0.95 },
      consistency: { weight: 0.25, threshold: 0.9 },
      reliability: { weight: 0.2, threshold: 0.85 },
      completeness: { weight: 0.15, threshold: 0.8 },
      timeliness: { weight: 0.1, threshold: 0.7 }
    };

    this.continuousMonitoringActive = false;
    this.monitoringIntervalId = null;

    this.initializeQualityFramework();
  }

  /**
   * Initialize the quality assurance framework
   */
  initializeQualityFramework() {
    console.log(chalk.green('🛡️ Quality Assurance Framework initialized'));
    console.log(chalk.gray(`Truth Score Threshold: ${(this.config.truthScoreThreshold * 100).toFixed(1)}%`));
    console.log(chalk.gray(`Quality Threshold: ${(this.config.qualityThreshold * 100).toFixed(1)}%`));
    console.log(chalk.gray(`Monitoring Interval: ${this.config.monitoringInterval}ms\n`));

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for quality monitoring
   */
  setupEventListeners() {
    this.consensusValidator.on('resourceRegistered', (resource) => {
      this.initializeQualityTracking(resource);
    });

    this.consensusValidator.on('validationCompleted', (session) => {
      this.processValidationResults(session);
    });

    this.consensusValidator.on('agentReputationUpdated', (data) => {
      this.recalculateRelatedQualityScores(data.agentId);
    });
  }

  /**
   * Initialize quality tracking for a resource
   */
  initializeQualityTracking(resource) {
    const qualityData = {
      resourceId: resource.id,
      dimensions: {},
      overallQuality: 0,
      truthScore: 0,
      history: [],
      alerts: [],
      lastUpdated: new Date(),
      stability: 0,
      drift: 0,
      reevaluationCount: 0
    };

    // Initialize dimensions
    for (const [dimension, config] of Object.entries(this.qualityDimensions)) {
      qualityData.dimensions[dimension] = {
        score: 0,
        history: [],
        trend: 'stable',
        confidence: 0.5
      };
    }

    this.qualityMetrics.set(resource.id, qualityData);

    console.log(chalk.cyan(`📊 Quality tracking initialized for: ${resource.name}`));
  }

  /**
   * Process validation results and update quality metrics
   */
  async processValidationResults(validationSession) {
    console.log(chalk.blue('📈 Processing validation results for quality metrics'));

    for (const resource of validationSession.results.topResources) {
      await this.updateQualityMetrics(resource.id, validationSession);
    }

    console.log(chalk.green(`✅ Quality metrics updated for ${validationSession.results.topResources.length} resources\n`));
  }

  /**
   * Update quality metrics for a specific resource
   */
  async updateQualityMetrics(resourceId, validationSession) {
    const qualityData = this.qualityMetrics.get(resourceId);
    if (!qualityData) return;

    const resource = this.consensusValidator.resources.get(resourceId);
    if (!resource) return;

    // Update each quality dimension
    for (const [dimension, config] of Object.entries(this.qualityDimensions)) {
      const dimensionScore = await this.calculateDimensionScore(resource, dimension, validationSession);

      qualityData.dimensions[dimension].score = dimensionScore;
      qualityData.dimensions[dimension].history.push({
        score: dimensionScore,
        timestamp: new Date(),
        validationSession: validationSession.id
      });

      // Keep only recent history
      if (qualityData.dimensions[dimension].history.length > 20) {
        qualityData.dimensions[dimension].history.shift();
      }

      // Calculate trend
      qualityData.dimensions[dimension].trend = this.calculateTrend(
        qualityData.dimensions[dimension].history
      );

      // Calculate confidence
      qualityData.dimensions[dimension].confidence = this.calculateConfidence(
        qualityData.dimensions[dimension].history
      );
    }

    // Calculate overall quality score
    qualityData.overallQuality = this.calculateOverallQuality(qualityData.dimensions);

    // Calculate truth score
    qualityData.truthScore = this.calculateTruthScore(resource, qualityData);

    // Update stability and drift
    qualityData.stability = this.calculateStability(qualityData);
    qualityData.drift = this.calculateDrift(qualityData);

    // Add to history
    qualityData.history.push({
      overallQuality: qualityData.overallQuality,
      truthScore: qualityData.truthScore,
      timestamp: new Date(),
      validationSession: validationSession.id
    });

    // Keep only recent history
    if (qualityData.history.length > 50) {
      qualityData.history.shift();
    }

    qualityData.lastUpdated = new Date();

    // Check for quality alerts
    this.checkQualityAlerts(resourceId, qualityData);

    console.log(chalk.gray(`  📊 ${resource.name}: Quality ${(qualityData.overallQuality * 100).toFixed(1)}%, Truth ${(qualityData.truthScore * 100).toFixed(1)}%`));

    this.emit('qualityUpdated', { resourceId, qualityData });
  }

  /**
   * Calculate score for a specific quality dimension
   */
  async calculateDimensionScore(resource, dimension, validationSession) {
    const metrics = this.consensusValidator.qualityMetrics.get(resource.id);
    if (!metrics) return 0.5;

    let score = 0;

    switch (dimension) {
      case 'accuracy':
        score = this.calculateAccuracyScore(resource, metrics);
        break;
      case 'consistency':
        score = this.calculateConsistencyScore(resource, metrics);
        break;
      case 'reliability':
        score = this.calculateReliabilityScore(resource, metrics);
        break;
      case 'completeness':
        score = this.calculateCompletenessScore(resource);
        break;
      case 'timeliness':
        score = this.calculateTimelinessScore(resource, validationSession);
        break;
      default:
        score = 0.5;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate accuracy score
   */
  calculateAccuracyScore(resource, metrics) {
    const evaluations = resource.evaluations;
    if (evaluations.length === 0) return 0.5;

    // Accuracy based on convergence of evaluations and truth score
    const convergenceScore = metrics.truthScore || 0.5;
    const averageScore = evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length;

    return (convergenceScore * 0.6 + averageScore * 0.4);
  }

  /**
   * Calculate consistency score
   */
  calculateConsistencyScore(resource, metrics) {
    const evaluations = resource.evaluations;
    if (evaluations.length < 2) return 0.5;

    const scores = evaluations.map(e => e.overallScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - standardDeviation);
  }

  /**
   * Calculate reliability score
   */
  calculateReliabilityScore(resource, metrics) {
    // Reliability based on agent reputation and evaluation stability
    const evaluations = resource.evaluations;
    if (evaluations.length === 0) return 0.5;

    let totalReputation = 0;
    for (const evaluation of evaluations) {
      const agent = this.consensusValidator.agents.get(evaluation.agentId);
      if (agent) {
        totalReputation += agent.reputation;
      }
    }

    const averageReputation = totalReputation / evaluations.length;
    const stabilityScore = this.calculateStabilityScore(evaluations);

    return (averageReputation * 0.7 + stabilityScore * 0.3);
  }

  /**
   * Calculate completeness score
   */
  calculateCompletenessScore(resource) {
    let completenessScore = 0;
    const factors = 5;

    // Check for required components
    if (resource.description && resource.description.length > 50) completenessScore++;
    if (resource.code || resource.implementation) completenessScore++;
    if (resource.documentation || resource.readme) completenessScore++;
    if (resource.examples || resource.usage) completenessScore++;
    if (resource.tests || resource.testCoverage) completenessScore++;

    return completenessScore / factors;
  }

  /**
   * Calculate timeliness score
   */
  calculateTimelinessScore(resource, validationSession) {
    // Timeliness based on how recent the validation is and resource age
    const now = new Date();
    const validationTime = new Date(validationSession.endTime || validationSession.startTime);
    const resourceAge = now - new Date(resource.registeredAt);
    const validationAge = now - validationTime;

    // Newer is better, but recent validation also matters
    const ageScore = Math.max(0, 1 - (resourceAge / (30 * 24 * 60 * 60 * 1000))); // 30 days
    const validationScore = Math.max(0, 1 - (validationAge / (7 * 24 * 60 * 60 * 1000))); // 7 days

    return (ageScore * 0.3 + validationScore * 0.7);
  }

  /**
   * Calculate stability score for evaluations
   */
  calculateStabilityScore(evaluations) {
    if (evaluations.length < 3) return 0.5;

    // Check if evaluations are stable over time
    const sortedEvaluations = [...evaluations].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let totalVariation = 0;
    for (let i = 1; i < sortedEvaluations.length; i++) {
      const variation = Math.abs(sortedEvaluations[i].overallScore - sortedEvaluations[i-1].overallScore);
      totalVariation += variation;
    }

    const averageVariation = totalVariation / (sortedEvaluations.length - 1);
    return Math.max(0, 1 - averageVariation);
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQuality(dimensions) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [dimension, data] of Object.entries(dimensions)) {
      const config = this.qualityDimensions[dimension];
      totalScore += data.score * config.weight;
      totalWeight += config.weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate comprehensive truth score
   */
  calculateTruthScore(resource, qualityData) {
    const evaluations = resource.evaluations;
    if (evaluations.length === 0) return 0;

    // Multiple factors contribute to truth score
    const consistencyFactor = qualityData.dimensions.consistency.score;
    const accuracyFactor = qualityData.dimensions.accuracy.score;
    const reliabilityFactor = qualityData.dimensions.reliability.score;
    const consensusFactor = resource.consensusScore || 0.5;

    // Weight truth score heavily on consistency and reliability
    const truthScore = (
      consistencyFactor * 0.35 +
      reliabilityFactor * 0.35 +
      accuracyFactor * 0.2 +
      consensusFactor * 0.1
    );

    return Math.max(0, Math.min(1, truthScore));
  }

  /**
   * Calculate trend for dimension history
   */
  calculateTrend(history) {
    if (history.length < 3) return 'stable';

    const recentScores = history.slice(-5).map(h => h.score);
    const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;

    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Calculate confidence for dimension history
   */
  calculateConfidence(history) {
    if (history.length < 2) return 0.5;

    const scores = history.map(h => h.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Higher sample size and lower variance = higher confidence
    const sampleSizeConfidence = Math.min(1, history.length / 10);
    const varianceConfidence = Math.max(0, 1 - standardDeviation);

    return (sampleSizeConfidence * 0.4 + varianceConfidence * 0.6);
  }

  /**
   * Calculate stability for quality data
   */
  calculateStability(qualityData) {
    if (qualityData.history.length < 3) return 0.5;

    const recentHistory = qualityData.history.slice(-this.config.stabilityWindow);
    const scores = recentHistory.map(h => h.overallQuality);

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    return Math.max(0, 1 - standardDeviation);
  }

  /**
   * Calculate drift for quality data
   */
  calculateDrift(qualityData) {
    if (qualityData.history.length < 2) return 0;

    const latest = qualityData.history[qualityData.history.length - 1].overallQuality;
    const baseline = qualityData.history[0].overallQuality;

    return Math.abs(latest - baseline);
  }

  /**
   * Check for quality alerts
   */
  checkQualityAlerts(resourceId, qualityData) {
    const alerts = [];

    // Truth score threshold alert
    if (qualityData.truthScore < this.config.truthScoreThreshold) {
      alerts.push({
        type: 'truth_score_low',
        severity: 'high',
        message: `Truth score ${(qualityData.truthScore * 100).toFixed(1)}% below threshold ${(this.config.truthScoreThreshold * 100).toFixed(1)}%`,
        resourceId,
        timestamp: new Date()
      });
    }

    // Quality threshold alert
    if (qualityData.overallQuality < this.config.qualityThreshold) {
      alerts.push({
        type: 'quality_low',
        severity: 'medium',
        message: `Quality score ${(qualityData.overallQuality * 100).toFixed(1)}% below threshold ${(this.config.qualityThreshold * 100).toFixed(1)}%`,
        resourceId,
        timestamp: new Date()
      });
    }

    // Drift alert
    if (qualityData.drift > this.config.driftThreshold) {
      alerts.push({
        type: 'drift_detected',
        severity: 'medium',
        message: `Quality drift ${(qualityData.drift * 100).toFixed(1)}% exceeds threshold ${(this.config.driftThreshold * 100).toFixed(1)}%`,
        resourceId,
        timestamp: new Date()
      });
    }

    // Declining trend alert
    for (const [dimension, data] of Object.entries(qualityData.dimensions)) {
      if (data.trend === 'declining') {
        alerts.push({
          type: 'dimension_declining',
          severity: 'low',
          message: `${dimension} dimension is declining`,
          resourceId,
          dimension,
          timestamp: new Date()
        });
      }
    }

    // Add alerts to quality data
    qualityData.alerts.push(...alerts);

    // Emit alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.emit('qualityAlert', alert);
    });
  }

  /**
   * Start continuous quality monitoring
   */
  startContinuousMonitoring() {
    if (this.continuousMonitoringActive) return;

    this.continuousMonitoringActive = true;
    this.monitoringIntervalId = setInterval(() => {
      this.performMonitoringCycle();
    }, this.config.monitoringInterval);

    console.log(chalk.green('🔄 Continuous quality monitoring started'));
  }

  /**
   * Stop continuous quality monitoring
   */
  stopContinuousMonitoring() {
    if (!this.continuousMonitoringActive) return;

    this.continuousMonitoringActive = false;
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    console.log(chalk.yellow('⏹️ Continuous quality monitoring stopped'));
  }

  /**
   * Perform a monitoring cycle
   */
  async performMonitoringCycle() {
    console.log(chalk.blue('🔍 Performing quality monitoring cycle'));

    for (const [resourceId, qualityData] of this.qualityMetrics) {
      await this.monitorResourceQuality(resourceId, qualityData);
    }

    // Clean old alerts
    this.cleanupOldAlerts();

    console.log(chalk.gray(`  📊 Monitoring cycle complete. ${this.alerts.length} active alerts\n`));
  }

  /**
   * Monitor quality of a specific resource
   */
  async monitorResourceQuality(resourceId, qualityData) {
    const resource = this.consensusValidator.resources.get(resourceId);
    if (!resource) return;

    // Check for need of reevaluation
    if (this.needsReevaluation(qualityData)) {
      await this.scheduleReevaluation(resourceId);
    }

    // Update monitoring data
    this.monitoringData.set(resourceId, {
      lastChecked: new Date(),
      quality: qualityData.overallQuality,
      truthScore: qualityData.truthScore,
      stability: qualityData.stability,
      drift: qualityData.drift
    });
  }

  /**
   * Check if resource needs reevaluation
   */
  needsReevaluation(qualityData) {
    const now = new Date();
    const timeSinceLastUpdate = now - qualityData.lastUpdated;
    const daysSinceUpdate = timeSinceLastUpdate / (24 * 60 * 60 * 1000);

    // Need reevaluation if:
    // 1. Quality is declining
    // 2. Drift exceeds threshold
    // 3. Too much time has passed
    // 4. Low truth score

    const hasDecliningDimension = Object.values(qualityData.dimensions)
      .some(dim => dim.trend === 'declining');

    return (
      hasDecliningDimension ||
      qualityData.drift > this.config.driftThreshold ||
      daysSinceUpdate > this.config.reevaluationFrequency ||
      qualityData.truthScore < this.config.truthScoreThreshold * 0.8
    );
  }

  /**
   * Schedule reevaluation for a resource
   */
  async scheduleReevaluation(resourceId) {
    const qualityData = this.qualityMetrics.get(resourceId);
    if (!qualityData) return;

    qualityData.reevaluationCount++;

    console.log(chalk.yellow(`⚠️ Scheduling reevaluation for resource ${resourceId} (${qualityData.reevaluationCount}th time)`));

    this.emit('reevaluationScheduled', {
      resourceId,
      reason: 'quality_degradation',
      count: qualityData.reevaluationCount,
      timestamp: new Date()
    });
  }

  /**
   * Recalculate quality scores related to an agent
   */
  async recalculateRelatedQualityScores(agentId) {
    // Find all resources evaluated by this agent
    const affectedResources = [];

    for (const [resourceId, resource] of this.consensusValidator.resources) {
      const hasAgentEvaluation = resource.evaluations.some(e => e.agentId === agentId);
      if (hasAgentEvaluation) {
        affectedResources.push(resourceId);
      }
    }

    console.log(chalk.blue(`🔄 Recalculating quality scores for ${affectedResources.length} resources affected by agent ${agentId}`));

    for (const resourceId of affectedResources) {
      const qualityData = this.qualityMetrics.get(resourceId);
      if (qualityData) {
        // Recalculate dimensions that depend on agent reputation
        await this.updateQualityMetrics(resourceId, {
          id: 'agent_reputation_update',
          results: { topResources: [this.consensusValidator.resources.get(resourceId)] },
          startTime: new Date(),
          endTime: new Date()
        });
      }
    }
  }

  /**
   * Clean up old alerts
   */
  cleanupOldAlerts() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const initialCount = this.alerts.length;

    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);

    const cleanedCount = initialCount - this.alerts.length;
    if (cleanedCount > 0) {
      console.log(chalk.gray(`  🧹 Cleaned up ${cleanedCount} old alerts`));
    }
  }

  /**
   * Get quality summary for all resources
   */
  getQualitySummary() {
    const qualityDataArray = Array.from(this.qualityMetrics.values());

    if (qualityDataArray.length === 0) {
      return {
        totalResources: 0,
        averageQuality: 0,
        averageTruthScore: 0,
        resourcesByQuality: {},
        alertsCount: this.alerts.length,
        monitoringActive: this.continuousMonitoringActive
      };
    }

    const averageQuality = qualityDataArray.reduce((sum, q) => sum + q.overallQuality, 0) / qualityDataArray.length;
    const averageTruthScore = qualityDataArray.reduce((sum, q) => sum + q.truthScore, 0) / qualityDataArray.length;

    const resourcesByQuality = {
      excellent: qualityDataArray.filter(q => q.overallQuality >= 0.9).length,
      good: qualityDataArray.filter(q => q.overallQuality >= 0.7 && q.overallQuality < 0.9).length,
      fair: qualityDataArray.filter(q => q.overallQuality >= 0.5 && q.overallQuality < 0.7).length,
      poor: qualityDataArray.filter(q => q.overallQuality < 0.5).length
    };

    return {
      totalResources: qualityDataArray.length,
      averageQuality,
      averageTruthScore,
      resourcesByQuality,
      alertsCount: this.alerts.length,
      monitoringActive: this.continuousMonitoringActive,
      lastMonitoringCycle: this.monitoringData.size > 0 ? 'recent' : 'never'
    };
  }

  /**
   * Get detailed quality report for a resource
   */
  getQualityReport(resourceId) {
    const qualityData = this.qualityMetrics.get(resourceId);
    const resource = this.consensusValidator.resources.get(resourceId);

    if (!qualityData || !resource) {
      return null;
    }

    return {
      resource: {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        status: resource.status
      },
      quality: {
        overall: qualityData.overallQuality,
        truthScore: qualityData.truthScore,
        stability: qualityData.stability,
        drift: qualityData.drift
      },
      dimensions: qualityData.dimensions,
      history: qualityData.history.slice(-10), // Last 10 entries
      alerts: qualityData.alerts.slice(-5),    // Last 5 alerts
      lastUpdated: qualityData.lastUpdated,
      reevaluationCount: qualityData.reevaluationCount
    };
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(severity = null) {
    let alerts = [...this.alerts];

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Export quality data for analysis
   */
  exportQualityData() {
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      qualityMetrics: Array.from(this.qualityMetrics.entries()),
      monitoringData: Array.from(this.monitoringData.entries()),
      alerts: this.alerts,
      summary: this.getQualitySummary()
    };
  }
}

module.exports = { QualityAssurance };