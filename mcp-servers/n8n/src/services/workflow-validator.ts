/**
 * Workflow Validator for n8n workflows
 * Validates complete workflow structure, connections, and node configurations
 */

import { NodeRepository } from '../database/node-repository';
import { EnhancedConfigValidator } from './enhanced-config-validator';
import { ExpressionValidator } from './expression-validator';
import { Logger } from '../utils/logger';

const logger = new Logger({ prefix: '[WorkflowValidator]' });

interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: any;
  credentials?: any;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  typeVersion?: number;
  continueOnFail?: boolean;
  onError?: 'continueRegularOutput' | 'continueErrorOutput' | 'stopWorkflow';
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
}

interface WorkflowConnection {
  [sourceNode: string]: {
    main?: Array<Array<{ node: string; type: string; index: number }>>;
    error?: Array<Array<{ node: string; type: string; index: number }>>;
    ai_tool?: Array<Array<{ node: string; type: string; index: number }>>;
  };
}

interface WorkflowJson {
  name?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection;
  settings?: any;
  staticData?: any;
  pinData?: any;
  meta?: any;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  nodeId?: string;
  nodeName?: string;
  message: string;
  details?: any;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  statistics: {
    totalNodes: number;
    enabledNodes: number;
    triggerNodes: number;
    validConnections: number;
    invalidConnections: number;
    expressionsValidated: number;
  };
  suggestions: string[];
}

export class WorkflowValidator {
  private currentWorkflow: WorkflowJson | null = null;

  constructor(
    private nodeRepository: NodeRepository,
    private nodeValidator: typeof EnhancedConfigValidator
  ) {}

  /**
   * Check if a node is a Sticky Note or other non-executable node
   */
  private isStickyNote(node: WorkflowNode): boolean {
    const stickyNoteTypes = [
      'n8n-nodes-base.stickyNote',
      'nodes-base.stickyNote',
      '@n8n/n8n-nodes-base.stickyNote'
    ];
    return stickyNoteTypes.includes(node.type);
  }

  /**
   * Validate a complete workflow
   */
  async validateWorkflow(
    workflow: WorkflowJson,
    options: {
      validateNodes?: boolean;
      validateConnections?: boolean;
      validateExpressions?: boolean;
      profile?: 'minimal' | 'runtime' | 'ai-friendly' | 'strict';
    } = {}
  ): Promise<WorkflowValidationResult> {
    // Store current workflow for access in helper methods
    this.currentWorkflow = workflow;

    const {
      validateNodes = true,
      validateConnections = true,
      validateExpressions = true,
      profile = 'runtime'
    } = options;

    const result: WorkflowValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      statistics: {
        totalNodes: 0,
        enabledNodes: 0,
        triggerNodes: 0,
        validConnections: 0,
        invalidConnections: 0,
        expressionsValidated: 0,
      },
      suggestions: []
    };

    try {
      // Handle null/undefined workflow
      if (!workflow) {
        result.errors.push({
          type: 'error',
          message: 'Invalid workflow structure: workflow is null or undefined'
        });
        result.valid = false;
        return result;
      }

      // Update statistics after null check (exclude sticky notes from counts)
      const executableNodes = Array.isArray(workflow.nodes) ? workflow.nodes.filter(n => !this.isStickyNote(n)) : [];
      result.statistics.totalNodes = executableNodes.length;
      result.statistics.enabledNodes = executableNodes.filter(n => !n.disabled).length;

      // Basic workflow structure validation
      this.validateWorkflowStructure(workflow, result);

      // Only continue if basic structure is valid
      if (workflow.nodes && Array.isArray(workflow.nodes) && workflow.connections && typeof workflow.connections === 'object') {
        // Validate each node if requested
        if (validateNodes && workflow.nodes.length > 0) {
          await this.validateAllNodes(workflow, result, profile);
        }

        // Validate connections if requested
        if (validateConnections) {
          this.validateConnections(workflow, result, profile);
        }

        // Validate expressions if requested
        if (validateExpressions && workflow.nodes.length > 0) {
          this.validateExpressions(workflow, result, profile);
        }

        // Check workflow patterns and best practices
        if (workflow.nodes.length > 0) {
          this.checkWorkflowPatterns(workflow, result, profile);
        }

        // Add suggestions based on findings
        this.generateSuggestions(workflow, result);
        
        // Add AI-specific recovery suggestions if there are errors
        if (result.errors.length > 0) {
          this.addErrorRecoverySuggestions(result);
        }
      }

    } catch (error) {
      logger.error('Error validating workflow:', error);
      result.errors.push({
        type: 'error',
        message: `Workflow validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate basic workflow structure
   */
  private validateWorkflowStructure(
    workflow: WorkflowJson,
    result: WorkflowValidationResult
  ): void {
    // Check for required fields
    if (!workflow.nodes) {
      result.errors.push({
        type: 'error',
        message: workflow.nodes === null ? 'nodes must be an array' : 'Workflow must have a nodes array'
      });
      return;
    }

    if (!Array.isArray(workflow.nodes)) {
      result.errors.push({
        type: 'error',
        message: 'nodes must be an array'
      });
      return;
    }

    if (!workflow.connections) {
      result.errors.push({
        type: 'error',
        message: workflow.connections === null ? 'connections must be an object' : 'Workflow must have a connections object'
      });
      return;
    }

    if (typeof workflow.connections !== 'object' || Array.isArray(workflow.connections)) {
      result.errors.push({
        type: 'error',
        message: 'connections must be an object'
      });
      return;
    }

    // Check for empty workflow - this should be a warning, not an error
    if (workflow.nodes.length === 0) {
      result.warnings.push({
        type: 'warning',
        message: 'Workflow is empty - no nodes defined'
      });
      return;
    }

    // Check for minimum viable workflow
    if (workflow.nodes.length === 1) {
      const singleNode = workflow.nodes[0];
      const normalizedType = singleNode.type.replace('n8n-nodes-base.', 'nodes-base.');
      const isWebhook = normalizedType === 'nodes-base.webhook' || 
                       normalizedType === 'nodes-base.webhookTrigger';
      
      if (!isWebhook) {
        result.errors.push({
          type: 'error',
          message: 'Single-node workflows are only valid for webhook endpoints. Add at least one more connected node to create a functional workflow.'
        });
      } else if (Object.keys(workflow.connections).length === 0) {
        result.warnings.push({
          type: 'warning',
          message: 'Webhook node has no connections. Consider adding nodes to process the webhook data.'
        });
      }
    }

    // Check for empty connections in multi-node workflows
    if (workflow.nodes.length > 1) {
      const hasEnabledNodes = workflow.nodes.some(n => !n.disabled);
      const hasConnections = Object.keys(workflow.connections).length > 0;
      
      if (hasEnabledNodes && !hasConnections) {
        result.errors.push({
          type: 'error',
          message: 'Multi-node workflow has no connections. Nodes must be connected to create a workflow. Use connections: { "Source Node Name": { "main": [[{ "node": "Target Node Name", "type": "main", "index": 0 }]] } }'
        });
      }
    }

    // Check for duplicate node names
    const nodeNames = new Set<string>();
    const nodeIds = new Set<string>();
    
    for (const node of workflow.nodes) {
      if (nodeNames.has(node.name)) {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: `Duplicate node name: "${node.name}"`
        });
      }
      nodeNames.add(node.name);

      if (nodeIds.has(node.id)) {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          message: `Duplicate node ID: "${node.id}"`
        });
      }
      nodeIds.add(node.id);
    }

    // Count trigger nodes - normalize type names first
    const triggerNodes = workflow.nodes.filter(n => {
      const normalizedType = n.type.replace('n8n-nodes-base.', 'nodes-base.');
      return normalizedType.toLowerCase().includes('trigger') || 
             normalizedType.toLowerCase().includes('webhook') ||
             normalizedType === 'nodes-base.start' ||
             normalizedType === 'nodes-base.manualTrigger' ||
             normalizedType === 'nodes-base.formTrigger';
    });
    result.statistics.triggerNodes = triggerNodes.length;

    // Check for at least one trigger node
    if (triggerNodes.length === 0 && workflow.nodes.filter(n => !n.disabled).length > 0) {
      result.warnings.push({
        type: 'warning',
        message: 'Workflow has no trigger nodes. It can only be executed manually.'
      });
    }
  }

  /**
   * Validate all nodes in the workflow
   */
  private async validateAllNodes(
    workflow: WorkflowJson,
    result: WorkflowValidationResult,
    profile: string
  ): Promise<void> {
    for (const node of workflow.nodes) {
      if (node.disabled || this.isStickyNote(node)) continue;

      try {
        // Validate node name length
        if (node.name && node.name.length > 255) {
          result.warnings.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.name,
            message: `Node name is very long (${node.name.length} characters). Consider using a shorter name for better readability.`
          });
        }

        // Validate node position
        if (!Array.isArray(node.position) || node.position.length !== 2) {
          result.errors.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.name,
            message: 'Node position must be an array with exactly 2 numbers [x, y]'
          });
        } else {
          const [x, y] = node.position;
          if (typeof x !== 'number' || typeof y !== 'number' || 
              !isFinite(x) || !isFinite(y)) {
            result.errors.push({
              type: 'error',
              nodeId: node.id,
              nodeName: node.name,
              message: 'Node position values must be finite numbers'
            });
          }
        }
        // FIRST: Check for common invalid patterns before database lookup
        if (node.type.startsWith('nodes-base.')) {
          // This is ALWAYS invalid in workflows - must use n8n-nodes-base prefix
          const correctType = node.type.replace('nodes-base.', 'n8n-nodes-base.');
          result.errors.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.name,
            message: `Invalid node type: "${node.type}". Use "${correctType}" instead. Node types in workflows must use the full package name.`
          });
          continue;
        }
        
        // Get node definition - try multiple formats
        let nodeInfo = this.nodeRepository.getNode(node.type);
        
        // If not found, try with normalized type
        if (!nodeInfo) {
          let normalizedType = node.type;
          
          // Handle n8n-nodes-base -> nodes-base
          if (node.type.startsWith('n8n-nodes-base.')) {
            normalizedType = node.type.replace('n8n-nodes-base.', 'nodes-base.');
            nodeInfo = this.nodeRepository.getNode(normalizedType);
          }
          // Handle @n8n/n8n-nodes-langchain -> nodes-langchain
          else if (node.type.startsWith('@n8n/n8n-nodes-langchain.')) {
            normalizedType = node.type.replace('@n8n/n8n-nodes-langchain.', 'nodes-langchain.');
            nodeInfo = this.nodeRepository.getNode(normalizedType);
          }
        }
        
        if (!nodeInfo) {
          // Check for common mistakes
          let suggestion = '';
          
          // Missing package prefix
          if (node.type.startsWith('nodes-base.')) {
            const withPrefix = node.type.replace('nodes-base.', 'n8n-nodes-base.');
            const exists = this.nodeRepository.getNode(withPrefix) || 
                          this.nodeRepository.getNode(withPrefix.replace('n8n-nodes-base.', 'nodes-base.'));
            if (exists) {
              suggestion = ` Did you mean "n8n-nodes-base.${node.type.substring(11)}"?`;
            }
          }
          // Check if it's just the node name without package
          else if (!node.type.includes('.')) {
            // Try common node names
            const commonNodes = [
              'webhook', 'httpRequest', 'set', 'code', 'manualTrigger', 
              'scheduleTrigger', 'emailSend', 'slack', 'discord'
            ];
            
            if (commonNodes.includes(node.type)) {
              suggestion = ` Did you mean "n8n-nodes-base.${node.type}"?`;
            }
          }
          
          // If no specific suggestion, try to find similar nodes
          if (!suggestion) {
            const similarNodes = this.findSimilarNodeTypes(node.type);
            if (similarNodes.length > 0) {
              suggestion = ` Did you mean: ${similarNodes.map(n => `"${n}"`).join(', ')}?`;
            }
          }
          
          result.errors.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.name,
            message: `Unknown node type: "${node.type}".${suggestion} Node types must include the package prefix (e.g., "n8n-nodes-base.webhook", not "webhook" or "nodes-base.webhook").`
          });
          continue;
        }

        // Validate typeVersion for versioned nodes
        if (nodeInfo.isVersioned) {
          // Check if typeVersion is missing
          if (!node.typeVersion) {
            result.errors.push({
              type: 'error',
              nodeId: node.id,
              nodeName: node.name,
              message: `Missing required property 'typeVersion'. Add typeVersion: ${nodeInfo.version || 1}`
            });
          } 
          // Check if typeVersion is invalid
          else if (typeof node.typeVersion !== 'number' || node.typeVersion < 1) {
            result.errors.push({
              type: 'error',
              nodeId: node.id,
              nodeName: node.name,
              message: `Invalid typeVersion: ${node.typeVersion}. Must be a positive number`
            });
          }
          // Check if typeVersion is outdated (less than latest)
          else if (nodeInfo.version && node.typeVersion < nodeInfo.version) {
            result.warnings.push({
              type: 'warning',
              nodeId: node.id,
              nodeName: node.name,
              message: `Outdated typeVersion: ${node.typeVersion}. Latest is ${nodeInfo.version}`
            });
          }
          // Check if typeVersion exceeds maximum supported
          else if (nodeInfo.version && node.typeVersion > nodeInfo.version) {
            result.errors.push({
              type: 'error',
              nodeId: node.id,
              nodeName: node.name,
              message: `typeVersion ${node.typeVersion} exceeds maximum supported version ${nodeInfo.version}`
            });
          }
        }

        // Validate node configuration
        const nodeValidation = this.nodeValidator.validateWithMode(
          node.type,
          node.parameters,
          nodeInfo.properties || [],
          'operation',
          profile as any
        );

        // Add node-specific errors and warnings
        nodeValidation.errors.forEach((error: any) => {
          result.errors.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.name,
            message: typeof error === 'string' ? error : error.message || String(error)
          });
        });

        nodeValidation.warnings.forEach((warning: any) => {
          result.warnings.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.name,
            message: typeof warning === 'string' ? warning : warning.message || String(warning)
          });
        });

      } catch (error) {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: `Failed to validate node: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  }

  /**
   * Validate workflow connections
   */
  private validateConnections(
    workflow: WorkflowJson,
    result: WorkflowValidationResult,
    profile: string = 'runtime'
  ): void {
    const nodeMap = new Map(workflow.nodes.map(n => [n.name, n]));
    const nodeIdMap = new Map(workflow.nodes.map(n => [n.id, n]));

    // Check all connections
    for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
      const sourceNode = nodeMap.get(sourceName);
      
      if (!sourceNode) {
        // Check if this is an ID being used instead of a name
        const nodeById = nodeIdMap.get(sourceName);
        if (nodeById) {
          result.errors.push({
            type: 'error',
            nodeId: nodeById.id,
            nodeName: nodeById.name,
            message: `Connection uses node ID '${sourceName}' instead of node name '${nodeById.name}'. In n8n, connections must use node names, not IDs.`
          });
        } else {
          result.errors.push({
            type: 'error',
            message: `Connection from non-existent node: "${sourceName}"`
          });
        }
        result.statistics.invalidConnections++;
        continue;
      }

      // Check main outputs
      if (outputs.main) {
        this.validateConnectionOutputs(
          sourceName,
          outputs.main,
          nodeMap,
          nodeIdMap,
          result,
          'main'
        );
      }

      // Check error outputs
      if (outputs.error) {
        this.validateConnectionOutputs(
          sourceName,
          outputs.error,
          nodeMap,
          nodeIdMap,
          result,
          'error'
        );
      }

      // Check AI tool outputs
      if (outputs.ai_tool) {
        this.validateConnectionOutputs(
          sourceName,
          outputs.ai_tool,
          nodeMap,
          nodeIdMap,
          result,
          'ai_tool'
        );
      }
    }

    // Check for orphaned nodes (not connected and not triggers)
    const connectedNodes = new Set<string>();
    
    // Add all source nodes
    Object.keys(workflow.connections).forEach(name => connectedNodes.add(name));
    
    // Add all target nodes
    Object.values(workflow.connections).forEach(outputs => {
      if (outputs.main) {
        outputs.main.flat().forEach(conn => {
          if (conn) connectedNodes.add(conn.node);
        });
      }
      if (outputs.error) {
        outputs.error.flat().forEach(conn => {
          if (conn) connectedNodes.add(conn.node);
        });
      }
      if (outputs.ai_tool) {
        outputs.ai_tool.flat().forEach(conn => {
          if (conn) connectedNodes.add(conn.node);
        });
      }
    });

    // Check for orphaned nodes (exclude sticky notes)
    for (const node of workflow.nodes) {
      if (node.disabled || this.isStickyNote(node)) continue;
      
      const normalizedType = node.type.replace('n8n-nodes-base.', 'nodes-base.');
      const isTrigger = normalizedType.toLowerCase().includes('trigger') || 
                       normalizedType.toLowerCase().includes('webhook') ||
                       normalizedType === 'nodes-base.start' ||
                       normalizedType === 'nodes-base.manualTrigger' ||
                       normalizedType === 'nodes-base.formTrigger';
      
      if (!connectedNodes.has(node.name) && !isTrigger) {
        result.warnings.push({
          type: 'warning',
          nodeId: node.id,
          nodeName: node.name,
          message: 'Node is not connected to any other nodes'
        });
      }
    }

    // Check for cycles (skip in minimal profile to reduce false positives)
    if (profile !== 'minimal' && this.hasCycle(workflow)) {
      result.errors.push({
        type: 'error',
        message: 'Workflow contains a cycle (infinite loop)'
      });
    }
  }

  /**
   * Validate connection outputs
   */
  private validateConnectionOutputs(
    sourceName: string,
    outputs: Array<Array<{ node: string; type: string; index: number }>>,
    nodeMap: Map<string, WorkflowNode>,
    nodeIdMap: Map<string, WorkflowNode>,
    result: WorkflowValidationResult,
    outputType: 'main' | 'error' | 'ai_tool'
  ): void {
    // Get source node for special validation
    const sourceNode = nodeMap.get(sourceName);
    
    outputs.forEach((outputConnections, outputIndex) => {
      if (!outputConnections) return;
      
      outputConnections.forEach(connection => {
        // Check for negative index
        if (connection.index < 0) {
          result.errors.push({
            type: 'error',
            message: `Invalid connection index ${connection.index} from "${sourceName}". Connection indices must be non-negative.`
          });
          result.statistics.invalidConnections++;
          return;
        }

        // Special validation for SplitInBatches node
        if (sourceNode && sourceNode.type === 'n8n-nodes-base.splitInBatches') {
          this.validateSplitInBatchesConnection(
            sourceNode,
            outputIndex,
            connection,
            nodeMap,
            result
          );
        }

        // Check for self-referencing connections
        if (connection.node === sourceName) {
          // This is only a warning for non-loop nodes
          if (sourceNode && sourceNode.type !== 'n8n-nodes-base.splitInBatches') {
            result.warnings.push({
              type: 'warning',
              message: `Node "${sourceName}" has a self-referencing connection. This can cause infinite loops.`
            });
          }
        }

        const targetNode = nodeMap.get(connection.node);
        
        if (!targetNode) {
          // Check if this is an ID being used instead of a name
          const nodeById = nodeIdMap.get(connection.node);
          if (nodeById) {
            result.errors.push({
              type: 'error',
              nodeId: nodeById.id,
              nodeName: nodeById.name,
              message: `Connection target uses node ID '${connection.node}' instead of node name '${nodeById.name}' (from ${sourceName}). In n8n, connections must use node names, not IDs.`
            });
          } else {
            result.errors.push({
              type: 'error',
              message: `Connection to non-existent node: "${connection.node}" from "${sourceName}"`
            });
          }
          result.statistics.invalidConnections++;
        } else if (targetNode.disabled) {
          result.warnings.push({
            type: 'warning',
            message: `Connection to disabled node: "${connection.node}" from "${sourceName}"`
          });
        } else {
          result.statistics.validConnections++;
          
          // Additional validation for AI tool connections
          if (outputType === 'ai_tool') {
            this.validateAIToolConnection(sourceName, targetNode, result);
          }
        }
      });
    });
  }

  /**
   * Validate AI tool connections
   */
  private validateAIToolConnection(
    sourceName: string,
    targetNode: WorkflowNode,
    result: WorkflowValidationResult
  ): void {
    // For AI tool connections, we just need to check if this is being used as a tool
    // The source should be an AI Agent connecting to this target node as a tool
    
    // Get target node info to check if it can be used as a tool
    let targetNodeInfo = this.nodeRepository.getNode(targetNode.type);
    
    // Try normalized type if not found
    if (!targetNodeInfo) {
      let normalizedType = targetNode.type;
      
      // Handle n8n-nodes-base -> nodes-base
      if (targetNode.type.startsWith('n8n-nodes-base.')) {
        normalizedType = targetNode.type.replace('n8n-nodes-base.', 'nodes-base.');
        targetNodeInfo = this.nodeRepository.getNode(normalizedType);
      }
      // Handle @n8n/n8n-nodes-langchain -> nodes-langchain
      else if (targetNode.type.startsWith('@n8n/n8n-nodes-langchain.')) {
        normalizedType = targetNode.type.replace('@n8n/n8n-nodes-langchain.', 'nodes-langchain.');
        targetNodeInfo = this.nodeRepository.getNode(normalizedType);
      }
    }
    
    if (targetNodeInfo && !targetNodeInfo.isAITool && targetNodeInfo.package !== 'n8n-nodes-base') {
      // It's a community node being used as a tool
      result.warnings.push({
        type: 'warning',
        nodeId: targetNode.id,
        nodeName: targetNode.name,
        message: `Community node "${targetNode.name}" is being used as an AI tool. Ensure N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true is set.`
      });
    }
  }

  /**
   * Check if workflow has cycles
   * Allow legitimate loops for SplitInBatches and similar loop nodes
   */
  private hasCycle(workflow: WorkflowJson): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const nodeTypeMap = new Map<string, string>();
    
    // Build node type map (exclude sticky notes)
    workflow.nodes.forEach(node => {
      if (!this.isStickyNote(node)) {
        nodeTypeMap.set(node.name, node.type);
      }
    });
    
    // Known legitimate loop node types
    const loopNodeTypes = [
      'n8n-nodes-base.splitInBatches',
      'nodes-base.splitInBatches',
      'n8n-nodes-base.itemLists',
      'nodes-base.itemLists',
      'n8n-nodes-base.loop',
      'nodes-base.loop'
    ];

    const hasCycleDFS = (nodeName: string, pathFromLoopNode: boolean = false): boolean => {
      visited.add(nodeName);
      recursionStack.add(nodeName);

      const connections = workflow.connections[nodeName];
      if (connections) {
        const allTargets: string[] = [];
        
        if (connections.main) {
          connections.main.flat().forEach(conn => {
            if (conn) allTargets.push(conn.node);
          });
        }
        
        if (connections.error) {
          connections.error.flat().forEach(conn => {
            if (conn) allTargets.push(conn.node);
          });
        }
        
        if (connections.ai_tool) {
          connections.ai_tool.flat().forEach(conn => {
            if (conn) allTargets.push(conn.node);
          });
        }

        const currentNodeType = nodeTypeMap.get(nodeName);
        const isLoopNode = loopNodeTypes.includes(currentNodeType || '');
        
        for (const target of allTargets) {
          if (!visited.has(target)) {
            if (hasCycleDFS(target, pathFromLoopNode || isLoopNode)) return true;
          } else if (recursionStack.has(target)) {
            // Allow cycles that involve legitimate loop nodes
            const targetNodeType = nodeTypeMap.get(target);
            const isTargetLoopNode = loopNodeTypes.includes(targetNodeType || '');
            
            // If this cycle involves a loop node, it's legitimate
            if (isTargetLoopNode || pathFromLoopNode || isLoopNode) {
              continue; // Allow this cycle
            }
            
            return true; // Reject other cycles
          }
        }
      }

      recursionStack.delete(nodeName);
      return false;
    };

    // Check from all executable nodes (exclude sticky notes)
    for (const node of workflow.nodes) {
      if (!this.isStickyNote(node) && !visited.has(node.name)) {
        if (hasCycleDFS(node.name)) return true;
      }
    }

    return false;
  }

  /**
   * Validate expressions in the workflow
   */
  private validateExpressions(
    workflow: WorkflowJson,
    result: WorkflowValidationResult,
    profile: string = 'runtime'
  ): void {
    const nodeNames = workflow.nodes.map(n => n.name);

    for (const node of workflow.nodes) {
      if (node.disabled || this.isStickyNote(node)) continue;

      // Create expression context
      const context = {
        availableNodes: nodeNames.filter(n => n !== node.name),
        currentNodeName: node.name,
        hasInputData: this.nodeHasInput(node.name, workflow),
        isInLoop: false // Could be enhanced to detect loop nodes
      };

      // Validate expressions in parameters
      const exprValidation = ExpressionValidator.validateNodeExpressions(
        node.parameters,
        context
      );

      // Count actual expressions found, not just unique variables
      const expressionCount = this.countExpressionsInObject(node.parameters);
      result.statistics.expressionsValidated += expressionCount;

      // Add expression errors and warnings
      exprValidation.errors.forEach(error => {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: `Expression error: ${error}`
        });
      });

      exprValidation.warnings.forEach(warning => {
        result.warnings.push({
          type: 'warning',
          nodeId: node.id,
          nodeName: node.name,
          message: `Expression warning: ${warning}`
        });
      });
    }
  }

  /**
   * Count expressions in an object recursively
   */
  private countExpressionsInObject(obj: any): number {
    let count = 0;
    
    if (typeof obj === 'string') {
      // Count expressions in string
      const matches = obj.match(/\{\{[\s\S]+?\}\}/g);
      if (matches) {
        count += matches.length;
      }
    } else if (Array.isArray(obj)) {
      // Recursively count in arrays
      for (const item of obj) {
        count += this.countExpressionsInObject(item);
      }
    } else if (obj && typeof obj === 'object') {
      // Recursively count in objects
      for (const value of Object.values(obj)) {
        count += this.countExpressionsInObject(value);
      }
    }
    
    return count;
  }

  /**
   * Check if a node has input connections
   */
  private nodeHasInput(nodeName: string, workflow: WorkflowJson): boolean {
    for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
      if (outputs.main) {
        for (const outputConnections of outputs.main) {
          if (outputConnections?.some(conn => conn.node === nodeName)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check workflow patterns and best practices
   */
  private checkWorkflowPatterns(
    workflow: WorkflowJson,
    result: WorkflowValidationResult,
    profile: string = 'runtime'
  ): void {
    // Check for error handling
    const hasErrorHandling = Object.values(workflow.connections).some(
      outputs => outputs.error && outputs.error.length > 0
    );

    // Only suggest error handling in stricter profiles
    if (!hasErrorHandling && workflow.nodes.length > 3 && profile !== 'minimal') {
      result.warnings.push({
        type: 'warning',
        message: 'Consider adding error handling to your workflow'
      });
    }

    // Check node-level error handling properties for ALL executable nodes
    for (const node of workflow.nodes) {
      if (!this.isStickyNote(node)) {
        this.checkNodeErrorHandling(node, workflow, result);
      }
    }

    // Check for very long linear workflows
    const linearChainLength = this.getLongestLinearChain(workflow);
    if (linearChainLength > 10) {
      result.warnings.push({
        type: 'warning',
        message: `Long linear chain detected (${linearChainLength} nodes). Consider breaking into sub-workflows.`
      });
    }

    // Generate error handling suggestions based on all nodes
    this.generateErrorHandlingSuggestions(workflow, result);

    // Check for missing credentials
    for (const node of workflow.nodes) {
      if (node.credentials && Object.keys(node.credentials).length > 0) {
        for (const [credType, credConfig] of Object.entries(node.credentials)) {
          if (!credConfig || (typeof credConfig === 'object' && !('id' in credConfig))) {
            result.warnings.push({
              type: 'warning',
              nodeId: node.id,
              nodeName: node.name,
              message: `Missing credentials configuration for ${credType}`
            });
          }
        }
      }
    }

    // Check for AI Agent workflows
    const aiAgentNodes = workflow.nodes.filter(n => 
      n.type.toLowerCase().includes('agent') || 
      n.type.includes('langchain.agent')
    );
    
    if (aiAgentNodes.length > 0) {
      // Check if AI agents have tools connected
      for (const agentNode of aiAgentNodes) {
        const connections = workflow.connections[agentNode.name];
        if (!connections?.ai_tool || connections.ai_tool.flat().filter(c => c).length === 0) {
          result.warnings.push({
            type: 'warning',
            nodeId: agentNode.id,
            nodeName: agentNode.name,
            message: 'AI Agent has no tools connected. Consider adding tools to enhance agent capabilities.'
          });
        }
      }
      
      // Check for community nodes used as tools
      const hasAIToolConnections = Object.values(workflow.connections).some(
        outputs => outputs.ai_tool && outputs.ai_tool.length > 0
      );
      
      if (hasAIToolConnections) {
        result.suggestions.push(
          'For community nodes used as AI tools, ensure N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true is set'
        );
      }
    }
  }

  /**
   * Get the longest linear chain in the workflow
   */
  private getLongestLinearChain(workflow: WorkflowJson): number {
    const memo = new Map<string, number>();
    const visiting = new Set<string>();

    const getChainLength = (nodeName: string): number => {
      // If we're already visiting this node, we have a cycle
      if (visiting.has(nodeName)) return 0;
      
      if (memo.has(nodeName)) return memo.get(nodeName)!;

      visiting.add(nodeName);

      let maxLength = 0;
      const connections = workflow.connections[nodeName];
      
      if (connections?.main) {
        for (const outputConnections of connections.main) {
          if (outputConnections) {
            for (const conn of outputConnections) {
              const length = getChainLength(conn.node);
              maxLength = Math.max(maxLength, length);
            }
          }
        }
      }

      visiting.delete(nodeName);
      const result = maxLength + 1;
      memo.set(nodeName, result);
      return result;
    };

    let maxChain = 0;
    for (const node of workflow.nodes) {
      if (!this.nodeHasInput(node.name, workflow)) {
        maxChain = Math.max(maxChain, getChainLength(node.name));
      }
    }

    return maxChain;
  }

  /**
   * Find similar node types for suggestions
   */
  private findSimilarNodeTypes(invalidType: string): string[] {
    // Since we don't have a method to list all nodes, we'll use a predefined list
    // of common node types that users might be looking for
    const suggestions: string[] = [];
    const nodeName = invalidType.includes('.') ? invalidType.split('.').pop()! : invalidType;
    
    const commonNodeMappings: Record<string, string[]> = {
      'webhook': ['nodes-base.webhook'],
      'httpRequest': ['nodes-base.httpRequest'],
      'http': ['nodes-base.httpRequest'],
      'set': ['nodes-base.set'],
      'code': ['nodes-base.code'],
      'manualTrigger': ['nodes-base.manualTrigger'],
      'manual': ['nodes-base.manualTrigger'],
      'scheduleTrigger': ['nodes-base.scheduleTrigger'],
      'schedule': ['nodes-base.scheduleTrigger'],
      'cron': ['nodes-base.scheduleTrigger'],
      'emailSend': ['nodes-base.emailSend'],
      'email': ['nodes-base.emailSend'],
      'slack': ['nodes-base.slack'],
      'discord': ['nodes-base.discord'],
      'postgres': ['nodes-base.postgres'],
      'mysql': ['nodes-base.mySql'],
      'mongodb': ['nodes-base.mongoDb'],
      'redis': ['nodes-base.redis'],
      'if': ['nodes-base.if'],
      'switch': ['nodes-base.switch'],
      'merge': ['nodes-base.merge'],
      'splitInBatches': ['nodes-base.splitInBatches'],
      'loop': ['nodes-base.splitInBatches'],
      'googleSheets': ['nodes-base.googleSheets'],
      'sheets': ['nodes-base.googleSheets'],
      'airtable': ['nodes-base.airtable'],
      'github': ['nodes-base.github'],
      'git': ['nodes-base.github'],
    };
    
    // Check for exact match
    const lowerNodeName = nodeName.toLowerCase();
    if (commonNodeMappings[lowerNodeName]) {
      suggestions.push(...commonNodeMappings[lowerNodeName]);
    }
    
    // Check for partial matches
    Object.entries(commonNodeMappings).forEach(([key, values]) => {
      if (key.includes(lowerNodeName) || lowerNodeName.includes(key)) {
        values.forEach(v => {
          if (!suggestions.includes(v)) {
            suggestions.push(v);
          }
        });
      }
    });
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Generate suggestions based on validation results
   */
  private generateSuggestions(
    workflow: WorkflowJson,
    result: WorkflowValidationResult
  ): void {
    // Suggest adding trigger if missing
    if (result.statistics.triggerNodes === 0) {
      result.suggestions.push(
        'Add a trigger node (e.g., Webhook, Schedule Trigger) to automate workflow execution'
      );
    }

    // Suggest proper connection structure for workflows with connection errors
    const hasConnectionErrors = result.errors.some(e =>
      typeof e.message === 'string' && (
        e.message.includes('connection') ||
        e.message.includes('Connection') ||
        e.message.includes('Multi-node workflow has no connections')
      )
    );
    
    if (hasConnectionErrors) {
      result.suggestions.push(
        'Example connection structure: connections: { "Manual Trigger": { "main": [[{ "node": "Set", "type": "main", "index": 0 }]] } }'
      );
      result.suggestions.push(
        'Remember: Use node NAMES (not IDs) in connections. The name is what you see in the UI, not the node type.'
      );
    }

    // Suggest error handling
    if (!Object.values(workflow.connections).some(o => o.error)) {
      result.suggestions.push(
        'Add error handling using the error output of nodes or an Error Trigger node'
      );
    }

    // Suggest optimization for large workflows
    if (workflow.nodes.length > 20) {
      result.suggestions.push(
        'Consider breaking this workflow into smaller sub-workflows for better maintainability'
      );
    }

    // Suggest using Code node for complex logic
    const complexExpressionNodes = workflow.nodes.filter(node => {
      const jsonString = JSON.stringify(node.parameters);
      const expressionCount = (jsonString.match(/\{\{/g) || []).length;
      return expressionCount > 5;
    });

    if (complexExpressionNodes.length > 0) {
      result.suggestions.push(
        'Consider using a Code node for complex data transformations instead of multiple expressions'
      );
    }

    // Suggest minimum workflow structure
    if (workflow.nodes.length === 1 && Object.keys(workflow.connections).length === 0) {
      result.suggestions.push(
        'A minimal workflow needs: 1) A trigger node (e.g., Manual Trigger), 2) An action node (e.g., Set, HTTP Request), 3) A connection between them'
      );
    }
  }

  /**
   * Check node-level error handling configuration for a single node
   */
  private checkNodeErrorHandling(
    node: WorkflowNode,
    workflow: WorkflowJson,
    result: WorkflowValidationResult
  ): void {
    // Only skip if disabled is explicitly true (not just truthy)
    if (node.disabled === true) return;

    // Define node types that typically interact with external services (lowercase for comparison)
    const errorProneNodeTypes = [
      'httprequest',
      'webhook',
      'emailsend',
      'slack',
      'discord',
      'telegram',
      'postgres',
      'mysql',
      'mongodb',
      'redis',
      'github',
      'gitlab',
      'jira',
      'salesforce',
      'hubspot',
      'airtable',
      'googlesheets',
      'googledrive',
      'dropbox',
      's3',
      'ftp',
      'ssh',
      'mqtt',
      'kafka',
      'rabbitmq',
      'graphql',
      'openai',
      'anthropic'
    ];

    const normalizedType = node.type.toLowerCase();
    const isErrorProne = errorProneNodeTypes.some(type => normalizedType.includes(type));

    // CRITICAL: Check for node-level properties in wrong location (inside parameters)
    const nodeLevelProps = [
      // Error handling properties
      'onError', 'continueOnFail', 'retryOnFail', 'maxTries', 'waitBetweenTries', 'alwaysOutputData',
      // Other node-level properties
      'executeOnce', 'disabled', 'notes', 'notesInFlow', 'credentials'
    ];
    const misplacedProps: string[] = [];
    
    if (node.parameters) {
      for (const prop of nodeLevelProps) {
        if (node.parameters[prop] !== undefined) {
          misplacedProps.push(prop);
        }
      }
    }
    
    if (misplacedProps.length > 0) {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: `Node-level properties ${misplacedProps.join(', ')} are in the wrong location. They must be at the node level, not inside parameters.`,
          details: {
            fix: `Move these properties from node.parameters to the node level. Example:\n` +
                 `{\n` +
                 `  "name": "${node.name}",\n` +
                 `  "type": "${node.type}",\n` +
                 `  "parameters": { /* operation-specific params */ },\n` +
                 `  "onError": "continueErrorOutput",  // ✅ Correct location\n` +
                 `  "retryOnFail": true,               // ✅ Correct location\n` +
                 `  "executeOnce": true,               // ✅ Correct location\n` +
                 `  "disabled": false,                 // ✅ Correct location\n` +
                 `  "credentials": { /* ... */ }       // ✅ Correct location\n` +
                 `}`
          }
        });
    }

    // Validate error handling properties
    
    // Check for onError property (the modern approach)
    if (node.onError !== undefined) {
        const validOnErrorValues = ['continueRegularOutput', 'continueErrorOutput', 'stopWorkflow'];
        if (!validOnErrorValues.includes(node.onError)) {
          result.errors.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.name,
            message: `Invalid onError value: "${node.onError}". Must be one of: ${validOnErrorValues.join(', ')}`
          });
        }
    }

    // Check for deprecated continueOnFail
    if (node.continueOnFail !== undefined) {
        if (typeof node.continueOnFail !== 'boolean') {
          result.errors.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.name,
            message: 'continueOnFail must be a boolean value'
          });
        } else if (node.continueOnFail === true) {
          // Warn about using deprecated property
          result.warnings.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.name,
            message: 'Using deprecated "continueOnFail: true". Use "onError: \'continueRegularOutput\'" instead for better control and UI compatibility.'
          });
        }
    }

    // Check for conflicting error handling properties
    if (node.continueOnFail !== undefined && node.onError !== undefined) {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: 'Cannot use both "continueOnFail" and "onError" properties. Use only "onError" for modern workflows.'
        });
    }

    if (node.retryOnFail !== undefined) {
        if (typeof node.retryOnFail !== 'boolean') {
          result.errors.push({
            type: 'error',
            nodeId: node.id,
            nodeName: node.name,
            message: 'retryOnFail must be a boolean value'
          });
        }

        // If retry is enabled, check retry configuration
        if (node.retryOnFail === true) {
          if (node.maxTries !== undefined) {
            if (typeof node.maxTries !== 'number' || node.maxTries < 1) {
              result.errors.push({
                type: 'error',
                nodeId: node.id,
                nodeName: node.name,
                message: 'maxTries must be a positive number when retryOnFail is enabled'
              });
            } else if (node.maxTries > 10) {
              result.warnings.push({
                type: 'warning',
                nodeId: node.id,
                nodeName: node.name,
                message: `maxTries is set to ${node.maxTries}. Consider if this many retries is necessary.`
              });
            }
          } else {
            // maxTries defaults to 3 if not specified
            result.warnings.push({
              type: 'warning',
              nodeId: node.id,
              nodeName: node.name,
              message: 'retryOnFail is enabled but maxTries is not specified. Default is 3 attempts.'
            });
          }

          if (node.waitBetweenTries !== undefined) {
            if (typeof node.waitBetweenTries !== 'number' || node.waitBetweenTries < 0) {
              result.errors.push({
                type: 'error',
                nodeId: node.id,
                nodeName: node.name,
                message: 'waitBetweenTries must be a non-negative number (milliseconds)'
              });
            } else if (node.waitBetweenTries > 300000) { // 5 minutes
              result.warnings.push({
                type: 'warning',
                nodeId: node.id,
                nodeName: node.name,
                message: `waitBetweenTries is set to ${node.waitBetweenTries}ms (${(node.waitBetweenTries/1000).toFixed(1)}s). This seems excessive.`
              });
            }
          }
        }
    }

    if (node.alwaysOutputData !== undefined && typeof node.alwaysOutputData !== 'boolean') {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: 'alwaysOutputData must be a boolean value'
        });
    }

    // Warnings for error-prone nodes without error handling
    const hasErrorHandling = node.onError || node.continueOnFail || node.retryOnFail;
    
    if (isErrorProne && !hasErrorHandling) {
        const nodeTypeSimple = normalizedType.split('.').pop() || normalizedType;
        
        // Special handling for specific node types
        if (normalizedType.includes('httprequest')) {
          result.warnings.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.name,
            message: 'HTTP Request node without error handling. Consider adding "onError: \'continueRegularOutput\'" for non-critical requests or "retryOnFail: true" for transient failures.'
          });
        } else if (normalizedType.includes('webhook')) {
          result.warnings.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.name,
            message: 'Webhook node without error handling. Consider adding "onError: \'continueRegularOutput\'" to prevent workflow failures from blocking webhook responses.'
          });
        } else if (errorProneNodeTypes.some(db => normalizedType.includes(db) && ['postgres', 'mysql', 'mongodb'].includes(db))) {
          result.warnings.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.name,
            message: `Database operation without error handling. Consider adding "retryOnFail: true" for connection issues or "onError: \'continueRegularOutput\'" for non-critical queries.`
          });
        } else {
          result.warnings.push({
            type: 'warning',
            nodeId: node.id,
            nodeName: node.name,
            message: `${nodeTypeSimple} node without error handling. Consider using "onError" property for better error management.`
          });
        }
    }

    // Check for problematic combinations
    if (node.continueOnFail && node.retryOnFail) {
        result.warnings.push({
          type: 'warning',
          nodeId: node.id,
          nodeName: node.name,
          message: 'Both continueOnFail and retryOnFail are enabled. The node will retry first, then continue on failure.'
        });
    }

    // Validate additional node-level properties
    
    // Check executeOnce
    if (node.executeOnce !== undefined && typeof node.executeOnce !== 'boolean') {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: 'executeOnce must be a boolean value'
        });
    }

    // Check disabled
    if (node.disabled !== undefined && typeof node.disabled !== 'boolean') {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: 'disabled must be a boolean value'
        });
    }

    // Check notesInFlow
    if (node.notesInFlow !== undefined && typeof node.notesInFlow !== 'boolean') {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: 'notesInFlow must be a boolean value'
        });
    }

    // Check notes
    if (node.notes !== undefined && typeof node.notes !== 'string') {
        result.errors.push({
          type: 'error',
          nodeId: node.id,
          nodeName: node.name,
          message: 'notes must be a string value'
        });
    }

    // Provide guidance for executeOnce
    if (node.executeOnce === true) {
        result.warnings.push({
          type: 'warning',
          nodeId: node.id,
          nodeName: node.name,
          message: 'executeOnce is enabled. This node will execute only once regardless of input items.'
        });
    }

    // Suggest alwaysOutputData for debugging
    if ((node.continueOnFail || node.retryOnFail) && !node.alwaysOutputData) {
        if (normalizedType.includes('httprequest') || normalizedType.includes('webhook')) {
          result.suggestions.push(
            `Consider enabling alwaysOutputData on "${node.name}" to capture error responses for debugging`
          );
        }
      }

  }

  /**
   * Generate error handling suggestions based on all nodes
   */
  private generateErrorHandlingSuggestions(
    workflow: WorkflowJson,
    result: WorkflowValidationResult
  ): void {
    // Add general suggestions based on findings
    const nodesWithoutErrorHandling = workflow.nodes.filter(n => 
      !n.disabled && !n.onError && !n.continueOnFail && !n.retryOnFail
    ).length;

    if (nodesWithoutErrorHandling > 5 && workflow.nodes.length > 5) {
      result.suggestions.push(
        'Most nodes lack error handling. Use "onError" property for modern error handling: "continueRegularOutput" (continue on error), "continueErrorOutput" (use error output), or "stopWorkflow" (stop execution).'
      );
    }

    // Check for nodes using deprecated continueOnFail
    const nodesWithDeprecatedErrorHandling = workflow.nodes.filter(n => 
      !n.disabled && n.continueOnFail === true
    ).length;

    if (nodesWithDeprecatedErrorHandling > 0) {
      result.suggestions.push(
        'Replace "continueOnFail: true" with "onError: \'continueRegularOutput\'" for better UI compatibility and control.'
      );
    }
  }

  /**
   * Validate SplitInBatches node connections for common mistakes
   */
  private validateSplitInBatchesConnection(
    sourceNode: WorkflowNode,
    outputIndex: number,
    connection: { node: string; type: string; index: number },
    nodeMap: Map<string, WorkflowNode>,
    result: WorkflowValidationResult
  ): void {
    const targetNode = nodeMap.get(connection.node);
    if (!targetNode) return;

    // Check if connections appear to be reversed
    // Output 0 = "done", Output 1 = "loop"
    
    if (outputIndex === 0) {
      // This is the "done" output (index 0)
      // Check if target looks like it should be in the loop
      const targetType = targetNode.type.toLowerCase();
      const targetName = targetNode.name.toLowerCase();
      
      // Common patterns that suggest this node should be inside the loop
      if (targetType.includes('function') || 
          targetType.includes('code') ||
          targetType.includes('item') ||
          targetName.includes('process') ||
          targetName.includes('transform') ||
          targetName.includes('handle')) {
        
        // Check if this node connects back to the SplitInBatches
        const hasLoopBack = this.checkForLoopBack(targetNode.name, sourceNode.name, nodeMap);
        
        if (hasLoopBack) {
          result.errors.push({
            type: 'error',
            nodeId: sourceNode.id,
            nodeName: sourceNode.name,
            message: `SplitInBatches outputs appear reversed! Node "${targetNode.name}" is connected to output 0 ("done") but connects back to the loop. It should be connected to output 1 ("loop") instead. Remember: Output 0 = "done" (post-loop), Output 1 = "loop" (inside loop).`
          });
        } else {
          result.warnings.push({
            type: 'warning',
            nodeId: sourceNode.id,
            nodeName: sourceNode.name,
            message: `Node "${targetNode.name}" is connected to the "done" output (index 0) but appears to be a processing node. Consider connecting it to the "loop" output (index 1) if it should process items inside the loop.`
          });
        }
      }
    } else if (outputIndex === 1) {
      // This is the "loop" output (index 1)
      // Check if target looks like it should be after the loop
      const targetType = targetNode.type.toLowerCase();
      const targetName = targetNode.name.toLowerCase();
      
      // Common patterns that suggest this node should be after the loop
      if (targetType.includes('aggregate') ||
          targetType.includes('merge') ||
          targetType.includes('email') ||
          targetType.includes('slack') ||
          targetName.includes('final') ||
          targetName.includes('complete') ||
          targetName.includes('summary') ||
          targetName.includes('report')) {
        
        result.warnings.push({
          type: 'warning',
          nodeId: sourceNode.id,
          nodeName: sourceNode.name,
          message: `Node "${targetNode.name}" is connected to the "loop" output (index 1) but appears to be a post-processing node. Consider connecting it to the "done" output (index 0) if it should run after all iterations complete.`
        });
      }
      
      // Check if loop output doesn't eventually connect back
      const hasLoopBack = this.checkForLoopBack(targetNode.name, sourceNode.name, nodeMap);
      if (!hasLoopBack) {
        result.warnings.push({
          type: 'warning',
          nodeId: sourceNode.id,
          nodeName: sourceNode.name,
          message: `The "loop" output connects to "${targetNode.name}" but doesn't connect back to the SplitInBatches node. The last node in the loop should connect back to complete the iteration.`
        });
      }
    }
  }

  /**
   * Check if a node eventually connects back to a target node
   */
  private checkForLoopBack(
    startNode: string,
    targetNode: string,
    nodeMap: Map<string, WorkflowNode>,
    visited: Set<string> = new Set(),
    maxDepth: number = 50
  ): boolean {
    if (maxDepth <= 0) return false; // Prevent stack overflow
    if (visited.has(startNode)) return false;
    visited.add(startNode);

    const node = nodeMap.get(startNode);
    if (!node) return false;

    // Access connections from the workflow structure, not the node
    // We need to access this.currentWorkflow.connections[startNode]
    const connections = (this as any).currentWorkflow?.connections[startNode];
    if (!connections) return false;

    for (const [outputType, outputs] of Object.entries(connections)) {
      if (!Array.isArray(outputs)) continue;
      
      for (const outputConnections of outputs) {
        if (!Array.isArray(outputConnections)) continue;
        
        for (const conn of outputConnections) {
          if (conn.node === targetNode) {
            return true;
          }
          
          // Recursively check connected nodes
          if (this.checkForLoopBack(conn.node, targetNode, nodeMap, visited, maxDepth - 1)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Add AI-specific error recovery suggestions
   */
  private addErrorRecoverySuggestions(result: WorkflowValidationResult): void {
    // Categorize errors and provide specific recovery actions
    const errorTypes = {
      nodeType: result.errors.filter(e => e.message.includes('node type') || e.message.includes('Node type')),
      connection: result.errors.filter(e => e.message.includes('connection') || e.message.includes('Connection')),
      structure: result.errors.filter(e => e.message.includes('structure') || e.message.includes('nodes must be')),
      configuration: result.errors.filter(e => e.message.includes('property') || e.message.includes('field')),
      typeVersion: result.errors.filter(e => e.message.includes('typeVersion'))
    };

    // Add recovery suggestions based on error types
    if (errorTypes.nodeType.length > 0) {
      result.suggestions.unshift(
        '🔧 RECOVERY: Invalid node types detected. Use these patterns:',
        '   • For core nodes: "n8n-nodes-base.nodeName" (e.g., "n8n-nodes-base.webhook")',
        '   • For AI nodes: "@n8n/n8n-nodes-langchain.nodeName"',
        '   • Never use just the node name without package prefix'
      );
    }

    if (errorTypes.connection.length > 0) {
      result.suggestions.unshift(
        '🔧 RECOVERY: Connection errors detected. Fix with:',
        '   • Use node NAMES in connections, not IDs or types',
        '   • Structure: { "Source Node Name": { "main": [[{ "node": "Target Node Name", "type": "main", "index": 0 }]] } }',
        '   • Ensure all referenced nodes exist in the workflow'
      );
    }

    if (errorTypes.structure.length > 0) {
      result.suggestions.unshift(
        '🔧 RECOVERY: Workflow structure errors. Fix with:',
        '   • Ensure "nodes" is an array: "nodes": [...]',
        '   • Ensure "connections" is an object: "connections": {...}',
        '   • Add at least one node to create a valid workflow'
      );
    }

    if (errorTypes.configuration.length > 0) {
      result.suggestions.unshift(
        '🔧 RECOVERY: Node configuration errors. Fix with:',
        '   • Check required fields using validate_node_minimal first',
        '   • Use get_node_essentials to see what fields are needed',
        '   • Ensure operation-specific fields match the node\'s requirements'
      );
    }

    if (errorTypes.typeVersion.length > 0) {
      result.suggestions.unshift(
        '🔧 RECOVERY: TypeVersion errors. Fix with:',
        '   • Add "typeVersion": 1 (or latest version) to each node',
        '   • Use get_node_info to check the correct version for each node type'
      );
    }

    // Add general recovery workflow
    if (result.errors.length > 3) {
      result.suggestions.push(
        '📋 SUGGESTED WORKFLOW: Too many errors detected. Try this approach:',
        '   1. Fix structural issues first (nodes array, connections object)',
        '   2. Validate node types and fix invalid ones',
        '   3. Add required typeVersion to all nodes',
        '   4. Test connections step by step',
        '   5. Use validate_node_minimal on individual nodes to verify configuration'
      );
    }
  }
}