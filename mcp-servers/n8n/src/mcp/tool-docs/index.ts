import { ToolDocumentation } from './types';

// Import all tool documentations
import { searchNodesDoc, listNodesDoc, listAiToolsDoc, getDatabaseStatisticsDoc } from './discovery';
import { 
  getNodeEssentialsDoc, 
  getNodeInfoDoc, 
  getNodeDocumentationDoc,
  searchNodePropertiesDoc,
  getNodeAsToolInfoDoc,
  getPropertyDependenciesDoc
} from './configuration';
import { 
  validateNodeMinimalDoc, 
  validateNodeOperationDoc,
  validateWorkflowDoc,
  validateWorkflowConnectionsDoc,
  validateWorkflowExpressionsDoc
} from './validation';
import { 
  listTasksDoc, 
  getNodeForTaskDoc, 
  listNodeTemplatesDoc, 
  getTemplateDoc, 
  searchTemplatesDoc, 
  getTemplatesForTaskDoc 
} from './templates';
import { 
  toolsDocumentationDoc,
  n8nDiagnosticDoc,
  n8nHealthCheckDoc,
  n8nListAvailableToolsDoc
} from './system';
import {
  n8nCreateWorkflowDoc,
  n8nGetWorkflowDoc,
  n8nGetWorkflowDetailsDoc,
  n8nGetWorkflowStructureDoc,
  n8nGetWorkflowMinimalDoc,
  n8nUpdateFullWorkflowDoc,
  n8nUpdatePartialWorkflowDoc,
  n8nDeleteWorkflowDoc,
  n8nListWorkflowsDoc,
  n8nValidateWorkflowDoc,
  n8nTriggerWebhookWorkflowDoc,
  n8nGetExecutionDoc,
  n8nListExecutionsDoc,
  n8nDeleteExecutionDoc
} from './workflow_management';

// Combine all tool documentations into a single object
export const toolsDocumentation: Record<string, ToolDocumentation> = {
  // System tools
  tools_documentation: toolsDocumentationDoc,
  n8n_diagnostic: n8nDiagnosticDoc,
  n8n_health_check: n8nHealthCheckDoc,
  n8n_list_available_tools: n8nListAvailableToolsDoc,
  
  // Discovery tools
  search_nodes: searchNodesDoc,
  list_nodes: listNodesDoc,
  list_ai_tools: listAiToolsDoc,
  get_database_statistics: getDatabaseStatisticsDoc,
  
  // Configuration tools
  get_node_essentials: getNodeEssentialsDoc,
  get_node_info: getNodeInfoDoc,
  get_node_documentation: getNodeDocumentationDoc,
  search_node_properties: searchNodePropertiesDoc,
  get_node_as_tool_info: getNodeAsToolInfoDoc,
  get_property_dependencies: getPropertyDependenciesDoc,
  
  // Validation tools
  validate_node_minimal: validateNodeMinimalDoc,
  validate_node_operation: validateNodeOperationDoc,
  validate_workflow: validateWorkflowDoc,
  validate_workflow_connections: validateWorkflowConnectionsDoc,
  validate_workflow_expressions: validateWorkflowExpressionsDoc,
  
  // Template tools
  list_tasks: listTasksDoc,
  get_node_for_task: getNodeForTaskDoc,
  list_node_templates: listNodeTemplatesDoc,
  get_template: getTemplateDoc,
  search_templates: searchTemplatesDoc,
  get_templates_for_task: getTemplatesForTaskDoc,
  
  // Workflow Management tools (n8n API)
  n8n_create_workflow: n8nCreateWorkflowDoc,
  n8n_get_workflow: n8nGetWorkflowDoc,
  n8n_get_workflow_details: n8nGetWorkflowDetailsDoc,
  n8n_get_workflow_structure: n8nGetWorkflowStructureDoc,
  n8n_get_workflow_minimal: n8nGetWorkflowMinimalDoc,
  n8n_update_full_workflow: n8nUpdateFullWorkflowDoc,
  n8n_update_partial_workflow: n8nUpdatePartialWorkflowDoc,
  n8n_delete_workflow: n8nDeleteWorkflowDoc,
  n8n_list_workflows: n8nListWorkflowsDoc,
  n8n_validate_workflow: n8nValidateWorkflowDoc,
  n8n_trigger_webhook_workflow: n8nTriggerWebhookWorkflowDoc,
  n8n_get_execution: n8nGetExecutionDoc,
  n8n_list_executions: n8nListExecutionsDoc,
  n8n_delete_execution: n8nDeleteExecutionDoc
};

// Re-export types
export type { ToolDocumentation } from './types';