/**
 * Gemini Model Configuration
 * Support for latest Gemini models including 2.0 series
 */

const chalk = require('chalk');

const GEMINI_MODELS = {
  // Latest Cutting-Edge Models (Recommended)
  'gemini-2.5-pro-preview-05-06': {
    name: 'Gemini 2.5 Pro Preview',
    description: 'Latest pro model with enhanced reasoning',
    maxTokens: 1048576,
    contextWindow: 1048576,
    multimodal: true,
    recommended: true,
    latest: true
  },
  'gemini-2.5-flash-preview-04-17': {
    name: 'Gemini 2.5 Flash Preview',
    description: 'Latest flash model - fast & capable',
    maxTokens: 1048576,
    contextWindow: 1048576,
    multimodal: true,
    recommended: true,
    latest: true
  },
  
  // Gemini 3 Series (When Available)
  'gemini-3-pro': {
    name: 'Gemini 3 Pro',
    description: 'Next-gen pro model (Ultra)',
    maxTokens: 2097152,
    contextWindow: 2097152,
    multimodal: true,
    recommended: true,
    latest: true,
    experimental: true
  },
  'gemini-3-flash': {
    name: 'Gemini 3 Flash',
    description: 'Next-gen flash model',
    maxTokens: 1048576,
    contextWindow: 1048576,
    multimodal: true,
    recommended: true,
    latest: true,
    experimental: true
  },
  
  // Gemini 2.0 Series
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    description: 'Fast, efficient multimodal model',
    maxTokens: 1048576,
    contextWindow: 1048576,
    multimodal: true
  },
  'gemini-2.0-flash-lite': {
    name: 'Gemini 2.0 Flash-Lite',
    description: 'Cost-optimized version of Flash',
    maxTokens: 1048576,
    contextWindow: 1048576,
    multimodal: true
  },
  'gemini-2.0-pro': {
    name: 'Gemini 2.0 Pro',
    description: 'High quality reasoning and coding',
    maxTokens: 2097152,
    contextWindow: 2097152,
    multimodal: true
  },
  
  // Previous Generation
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    description: 'Fast multimodal model',
    maxTokens: 1048576,
    contextWindow: 1048576,
    multimodal: true
  },
  'gemini-1.5-flash-8b': {
    name: 'Gemini 1.5 Flash-8B',
    description: 'Efficient smaller variant',
    maxTokens: 1048576,
    contextWindow: 1048576,
    multimodal: true
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    description: 'Complex reasoning tasks',
    maxTokens: 2097152,
    contextWindow: 2097152,
    multimodal: true
  }
};

const DEFAULT_MODEL = 'gemini-2.5-flash-preview-04-17';

class ModelManager {
  constructor() {
    this.currentModel = DEFAULT_MODEL;
    this.models = GEMINI_MODELS;
  }

  /**
   * Get all available models
   */
  getAllModels() {
    return this.models;
  }

  /**
   * Get recommended models
   */
  getRecommendedModels() {
    return Object.entries(this.models)
      .filter(([_, info]) => info.recommended)
      .reduce((acc, [id, info]) => {
        acc[id] = info;
        return acc;
      }, {});
  }

  /**
   * Get model by ID
   */
  getModel(modelId) {
    return this.models[modelId] || this.models[DEFAULT_MODEL];
  }

  /**
   * Set current model
   */
  setModel(modelId) {
    if (this.models[modelId]) {
      this.currentModel = modelId;
      return true;
    }
    return false;
  }

  /**
   * Get current model
   */
  getCurrentModel() {
    return {
      id: this.currentModel,
      ...this.models[this.currentModel]
    };
  }

  /**
   * Validate model ID
   */
  validateModel(modelId) {
    return !!this.models[modelId];
  }

  /**
   * Get model for task type
   */
  getModelForTask(task) {
    const taskModels = {
      'quick-analysis': 'gemini-2.5-flash-preview-04-17',
      'deep-research': 'gemini-2.5-pro-preview-05-06',
      'multimodal': 'gemini-2.5-flash-preview-04-17',
      'coding': 'gemini-2.5-pro-preview-05-06',
      'ultra': 'gemini-3-pro',
      'default': DEFAULT_MODEL
    };

    return taskModels[task] || DEFAULT_MODEL;
  }

  /**
   * Format model list for display
   */
  formatModelList() {
    const lines = [];
    
    lines.push('\n🤖 Available Gemini Models:\n');
    
    // Latest/Cutting-edge models
    const latestModels = Object.entries(this.models).filter(([_, info]) => info.latest);
    if (latestModels.length > 0) {
      lines.push(chalk.magenta('🚀 LATEST & CUTTING-EDGE (Recommended):'));
      latestModels.forEach(([id, info]) => {
        const current = id === this.currentModel ? ' ✓' : '';
        const experimental = info.experimental ? ' [Experimental]' : '';
        lines.push(`  ${chalk.green('•')} ${chalk.bold(info.name)}${chalk.cyan(current)}${chalk.yellow(experimental)}`);
        lines.push(`    ${info.description}`);
        lines.push(`    ${chalk.gray(`Context: ${(info.contextWindow / 1024 / 1024).toFixed(1)}M tokens`)}\n`);
      });
    }
    
    // Other recommended models
    const otherRecommended = Object.entries(this.getRecommendedModels())
      .filter(([_, info]) => !info.latest);
    
    if (otherRecommended.length > 0) {
      lines.push(chalk.yellow('✓ RECOMMENDED:'));
      otherRecommended.forEach(([id, info]) => {
        const current = id === this.currentModel ? ' ✓' : '';
        lines.push(`  ${chalk.green('•')} ${chalk.bold(info.name)}${chalk.cyan(current)}`);
        lines.push(`    ${info.description}`);
        lines.push(`    ${chalk.gray(`Context: ${(info.contextWindow / 1024 / 1024).toFixed(1)}M tokens`)}\n`);
      });
    }
    
    // Other models
    const otherModels = Object.entries(this.models)
      .filter(([id, _]) => !this.models[id].recommended);
    
    if (otherModels.length > 0) {
      lines.push(chalk.gray('OTHER MODELS:'));
      otherModels.forEach(([id, info]) => {
        lines.push(`  ${chalk.gray('•')} ${info.name}`);
        lines.push(`    ${chalk.gray(info.description)}\n`);
      });
    }
    
    return lines.join('\n');
  }
}

module.exports = {
  GEMINI_MODELS,
  DEFAULT_MODEL,
  ModelManager
};