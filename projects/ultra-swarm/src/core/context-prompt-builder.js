#!/usr/bin/env node

/**
 * Ultra Sequential Swarm - Context-Aware Prompt Builder
 *
 * Generates context-aware suggestions with combination options
 * and smart text insertion capabilities for universal AI assistant integration
 *
 * @author Mattae Cooper - AI Complex Systems Integrity Strategist
 * @organization Aegntic - Advanced AI Systems Research
 * @license See LICENSE.md for licensing terms
 * @version 1.0.0
 */

const { EventEmitter } = require('events');
const inquirer = require('inquirer');
const chalk = require('chalk');

class ContextAwarePromptBuilder extends EventEmitter {
    constructor() {
        super();
        this.contextHistory = [];
        this.suggestionCache = new Map();
        this.contextPatterns = new Map();
        this.initializeContextPatterns();
    }

    initializeContextPatterns() {
        // Define common coding contexts and appropriate suggestions
        this.contextPatterns.set('react-debugging', {
            keywords: ['error', 'bug', 'react', 'component', 'state'],
            suggestions: [
                {
                    id: 'react-sequential-debug',
                    title: 'Sequential React Debug Analysis',
                    prompt: 'Apply sequential thinking to debug this React component by: 1) Mapping the component lifecycle and state flow, 2) Identifying where actual behavior differs from expected, 3) Testing assumptions about props and state, 4) Applying minimal intervention to fix the core issue.',
                    rationale: 'Debug React components systematically using FPEF methodology',
                    confidence: 0.9
                },
                {
                    id: 'react-state-validation',
                    title: 'State Assumptions Validation',
                    prompt: 'Validate all assumptions about React state management: 1) List all state-related assumptions, 2) Test each assumption with console.log or React DevTools, 3) Verify state changes trigger expected re-renders, 4) Ensure no side effects are causing issues.',
                    rationale: 'Many React bugs stem from incorrect assumptions about state behavior',
                    confidence: 0.85
                },
                {
                    id: 'react-component-first-principles',
                    title: 'Component First Principles Analysis',
                    prompt: 'Analyze this React component from first principles: 1) What is the fundamental input/output contract? 2) What are the core dependencies? 3) What assumptions am I making about component behavior? 4) What is the simplest implementation that satisfies the requirements?',
                    rationale: 'Break complex components down to fundamental React principles',
                    confidence: 0.8
                }
            ],
            combinations: [
                {
                    id: 'comprehensive-react-debug',
                    title: 'Comprehensive Sequential Debug + State Validation',
                    combination: ['react-sequential-debug', 'react-state-validation'],
                    prompt: 'Apply comprehensive sequential debugging to this React issue: 1) Map component lifecycle and identify the bug, 2) Validate all state assumptions systematically, 3) Test minimal interventions, 4) Verify fix with edge cases, 5) Document the root cause and solution approach.'
                },
                {
                    id: 'fundamental-react-analysis',
                    title: 'First Principles + Sequential Debug',
                    combination: ['react-sequential-debug', 'react-component-first-principles'],
                    prompt: 'Combine sequential debugging with first-principles analysis: 1) Break the component down to fundamental input/output contracts, 2) Map the actual vs expected behavior systematically, 3) Identify assumptions that may be causing the discrepancy, 4) Apply minimal intervention that addresses the root cause.'
                }
            ]
        });

        this.contextPatterns.set('api-design', {
            keywords: ['api', 'endpoint', 'rest', 'graphql', 'database'],
            suggestions: [
                {
                    id: 'api-first-principles',
                    title: 'API First Principles Design',
                    prompt: 'Design this API from first principles: 1) What are the core data entities and relationships? 2) What are the essential operations needed? 3) How can we ensure consistency and scalability? 4) What is the simplest interface that meets all requirements?',
                    rationale: 'Build APIs on fundamental principles rather than conventions',
                    confidence: 0.9
                },
                {
                    id: 'collaborative-api-ultrathink',
                    title: 'Collaborative API Design Ultrathink',
                    prompt: 'Apply collaborative ultrathink to API design: Deploy multiple agent perspectives: 1) Security analyst reviews authentication and authorization, 2) Performance expert analyzes scalability and caching, 3) UX specialist evaluates endpoint usability, 4) Database architect validates data integrity, 5) Synthesize insights into cohesive API design.',
                    rationale: 'Multiple perspectives create more robust and comprehensive APIs',
                    confidence: 0.85
                }
            ],
            combinations: [
                {
                    id: 'comprehensive-api-design',
                    title: 'First Principles + Collaborative Analysis',
                    combination: ['api-first-principles', 'collaborative-api-ultrathink'],
                    prompt: 'Design comprehensive API using sequential thinking and collaborative analysis: 1) Establish first-principles foundation, 2) Apply multi-agent perspectives for security, performance, and usability, 3) Validate all design decisions with evidence, 4) Create implementation roadmap with minimal viable endpoints first.'
                }
            ]
        });

        this.contextPatterns.set('algorithm-optimization', {
            keywords: ['algorithm', 'performance', 'optimization', 'complexity', 'efficiency'],
            suggestions: [
                {
                    id: 'algorithm-first-principles',
                    title: 'Algorithm First Principles Analysis',
                    prompt: 'Analyze this algorithm from first principles: 1) What is the fundamental problem being solved? 2) What are the mathematical or logical foundations? 3) What are the core operations and their costs? 4) What is the simplest possible solution? 5) Can we prove optimality?',
                    rationale: 'Break algorithms down to fundamental mathematical principles',
                    confidence: 0.9
                },
                {
                    id: 'performance-validation',
                    title: 'Performance Assumptions Validation',
                    prompt: 'Validate all performance assumptions: 1) List assumptions about time/space complexity, 2) Test with different input sizes and patterns, 3) Profile actual bottlenecks, 4) Compare theoretical vs actual performance, 5) Identify where assumptions were wrong.',
                    rationale: 'Performance issues often come from incorrect complexity assumptions',
                    confidence: 0.85
                }
            ],
            combinations: [
                {
                    id: 'optimal-algorithm-design',
                    title: 'First Principles + Performance Validation',
                    combination: ['algorithm-first-principles', 'performance-validation'],
                    prompt: 'Design optimal algorithm using comprehensive analysis: 1) Establish mathematical foundations and first principles, 2) Validate all complexity assumptions empirically, 3) Profile to identify real bottlenecks, 4) Optimize based on evidence rather than theory, 5) Prove optimality or establish bounds.'
                }
            ]
        });

        // Add more context patterns...
    }

    async generateSuggestions(context, suggestionMode = 'hybrid', maxSuggestions = 5, includeCombinations = true) {
        // Analyze context to determine the most relevant pattern
        const detectedPattern = this.detectContextPattern(context);
        let baseSuggestions = [];

        if (detectedPattern) {
            baseSuggestions = detectedPattern.suggestions.slice(0, maxSuggestions);
        } else {
            baseSuggestions = this.generateGeneralSuggestions(context, maxSuggestions);
        }

        // Add combinations if requested
        let combinations = [];
        if (includeCombinations && detectedPattern && detectedPattern.combinations) {
            combinations = detectedPattern.combinations.slice(0, Math.floor(maxSuggestions / 2));
        }

        // Rank suggestions by relevance to context
        const rankedSuggestions = this.rankSuggestions(baseSuggestions, context, suggestionMode);

        return {
            context: context,
            detected_pattern: detectedPattern?.name || 'general',
            suggestions: rankedSuggestions,
            combinations: combinations,
            suggestion_mode: suggestionMode,
            generated_at: new Date().toISOString()
        };
    }

    detectContextPattern(context) {
        const contextLower = context.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const [patternName, pattern] of this.contextPatterns.entries()) {
            const score = this.calculatePatternMatch(contextLower, pattern.keywords);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = { name: patternName, ...pattern };
            }
        }

        return bestScore > 0.3 ? bestMatch : null;
    }

    calculatePatternMatch(context, keywords) {
        const matches = keywords.filter(keyword => context.includes(keyword.toLowerCase()));
        return matches.length / keywords.length;
    }

    generateGeneralSuggestions(context, maxSuggestions) {
        return [
            {
                id: 'general-sequential',
                title: 'Sequential Problem Analysis',
                prompt: 'Apply sequential thinking to this problem: 1) Clearly define the desired outcome, 2) Map the current system and constraints, 3) Identify the root disconnect, 4) Test assumptions with evidence, 5) Apply minimal intervention.',
                rationale: 'Use systematic FPEF methodology for any problem',
                confidence: 0.7
            },
            {
                id: 'general-collaborative',
                title: 'Collaborative Ultrathink',
                prompt: 'Apply collaborative ultrathink: Deploy multiple perspectives (analyst, validator, explorer) to examine this problem from different angles, challenge assumptions, explore solutions, and synthesize comprehensive insights.',
                rationale: 'Multiple perspectives often reveal insights missed by individual analysis',
                confidence: 0.75
            },
            {
                id: 'general-first-principles',
                title: 'First Principles Breakdown',
                prompt: 'Analyze from first principles: 1) Strip away all assumptions and conventions, 2) Identify fundamental truths and constraints, 3) Rebuild understanding from basic principles, 4) What is the simplest solution that must work?',
                rationale: 'First principles thinking cuts through complexity to essential truth',
                confidence: 0.8
            }
        ].slice(0, maxSuggestions);
    }

    rankSuggestions(suggestions, context, mode) {
        return suggestions.sort((a, b) => {
            let scoreA = a.confidence;
            let scoreB = b.confidence;

            // Boost scores based on suggestion mode
            if (mode === 'sequential' && a.title.toLowerCase().includes('sequential')) {
                scoreA += 0.2;
            }
            if (mode === 'collaborative' && a.title.toLowerCase().includes('collaborative')) {
                scoreA += 0.2;
            }
            if (mode === 'hybrid' && (a.title.toLowerCase().includes('collaborative') || a.title.toLowerCase().includes('sequential'))) {
                scoreA += 0.1;
            }

            return scoreB - scoreA;
        });
    }

    async buildInteractivePrompt(baseSuggestions, combinations, allowCustomization = true) {
        console.log(chalk.blue('\n🧠 Ultra Sequential Swarm - Context-Aware Suggestions\n'));
        console.log(chalk.gray('═'.repeat(50)));

        // Display individual suggestions
        console.log(chalk.yellow('\n📋 Logical Next Steps:'));

        const { selectedSuggestions } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selectedSuggestions',
                message: 'Select approaches to use:',
                choices: baseSuggestions.map((suggestion, index) => ({
                    name: `${index + 1}. **${suggestion.title}**\n   ${suggestion.rationale}\n   Confidence: ${Math.round(suggestion.confidence * 100)}%`,
                    value: suggestion.id,
                    short: suggestion.title
                })),
                validate: function(answer) {
                    if (answer.length === 0) {
                        return 'Please select at least one suggestion';
                    }
                    return true;
                }
            }
        ]);

        // Display combination options if available
        let selectedCombination = null;
        if (combinations.length > 0) {
            console.log(chalk.cyan('\n🔄 Combination Options:'));

            const { combinationChoice } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'combinationChoice',
                    message: 'Use pre-defined combination?',
                    choices: [
                        { name: 'No, use individual suggestions', value: null },
                        ...combinations.map(combo => ({
                            name: `🎯 ${combo.title}\n   Combines: ${combo.combination.join(' + ')}`,
                            value: combo.id
                        }))
                    ]
                }
            ]);

            if (combinationChoice) {
                selectedCombination = combinations.find(c => c.id === combinationChoice);
                console.log(chalk.green(`\n✅ Selected combination: ${selectedCombination.title}`));
            }
        }

        // Build prompt based on selection
        let finalPrompt = '';

        if (selectedCombination) {
            finalPrompt = selectedCombination.prompt;
        } else {
            const selectedPrompts = baseSuggestions
                .filter(s => selectedSuggestions.includes(s.id))
                .map(s => s.prompt)
                .join('\n\n');

            if (selectedPrompts) {
                finalPrompt = selectedPrompts;
            }
        }

        // Allow customization if enabled
        if (allowCustomization && finalPrompt) {
            console.log(chalk.blue('\n✏️ Generated Prompt:'));
            console.log(chalk.gray(finalPrompt));

            const { shouldCustomize } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'shouldCustomize',
                    message: 'Customize prompt before using?',
                    default: false
                }
            ]);

            if (shouldCustomize) {
                const { customPrompt } = await inquirer.prompt([
                    {
                        type: 'editor',
                        name: 'customPrompt',
                        message: 'Edit your prompt:',
                        default: finalPrompt
                    }
                ]);
                finalPrompt = customPrompt;
            }
        }

        return {
            prompt: finalPrompt,
            selected_suggestions: selectedSuggestions,
            selected_combination: selectedCombination,
            customized: allowCustomization
        };
    }

    // Method for direct prompt insertion (for MCP integration)
    buildDirectPrompt(context, suggestionIds = [], combinationId = null) {
        const suggestionResult = this.generateSuggestions(context, 'hybrid', 8, true);

        if (combinationId) {
            const combination = suggestionResult.combinations.find(c => c.id === combinationId);
            return combination ? combination.prompt : '';
        }

        if (suggestionIds.length > 0) {
            const selectedSuggestions = suggestionResult.suggestions
                .filter(s => suggestionIds.includes(s.id));

            return selectedSuggestions
                .map(s => s.prompt)
                .join('\n\n');
        }

        // Return top suggestion if no specific selection
        return suggestionResult.suggestions.length > 0
            ? suggestionResult.suggestions[0].prompt
            : '';
    }

    // Context awareness methods
    analyzeCurrentContext() {
        // This would integrate with IDE/coding environment
        // For now, return basic context analysis
        return {
            timestamp: new Date().toISOString(),
            available_context: {
                project_type: 'detected_project',
                recent_files: [],
                current_error: null,
                active_session: true
            }
        };
    }

    updateContextHistory(context, suggestions, outcome) {
        this.contextHistory.push({
            timestamp: new Date().toISOString(),
            context: context,
            suggestions: suggestions,
            outcome: outcome,
            effectiveness: this.calculateEffectiveness(suggestions, outcome)
        });

        // Keep only recent history
        if (this.contextHistory.length > 100) {
            this.contextHistory = this.contextHistory.slice(-50);
        }
    }

    calculateEffectiveness(suggestions, outcome) {
        // Simple effectiveness calculation based on outcome quality
        // In production, this would be more sophisticated
        return Math.random() * 0.5 + 0.5; // Placeholder: 0.5-1.0
    }

    // Export methods for external integration
    async getContextAwareSuggestions(context, options = {}) {
        const {
            suggestion_mode = 'hybrid',
            max_suggestions = 5,
            include_combinations = true
        } = options;

        return await this.generateSuggestions(
            context,
            suggestion_mode,
            max_suggestions,
            include_combinations
        );
    }

    async buildPromptWithInteractivity(context, baseSuggestions = [], combinations = []) {
        return await this.buildInteractivePrompt(baseSuggestions, combinations, true);
    }
}

module.exports = ContextAwarePromptBuilder;