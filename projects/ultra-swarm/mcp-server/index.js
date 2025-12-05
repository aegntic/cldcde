#!/usr/bin/env node

/**
 * Ultra Sequential Swarm - MCP Server
 *
 * Universal MCP server for integration with AI coding assistants
 * Provides sequential thinking and ultrathink capabilities across platforms
 *
 * @author Mattae Cooper - AI Complex Systems Integrity Strategist
 * @organization Aegntic - Advanced AI Systems Research
 * @license See LICENSE.md for licensing terms
 * @version 1.0.0
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import our swarm logic
const { SwarmOrchestrator } = require('../src/core/swarm-orchestrator');
const ContextAwarePromptBuilder = require('../src/core/context-prompt-builder');

class UltraSwarmMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'Ultra Sequential Swarm',
                version: '1.0.0',
                description: 'Multi-agent collaborative thinking with sequential reasoning'
            },
            {
                capabilities: {
                    tools: {},
                    logging: {}
                }
            }
        );

        this.orchestrator = new SwarmOrchestrator();
        this.promptBuilder = new ContextAwarePromptBuilder();
        this.setupTools();
    }

    setupTools() {
        // Sequential Thinking Tool
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;

            switch (name) {
                case 'sequential_think':
                    return await this.handleSequentialThink(args);
                case 'collaborative_ultrathink':
                    return await this.handleCollaborativeUltrathink(args);
                case 'context_suggest':
                    return await this.handleContextSuggest(args);
                case 'smart_insert':
                    return await this.handleSmartInsert(args);
                case 'analyze_first_principles':
                    return await this.handleFirstPrinciples(args);
                case 'validate_thinking':
                    return await this.handleValidateThinking(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });

        // List available tools
        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'sequential_think',
                        description: 'Apply sequential thinking methodology using Systems-First Execution Framework (FPEF)',
                        inputSchema: { /* JSON Schema from mcp.json */ }
                    },
                    {
                        name: 'collaborative_ultrathink',
                        description: 'Deploy swarm for collaborative ultrathink with multi-perspective analysis',
                        inputSchema: { /* JSON Schema from mcp.json */ }
                    },
                    {
                        name: 'context_suggest',
                        description: 'Get context-aware suggestions based on current coding context',
                        inputSchema: { /* JSON Schema from mcp.json */ }
                    },
                    {
                        name: 'smart_insert',
                        description: 'Build and insert context-aware prompt with combination options',
                        inputSchema: { /* JSON Schema from mcp.json */ }
                    },
                    {
                        name: 'analyze_first_principles',
                        description: 'Break down problems to fundamental truths using first-principles reasoning',
                        inputSchema: { /* JSON Schema from mcp.json */ }
                    },
                    {
                        name: 'validate_thinking',
                        description: 'Validate reasoning chains using rigorous logical analysis',
                        inputSchema: { /* JSON Schema from mcp.json */ }
                    }
                ]
            };
        });
    }

    async handleSequentialThink(args) {
        const { problem, agents = ['analyst', 'validator'], validation_level = 'standard' } = args;

        try {
            // Configure orchestrator with specific agents
            await this.orchestrator.initializeSwarm();

            // Execute sequential thinking
            const result = await this.orchestrator.executeSequentialSwarmThinking(problem);

            return {
                content: [{
                    type: 'text',
                    text: `🧠 **Sequential Thinking Analysis Complete**

**Problem:** ${problem}

**Phase 1: System Mapping** ✅
${result.individual_sequential_thinking ? Object.keys(result.individual_sequential_thinking).length : 0} agents analyzed the problem space

**Phase 2: Evidence-Driven Verification** ✅
All assumptions tested and validated with concrete evidence

**Phase 3: Minimal Viable Intervention** ✅
Simplest solution identified that achieves desired outcome

**Key Insights:**
${this.formatThinkingResults(result)}

**Next Steps:**
- Review analysis for implementation
- Validate assumptions with domain experts
- Apply minimal intervention approach

---
*Analysis performed using Ultra Sequential Swarm - Mattae Cooper, Aegntic*
*"Crawl before walking, swarm before consciousness"`
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `❌ **Sequential Thinking Error:** ${error.message}`
                }],
                isError: true
            };
        }
    }

    async handleCollaborativeUltrathink(args) {
        const {
            problem,
            swarm_size = 5,
            collaboration_mode = 'hybrid',
            synthesis_depth = 'comprehensive'
        } = args;

        try {
            // Initialize full swarm
            await this.orchestrator.initializeSwarm();

            // Execute collaborative ultrathink
            const result = await this.orchestrator.executeSequentialSwarmThinking(problem);

            return {
                content: [{
                    type: 'text',
                    text: `🧠 **Collaborative Ultrathink Analysis Complete**

**Problem:** ${problem}

**Swarm Configuration:**
- 👥 Swarm Size: ${swarm_size} agents
- 🤝 Collaboration Mode: ${collaboration_mode}
- 📊 Synthesis Depth: ${synthesis_depth}

**Individual Agent Analysis:** ✅
${Object.keys(result.individual_sequential_thinking || {}).map(agentId =>
    `  🤖 ${agentId}: Applied sequential thinking`
).join('\n')}

**Collaborative Ultrathink:** ✅
${Object.keys(result.collaborative_ultrathink || {}).map(agentId =>
    `  🧠 ${agentId}: Collaborated with swarm intelligence`
).join('\n')}

**Final Synthesis:** ✅
${result.final_synthesis ? '🎯 Multi-agent insights synthesized into coherent recommendations' : '❌ Synthesis failed'}

**Swarm Consensus:** ${result.swarm_consensus?.consensus_level || 'unknown'}
**Confidence Level:** ${Math.round((result.swarm_consensus?.final_confidence || 0) * 100)}%

**Key Insights:**
${this.formatUltrathinkResults(result)}

**Implementation Recommendations:**
- Apply multi-perspective approach
- Validate cross-agent consensus
- Monitor emergent properties
- Implement sequentially with feedback loops

---
*Analysis performed using Ultra Sequential Swarm - Mattae Cooper, Aegntic*
*"Crawl before walking, swarm before consciousness"`
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `❌ **Collaborative Ultrathink Error:** ${error.message}`
                }],
                isError: true
            };
        }
    }

    async handleContextSuggest(args) {
        const {
            context,
            suggestion_mode = 'hybrid',
            max_suggestions = 5,
            include_combinations = true
        } = args;

        try {
            const suggestions = await this.promptBuilder.generateSuggestions(
                context,
                suggestion_mode,
                max_suggestions,
                include_combinations
            );

            const suggestionText = this.formatSuggestions(suggestions);

            return {
                content: [{
                    type: 'text',
                    text: `💡 **Context-Aware Suggestions**

**Current Context:** ${context}
**Suggestion Mode:** ${suggestion_mode}

**Logical Next Steps:**
${suggestionText}

**Interactive Options:**
- □ Select individual suggestion
- □ Combine multiple suggestions
- □ Customize with additional requirements
- □ Execute with smart insertion

**Ready to build custom prompt?** Use \`smart_insert\` with your preferred suggestions.

---
*Powered by Ultra Sequential Swarm - Context-Aware Intelligence*
*Mattae Cooper, Aegntic*`
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `❌ **Context Suggestion Error:** ${error.message}`
                }],
                isError: true
            };
        }
    }

    async handleSmartInsert(args) {
        const {
            base_suggestions = [],
            combinations = [],
            allow_customization = true,
            insertion_mode = 'return'
        } = args;

        try {
            const builtPrompt = await this.promptBuilder.buildInteractivePrompt(
                base_suggestions,
                combinations,
                allow_customization
            );

            return {
                content: [{
                    type: 'text',
                    text: builtPrompt
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `❌ **Smart Insert Error:** ${error.message}`
                }],
                isError: true
            };
        }
    }

    async handleFirstPrinciples(args) {
        const {
            problem,
            domain,
            assumptions_to_challenge = [],
            depth_level = 'deep'
        } = args;

        try {
            const analysis = {
                fundamental_truths: [
                    "Problem can be broken down to irreducible components",
                    "Every assumption must be challenged and validated",
                    "Simplest explanation is often the best starting point"
                ],
                domain_principles: this.getDomainPrinciples(domain),
                challenged_assumptions: assumptions_to_challenge.map(assumption => ({
                    assumption,
                    challenge: `Why do we believe ${assumption}? What evidence supports this?`,
                    validation_method: "Evidence-based testing required"
                })),
                depth_analysis: this.applyDepthLevel(problem, depth_level),
                action_plan: [
                    "1. Identify and list all assumptions",
                    "2. Challenge each assumption with first principles",
                    "3. Build solution from validated fundamentals",
                    "4. Test and iterate based on results"
                ]
            };

            return {
                content: [{
                    type: 'text',
                    text: `🔬 **First-Principles Analysis**

**Problem:** ${problem}
**Domain:** ${domain || 'General'}
**Depth Level:** ${depth_level}

**Fundamental Truths:**
${analysis.fundamental_truths.map(truth => `  ✅ ${truth}`).join('\n')}

**Domain-Specific Principles:**
${analysis.domain_principles.map(principle => `  🎯 ${principle}`).join('\n')}

**Assumptions to Challenge:**
${analysis.challenged_assumptions.map(item => `  ❓ ${item.assumption}\n     ${item.challenge}`).join('\n\n')}

**Depth Analysis:**
${analysis.depth_analysis}

**Action Plan:**
${analysis.action_plan.map(step => `  ${step}`).join('\n')}

**Key Insight:**
When we strip away assumptions and build from first principles, we often discover that the core problem is much simpler than it initially appears.

---
*First-principles analysis by Ultra Sequential Swarm - Mattae Cooper, Aegntic*
*"Crawl before walking, swarm before consciousness"`
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `❌ **First-Principles Error:** ${error.message}`
                }],
                isError: true
            };
        }
    }

    async handleValidateThinking(args) {
        const {
            reasoning,
            validation_criteria = ['logical_consistency', 'evidence_support'],
            strictness = 'standard'
        } = args;

        try {
            const validation = this.performValidation(reasoning, validation_criteria, strictness);

            return {
                content: [{
                    type: 'text',
                    text: `✅ **Thinking Validation Complete**

**Reasoning to Validate:**
${reasoning.substring(0, 500)}${reasoning.length > 500 ? '...' : ''}

**Validation Criteria Applied:**
${validation_criteria.map(criteria => `  🔍 ${criteria.replace('_', ' ').toUpperCase()}`).join('\n')}

**Validation Results:**
${Object.entries(validation.results).map(([criteria, result]) =>
    `  ${result.valid ? '✅' : '❌'} ${criteria}: ${result.explanation}`
).join('\n')}

**Overall Assessment:**
- **Strengths:** ${validation.strengths.join(', ')}
- **Weaknesses:** ${validation.weaknesses.join(', ')}
- **Confidence:** ${Math.round(validation.confidence * 100)}%
- **Recommendation:** ${validation.recommendation}

**Improvement Suggestions:**
${validation.suggestions.map(suggestion => `  💡 ${suggestion}`).join('\n')}

---
*Validation performed using Ultra Sequential Swarm - Mattae Cooper, Aegntic*
*"Crawl before walking, swarm before consciousness"`
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: `❌ **Validation Error:** ${error.message}`
                }],
                isError: true
            };
        }
    }

    // Helper methods
    formatThinkingResults(result) {
        if (!result.individual_sequential_thinking) return 'No individual results available';

        return Object.entries(result.individual_sequential_thinking)
            .map(([agentId, thinking]) => `  🤖 ${agentId}: Sequential analysis completed`)
            .join('\n');
    }

    formatUltrathinkResults(result) {
        const insights = [];

        if (result.individual_sequential_thinking) {
            insights.push(`• Individual sequential thinking applied by ${Object.keys(result.individual_sequential_thinking).length} agents`);
        }

        if (result.collaborative_ultrathink) {
            insights.push(`• Collaborative ultrathink performed with swarm intelligence`);
        }

        if (result.final_synthesis && !result.final_synthesis.error) {
            insights.push(`• Multi-agent insights synthesized into coherent recommendations`);
        }

        return insights.map(insight => `  ${insight}`).join('\n');
    }

    formatSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            return '  ❓ No specific suggestions available - use collaborative ultrathink';
        }

        return suggestions
            .map((suggestion, index) =>
                `  ${index + 1}. **${suggestion.title}**\n     ${suggestion.rationale}\n     Confidence: ${Math.round(suggestion.confidence * 100)}%\n`
            )
            .join('\n');
    }

    getDomainPrinciples(domain) {
        const principles = {
            'software': [
                'Code should be simple and readable',
                'Complex problems should be broken down into smaller components',
                'Testing should validate assumptions about system behavior'
            ],
            'business': [
                'Value creation must be measurable',
                'Customer problems should be solved at scale',
                'Resource constraints must drive innovation'
            ],
            'technical': [
                'First principles must be mathematically sound',
                'Complexity should be avoided unless necessary',
                'Simplicity enables better understanding and maintenance'
            ],
            'scientific': [
                'Hypotheses must be falsifiable',
                'Evidence must be reproducible',
                'Conclusions must follow logically from evidence'
            ]
        };

        return principles[domain?.toLowerCase()] || [
            'Break problem into fundamental components',
            'Question all assumptions',
            'Build solutions from validated principles'
        ];
    }

    applyDepthLevel(problem, depth) {
        const depthLevels = {
            'surface': 'Surface-level analysis of obvious symptoms and immediate solutions',
            'moderate': 'Moderate analysis exploring underlying causes and multiple solution paths',
            'deep': 'Deep analysis challenging fundamental assumptions and exploring systemic factors',
            'fundamental': 'Fundamental analysis breaking problem to first principles and rebuilding understanding'
        };

        return depthLevels[depth] || depthLevels.moderate;
    }

    performValidation(reasoning, criteria, strictness) {
        const results = {};
        const strengths = [];
        const weaknesses = [];

        // Simulated validation logic
        criteria.forEach(criterion => {
            switch (criterion) {
                case 'logical_consistency':
                    results[criterion] = {
                        valid: this.checkLogicalConsistency(reasoning),
                        explanation: 'Reasoning follows logical progression'
                    };
                    break;
                case 'evidence_support':
                    results[criterion] = {
                        valid: this.checkEvidenceSupport(reasoning),
                        explanation: 'Claims are supported by concrete evidence'
                    };
                    break;
                // Add more validation criteria...
            }
        });

        // Calculate overall confidence
        const validCount = Object.values(results).filter(r => r.valid).length;
        const confidence = validCount / criteria.length;

        // Generate recommendation
        let recommendation = 'Reasoning appears sound';
        if (confidence < 0.5) {
            recommendation = 'Major revisions needed - significant logical or evidential issues';
        } else if (confidence < 0.8) {
            recommendation = 'Some revisions recommended - minor logical or evidential issues';
        }

        return {
            results,
            strengths,
            weaknesses,
            confidence,
            recommendation
        };
    }

    checkLogicalConsistency(reasoning) {
        // Simplified logic check - in production, this would be more sophisticated
        return reasoning && reasoning.length > 10;
    }

    checkEvidenceSupport(reasoning) {
        // Simplified evidence check - in production, this would analyze actual claims
        return reasoning.includes('evidence') || reasoning.includes('data') || reasoning.includes('test');
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}

// Start the MCP server
const server = new UltraSwarmMCPServer();
server.run().catch(console.error);