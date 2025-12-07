/**
 * Comprehensive Consensus Validation API and Integration Layer
 * Unified interface for all consensus validation components
 */

const chalk = require('chalk');
const { EventEmitter } = require('events');
const { ConsensusValidator } = require('./consensus-validator');
const { CrossAgentValidator } = require('./cross-agent-validator');
const { QualityAssurance } = require('./quality-assurance');
const { ResourceClassifier } = require('./resource-classifier');
const { PreventionSafetyValidator } = require('./prevention-safety-validator');

class ConsensusValidationAPI extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      autoStartQualityMonitoring: options.autoStartQualityMonitoring !== false,
      enableSafetyValidation: options.enableSafetyValidation !== false,
      enableCrossAgentValidation: options.enableCrossAgentValidation !== false,
      enableResourceClassification: options.enableResourceClassification !== false,
      ...options
    };

    this.initializeComponents();
    this.setupIntegrationLayer();
    this.setupAPIEndpoints();
  }

  /**
   * Initialize all consensus validation components
   */
  initializeComponents() {
    console.log(chalk.magenta('🔗 Initializing Consensus Validation System'));

    // Core consensus validator
    this.consensusValidator = new ConsensusValidator(this.options);

    // Cross-agent validation
    this.crossAgentValidator = new CrossAgentValidator(this.consensusValidator);

    // Quality assurance
    this.qualityAssurance = new QualityAssurance(this.consensusValidator, this.options);

    // Resource classifier
    this.resourceClassifier = new ResourceClassifier(
      this.consensusValidator,
      this.qualityAssurance
    );

    // Prevention and safety validator (requires FPEF framework)
    this.fpefFramework = this.options.fpefFramework || this.createMockFPEFFramework();
    this.preventionSafetyValidator = new PreventionSafetyValidator(
      this.consensusValidator,
      this.qualityAssurance,
      this.fpefFramework
    );

    // System state
    this.systemState = {
      initialized: true,
      activeValidations: new Map(),
      statistics: {
        totalResources: 0,
        totalAgents: 0,
        completedValidations: 0,
        averageQualityScore: 0,
        lastValidationTime: null
      }
    };

    console.log(chalk.green('✅ All consensus validation components initialized\n'));

    // Start quality monitoring if enabled
    if (this.options.autoStartQualityMonitoring) {
      this.qualityAssurance.startContinuousMonitoring();
    }
  }

  /**
   * Setup integration layer between components
   */
  setupIntegrationLayer() {
    console.log(chalk.blue('🔌 Setting up integration layer'));

    // Setup event forwarding
    this.setupEventForwarding();

    // Setup data synchronization
    this.setupDataSynchronization();

    // Setup workflow orchestration
    this.setupWorkflowOrchestration();

    console.log(chalk.green('✅ Integration layer configured\n'));
  }

  /**
   * Setup event forwarding between components
   */
  setupEventForwarding() {
    // Forward consensus validator events
    this.consensusValidator.on('resourceRegistered', (data) => {
      this.emit('resourceRegistered', data);
      this.updateSystemStatistics();
    });

    this.consensusValidator.on('agentRegistered', (data) => {
      this.emit('agentRegistered', data);
      this.updateSystemStatistics();
    });

    this.consensusValidator.on('validationCompleted', (data) => {
      this.emit('validationCompleted', data);
      this.updateSystemStatistics();
      this.systemState.statistics.completedValidations++;
    });

    // Forward quality assurance events
    this.qualityAssurance.on('qualityUpdated', (data) => {
      this.emit('qualityUpdated', data);
    });

    this.qualityAssurance.on('qualityAlert', (data) => {
      this.emit('qualityAlert', data);
    });

    this.qualityAssurance.on('reevaluationScheduled', (data) => {
      this.emit('reevaluationScheduled', data);
    });

    // Forward resource classifier events
    this.resourceClassifier.on('resourceClassified', (data) => {
      this.emit('resourceClassified', data);
    });

    // Forward safety validator events
    this.preventionSafetyValidator.on('safetyAlert', (data) => {
      this.emit('safetyAlert', data);
    });
  }

  /**
   * Setup data synchronization between components
   */
  setupDataSynchronization() {
    // Sync resource data between components
    this.consensusValidator.on('resourceRegistered', (resource) => {
      this.qualityAssurance.initializeQualityTracking(resource);
    });

    // Sync agent reputation updates
    this.qualityAssurance.on('agentReputationUpdated', (data) => {
      this.consensusValidator.updateAgentReputation(data.agentId, data.newReputation);
    });
  }

  /**
   * Setup workflow orchestration
   */
  setupWorkflowOrchestration() {
    // Define standard validation workflows
    this.workflows = {
      standard: this.createStandardWorkflow.bind(this),
      comprehensive: this.createComprehensiveWorkflow.bind(this),
      fast: this.createFastWorkflow.bind(this),
      security_focused: this.createSecurityFocusedWorkflow.bind(this)
    };
  }

  /**
   * Setup API endpoints
   */
  setupAPIEndpoints() {
    console.log(chalk.blue('🌐 Setting up API endpoints'));

    this.api = {
      // Resource management
      resources: {
        register: this.registerResource.bind(this),
        get: this.getResource.bind(this),
        update: this.updateResource.bind(this),
        delete: this.deleteResource.bind(this),
        list: this.listResources.bind(this)
      },

      // Agent management
      agents: {
        register: this.registerAgent.bind(this),
        get: this.getAgent.bind(this),
        update: this.updateAgent.bind(this),
        list: this.listAgents.bind(this)
      },

      // Validation operations
      validation: {
        start: this.startValidation.bind(this),
        getStatus: this.getValidationStatus.bind(this),
        getResults: this.getValidationResults.bind(this),
        cancel: this.cancelValidation.bind(this)
      },

      // Quality operations
      quality: {
        getReport: this.getQualityReport.bind(this),
        getAlerts: this.getQualityAlerts.bind(this),
        startMonitoring: this.startQualityMonitoring.bind(this),
        stopMonitoring: this.stopQualityMonitoring.bind(this)
      },

      // Classification operations
      classification: {
        classify: this.classifyResources.bind(this),
        getCategories: this.getClassificationCategories.bind(this),
        rank: this.rankResources.bind(this)
      },

      // Safety operations
      safety: {
        validate: this.validateSafety.bind(this),
        getThreats: this.getSafetyThreats.bind(this),
        blockResource: this.blockResource.bind(this)
      },

      // System operations
      system: {
        getStatus: this.getSystemStatus.bind(this),
        getStatistics: this.getSystemStatistics.bind(this),
        healthCheck: this.healthCheck.bind(this),
        export: this.exportData.bind(this)
      }
    };

    console.log(chalk.green('✅ API endpoints configured\n'));
  }

  /**
   * Create mock FPEF framework for testing
   */
  createMockFPEFFramework() {
    return {
      currentPhase: 'ready',
      completeCycle: async () => ({
        overallConfidence: 0.85,
        keyFindings: ['System is functioning properly'],
        interventions: [],
        nextSteps: ['Continue monitoring']
      })
    };
  }

  /**
   * Main validation workflow orchestration
   */
  async executeValidationWorkflow(workflowName, resourceIds = null, options = {}) {
    const workflow = this.workflows[workflowName];
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    const validationId = this.generateValidationId();
    const startTime = new Date();

    console.log(chalk.magenta(`🚀 Starting ${workflowName} validation workflow`));
    console.log(chalk.gray(`Validation ID: ${validationId}`));

    this.systemState.activeValidations.set(validationId, {
      id: validationId,
      workflow: workflowName,
      status: 'running',
      startTime,
      resourceIds: resourceIds || 'all',
      options,
      results: {}
    });

    try {
      const results = await workflow(resourceIds, options);

      const validationSession = {
        ...this.systemState.activeValidations.get(validationId),
        status: 'completed',
        endTime: new Date(),
        results
      };

      this.systemState.activeValidations.set(validationId, validationSession);
      this.emit('workflowCompleted', { workflowName, validationId, results });

      console.log(chalk.green(`✅ ${workflowName} workflow completed successfully`));

      return {
        validationId,
        workflowName,
        status: 'completed',
        duration: new Date() - startTime,
        results
      };

    } catch (error) {
      const validationSession = {
        ...this.systemState.activeValidations.get(validationId),
        status: 'failed',
        endTime: new Date(),
        error: error.message
      };

      this.systemState.activeValidations.set(validationId, validationSession);
      this.emit('workflowFailed', { workflowName, validationId, error });

      console.error(chalk.red(`❌ ${workflowName} workflow failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Standard validation workflow
   */
  async createStandardWorkflow(resourceIds, options) {
    const results = {};

    // Step 1: Consensus validation
    console.log(chalk.blue('📋 Step 1: Consensus Validation'));
    results.consensus = await this.consensusValidator.startConsensusValidation(resourceIds);

    // Step 2: Quality assurance
    console.log(chalk.blue('📊 Step 2: Quality Assurance'));
    results.quality = {
      summary: this.qualityAssurance.getQualitySummary()
    };

    // Step 3: Basic safety check
    if (this.options.enableSafetyValidation) {
      console.log(chalk.blue('🛡️ Step 3: Safety Validation'));
      results.safety = await this.preventionSafetyValidator.executePreventionSafetyValidation(
        results.consensus.topResources.map(r => r.id),
        { securityChecks: ['code_security', 'dependency_security'] }
      );
    }

    return results;
  }

  /**
   * Comprehensive validation workflow
   */
  async createComprehensiveWorkflow(resourceIds, options) {
    const results = {};

    // Step 1: Consensus validation with cross-agent protocols
    console.log(chalk.blue('🔄 Step 1: Cross-Agent Consensus Validation'));
    results.consensus = await this.consensusValidator.startConsensusValidation(resourceIds);

    if (this.options.enableCrossAgentValidation) {
      const topResourceIds = results.consensus.topResources.map(r => r.id);
      results.crossAgent = await this.crossAgentValidator.executeCrossAgentValidation(topResourceIds);
    }

    // Step 2: Resource classification and ranking
    if (this.options.enableResourceClassification) {
      console.log(chalk.blue('🏷️ Step 2: Resource Classification'));
      results.classification = await this.resourceClassifier.classifyResources(resourceIds);

      console.log(chalk.blue('🏆 Step 3: Resource Ranking'));
      results.ranking = await this.resourceClassifier.rankResources(resourceIds);

      console.log(chalk.blue('💎 Step 4: Hidden Gem Detection'));
      results.hiddenGems = await this.resourceClassifier.detectHiddenGems(resourceIds);
    }

    // Step 3: Comprehensive quality assurance
    console.log(chalk.blue('📊 Step 5: Quality Assurance'));
    results.quality = {
      summary: this.qualityAssurance.getQualitySummary(),
      alerts: this.qualityAssurance.getActiveAlerts()
    };

    // Step 4: Comprehensive safety validation
    if (this.options.enableSafetyValidation) {
      console.log(chalk.blue('🛡️ Step 6: Safety & Security Validation'));
      results.safety = await this.preventionSafetyValidator.executePreventionSafetyValidation(resourceIds, {
        strictMode: options.strictMode || false
      });
    }

    return results;
  }

  /**
   * Fast validation workflow
   */
  async createFastWorkflow(resourceIds, options) {
    const results = {};

    // Step 1: Quick consensus validation (fewer agents)
    console.log(chalk.blue('⚡ Step 1: Fast Consensus Validation'));
    results.consensus = await this.consensusValidator.startConsensusValidation(resourceIds, {
      maxAgents: 5,
      votingTimeout: 5000,
      evaluationTimeout: 10000
    });

    // Step 2: Basic quality check
    console.log(chalk.blue('📊 Step 2: Basic Quality Check'));
    results.quality = {
      summary: this.qualityAssurance.getQualitySummary()
    };

    return results;
  }

  /**
   * Security-focused validation workflow
   */
  async createSecurityFocusedWorkflow(resourceIds, options) {
    const results = {};

    // Step 1: Comprehensive security validation
    console.log(chalk.blue('🛡️ Step 1: Security Validation'));
    results.safety = await this.preventionSafetyValidator.executePreventionSafetyValidation(resourceIds, {
      securityChecks: ['code_security', 'dependency_security', 'data_security', 'access_control'],
      strictMode: options.strictMode || true
    });

    // Step 2: Filter safe resources for consensus validation
    const safeResourceIds = resourceIds.filter(id => {
      const safetyResult = results.safety.results.get(id);
      return safetyResult && !safetyResult.blocked && safetyResult.threatLevel !== 'CRITICAL';
    });

    if (safeResourceIds.length > 0) {
      console.log(chalk.blue('📋 Step 2: Consensus Validation (Safe Resources Only)'));
      results.consensus = await this.consensusValidator.startConsensusValidation(safeResourceIds);
    } else {
      console.log(chalk.yellow('⚠️ No safe resources found for consensus validation'));
      results.consensus = { topResources: [] };
    }

    return results;
  }

  // API endpoint implementations

  /**
   * Register a new resource
   */
  async registerResource(resourceData) {
    try {
      const resourceId = await this.consensusValidator.registerResource(resourceData);
      return {
        success: true,
        resourceId,
        message: 'Resource registered successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get resource details
   */
  async getResource(resourceId) {
    const resource = this.consensusValidator.resources.get(resourceId);
    if (!resource) {
      return { success: false, error: 'Resource not found' };
    }

    const qualityData = this.qualityAssurance.qualityMetrics.get(resourceId);
    const consensusResult = this.consensusValidator.getConsensusResult(resourceId);
    const safetyResult = this.preventionSafetyValidator.safetyValidations.get(resourceId);

    return {
      success: true,
      resource,
      quality: qualityData,
      consensus: consensusResult,
      safety: safetyResult
    };
  }

  /**
   * Update resource
   */
  async updateResource(resourceId, updateData) {
    const resource = this.consensusValidator.resources.get(resourceId);
    if (!resource) {
      return { success: false, error: 'Resource not found' };
    }

    Object.assign(resource, updateData);
    resource.lastUpdated = new Date();

    // Trigger re-evaluation if needed
    await this.qualityAssurance.updateQualityMetrics(resourceId, {
      id: 'resource_update',
      results: { topResources: [resource] },
      startTime: new Date(),
      endTime: new Date()
    });

    return {
      success: true,
      message: 'Resource updated successfully'
    };
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId) {
    const resource = this.consensusValidator.resources.get(resourceId);
    if (!resource) {
      return { success: false, error: 'Resource not found' };
    }

    this.consensusValidator.resources.delete(resourceId);
    this.qualityAssurance.qualityMetrics.delete(resourceId);
    this.preventionSafetyValidator.safetyValidations.delete(resourceId);

    return {
      success: true,
      message: 'Resource deleted successfully'
    };
  }

  /**
   * List resources
   */
  async listResources(filters = {}) {
    let resources = Array.from(this.consensusValidator.resources.values());

    // Apply filters
    if (filters.type) {
      resources = resources.filter(r => r.type === filters.type);
    }
    if (filters.status) {
      resources = resources.filter(r => r.status === filters.status);
    }
    if (filters.category) {
      resources = resources.filter(r => r.category === filters.category);
    }

    // Add quality and safety data
    resources = resources.map(resource => {
      const qualityData = this.qualityAssurance.qualityMetrics.get(resource.id);
      return {
        ...resource,
        qualityScore: qualityData?.overallQuality || 0,
        truthScore: qualityData?.truthScore || 0
      };
    });

    // Sort
    if (filters.sortBy) {
      resources.sort((a, b) => {
        switch (filters.sortBy) {
          case 'quality': return (b.qualityScore || 0) - (a.qualityScore || 0);
          case 'truth': return (b.truthScore || 0) - (a.truthScore || 0);
          case 'name': return a.name.localeCompare(b.name);
          case 'date': return new Date(b.registeredAt) - new Date(a.registeredAt);
          default: return 0;
        }
      });
    }

    // Limit
    if (filters.limit) {
      resources = resources.slice(0, filters.limit);
    }

    return {
      success: true,
      resources,
      total: resources.length
    };
  }

  /**
   * Register a new agent
   */
  async registerAgent(agentData) {
    try {
      const agentId = await this.consensusValidator.registerAgent(agentData);
      return {
        success: true,
        agentId,
        message: 'Agent registered successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get agent details
   */
  async getAgent(agentId) {
    const agent = this.consensusValidator.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    return {
      success: true,
      agent
    };
  }

  /**
   * Update agent
   */
  async updateAgent(agentId, updateData) {
    const agent = this.consensusValidator.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    Object.assign(agent, updateData);
    agent.votingPower = this.consensusValidator.calculateVotingPower(agent);

    return {
      success: true,
      message: 'Agent updated successfully'
    };
  }

  /**
   * List agents
   */
  async listAgents(filters = {}) {
    let agents = Array.from(this.consensusValidator.agents.values());

    // Apply filters
    if (filters.expertise) {
      agents = agents.filter(a => a.expertise?.includes(filters.expertise));
    }
    if (filters.minReputation) {
      agents = agents.filter(a => a.reputation >= filters.minReputation);
    }

    return {
      success: true,
      agents,
      total: agents.length
    };
  }

  /**
   * Start validation
   */
  async startValidation(workflow = 'standard', resourceIds = null, options = {}) {
    return await this.executeValidationWorkflow(workflow, resourceIds, options);
  }

  /**
   * Get validation status
   */
  async getValidationStatus(validationId) {
    const validation = this.systemState.activeValidations.get(validationId);
    if (!validation) {
      return { success: false, error: 'Validation not found' };
    }

    return {
      success: true,
      validation
    };
  }

  /**
   * Get validation results
   */
  async getValidationResults(validationId) {
    const validation = this.systemState.activeValidations.get(validationId);
    if (!validation) {
      return { success: false, error: 'Validation not found' };
    }

    return {
      success: true,
      results: validation.results,
      status: validation.status
    };
  }

  /**
   * Cancel validation
   */
  async cancelValidation(validationId) {
    const validation = this.systemState.activeValidations.get(validationId);
    if (!validation) {
      return { success: false, error: 'Validation not found' };
    }

    validation.status = 'cancelled';
    validation.endTime = new Date();

    return {
      success: true,
      message: 'Validation cancelled successfully'
    };
  }

  /**
   * Get quality report
   */
  async getQualityReport(resourceId = null) {
    if (resourceId) {
      const report = this.qualityAssurance.getQualityReport(resourceId);
      if (!report) {
        return { success: false, error: 'Quality report not found' };
      }
      return { success: true, report };
    } else {
      const summary = this.qualityAssurance.getQualitySummary();
      return { success: true, summary };
    }
  }

  /**
   * Get quality alerts
   */
  async getQualityAlerts(severity = null) {
    const alerts = this.qualityAssurance.getActiveAlerts(severity);
    return {
      success: true,
      alerts,
      total: alerts.length
    };
  }

  /**
   * Start quality monitoring
   */
  async startQualityMonitoring() {
    this.qualityAssurance.startContinuousMonitoring();
    return {
      success: true,
      message: 'Quality monitoring started'
    };
  }

  /**
   * Stop quality monitoring
   */
  async stopQualityMonitoring() {
    this.qualityAssurance.stopContinuousMonitoring();
    return {
      success: true,
      message: 'Quality monitoring stopped'
    };
  }

  /**
   * Classify resources
   */
  async classifyResources(resourceIds = null, schemes = null) {
    return await this.resourceClassifier.classifyResources(resourceIds, schemes);
  }

  /**
   * Get classification categories
   */
  async getClassificationCategories() {
    return {
      success: true,
      categories: Object.fromEntries(this.resourceClassifier.resourceCategories)
    };
  }

  /**
   * Rank resources
   */
  async rankResources(resourceIds = null, algorithms = null, options = {}) {
    return await this.resourceClassifier.rankResources(resourceIds, algorithms, options);
  }

  /**
   * Validate safety
   */
  async validateSafety(resourceIds = null, options = {}) {
    return await this.preventionSafetyValidator.executePreventionSafetyValidation(resourceIds, options);
  }

  /**
   * Get safety threats
   */
  async getSafetyThreats(severity = null) {
    const threats = Array.from(this.preventionSafetyValidator.safetyValidations.values())
      .filter(validation => validation.threatLevel === severity || !severity)
      .map(validation => ({
        resourceId: validation.resourceId,
        resourceName: validation.resourceName,
        threatLevel: validation.threatLevel,
        safetyScore: validation.overallSafetyScore,
        violations: Object.values(validation.securityResults)
          .reduce((sum, result) => sum + (result.violations?.length || 0), 0)
      }));

    return {
      success: true,
      threats,
      total: threats.length
    };
  }

  /**
   * Block resource
   */
  async blockResource(resourceId, reason = '') {
    const resource = this.consensusValidator.resources.get(resourceId);
    if (!resource) {
      return { success: false, error: 'Resource not found' };
    }

    resource.status = 'blocked';
    resource.blockedReason = reason;
    resource.blockedAt = new Date();

    this.emit('resourceBlocked', { resourceId, reason });

    return {
      success: true,
      message: 'Resource blocked successfully'
    };
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    return {
      success: true,
      status: 'operational',
      components: {
        consensusValidator: 'active',
        crossAgentValidator: this.options.enableCrossAgentValidation ? 'active' : 'disabled',
        qualityAssurance: this.qualityAssurance.continuousMonitoringActive ? 'monitoring' : 'idle',
        resourceClassifier: 'active',
        preventionSafetyValidator: this.options.enableSafetyValidation ? 'active' : 'disabled'
      },
      activeValidations: this.systemState.activeValidations.size,
      lastValidationTime: this.systemState.statistics.lastValidationTime
    };
  }

  /**
   * Get system statistics
   */
  async getSystemStatistics() {
    return {
      success: true,
      statistics: {
        ...this.systemState.statistics,
        totalResources: this.consensusValidator.resources.size,
        totalAgents: this.consensusValidator.agents.size,
        activeValidations: this.systemState.activeValidations.size,
        qualityAlerts: this.qualityAssurance.alerts.length,
        threatsDetected: Array.from(this.preventionSafetyValidator.safetyValidations.values())
          .filter(v => v.threatLevel !== 'LOW').length
      }
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      components: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Check consensus validator
      health.components.consensusValidator = {
        status: 'healthy',
        resources: this.consensusValidator.resources.size,
        agents: this.consensusValidator.agents.size
      };

      // Check quality assurance
      health.components.qualityAssurance = {
        status: 'healthy',
        monitoring: this.qualityAssurance.continuousMonitoringActive,
        metrics: this.qualityAssurance.qualityMetrics.size
      };

      // Check resource classifier
      health.components.resourceClassifier = {
        status: 'healthy',
        categories: this.resourceClassifier.resourceCategories.size
      };

      // Check safety validator
      health.components.preventionSafetyValidator = {
        status: 'healthy',
        validations: this.preventionSafetyValidator.safetyValidations.size
      };

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return {
      success: health.status === 'healthy',
      health
    };
  }

  /**
   * Export system data
   */
  async exportData(format = 'json') {
    const data = {
      timestamp: new Date().toISOString(),
      systemState: this.systemState,
      consensusValidator: this.consensusValidator.exportConsensusData(),
      qualityAssurance: this.qualityAssurance.exportQualityData(),
      resourceClassifier: this.resourceClassifier.exportData(),
      preventionSafetyValidator: this.preventionSafetyValidator.exportData()
    };

    if (format === 'json') {
      return {
        success: true,
        data: JSON.stringify(data, null, 2),
        format: 'json'
      };
    } else {
      return {
        success: true,
        data,
        format: 'object'
      };
    }
  }

  /**
   * Update system statistics
   */
  updateSystemStatistics() {
    this.systemState.statistics.totalResources = this.consensusValidator.resources.size;
    this.systemState.statistics.totalAgents = this.consensusValidator.agents.size;

    // Calculate average quality score
    const qualityScores = Array.from(this.qualityAssurance.qualityMetrics.values())
      .map(metrics => metrics.overallQuality);
    if (qualityScores.length > 0) {
      this.systemState.statistics.averageQualityScore =
        qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    }

    this.systemState.statistics.lastValidationTime = new Date();
  }

  /**
   * Generate validation ID
   */
  generateValidationId() {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = {
  ConsensusValidationAPI,
  // Export components for direct access if needed
  ConsensusValidator,
  CrossAgentValidator,
  QualityAssurance,
  ResourceClassifier,
  PreventionSafetyValidator
};