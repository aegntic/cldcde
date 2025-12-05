/**
 * Normalizes node type from n8n export format to database format
 * 
 * Examples:
 * - 'n8n-nodes-base.httpRequest' → 'nodes-base.httpRequest'
 * - '@n8n/n8n-nodes-langchain.agent' → 'nodes-langchain.agent'
 * - 'n8n-nodes-langchain.chatTrigger' → 'nodes-langchain.chatTrigger'
 * - 'nodes-base.slack' → 'nodes-base.slack' (unchanged)
 * 
 * @param nodeType The node type to normalize
 * @returns The normalized node type
 */
export function normalizeNodeType(nodeType: string): string {
  // Handle n8n-nodes-base -> nodes-base
  if (nodeType.startsWith('n8n-nodes-base.')) {
    return nodeType.replace('n8n-nodes-base.', 'nodes-base.');
  }
  
  // Handle @n8n/n8n-nodes-langchain -> nodes-langchain
  if (nodeType.startsWith('@n8n/n8n-nodes-langchain.')) {
    return nodeType.replace('@n8n/n8n-nodes-langchain.', 'nodes-langchain.');
  }
  
  // Handle n8n-nodes-langchain -> nodes-langchain (without @n8n/ prefix)
  if (nodeType.startsWith('n8n-nodes-langchain.')) {
    return nodeType.replace('n8n-nodes-langchain.', 'nodes-langchain.');
  }
  
  // Return unchanged if already normalized or unknown format
  return nodeType;
}

/**
 * Gets alternative node type formats to try for lookups
 * 
 * @param nodeType The original node type
 * @returns Array of alternative formats to try
 */
export function getNodeTypeAlternatives(nodeType: string): string[] {
  const alternatives: string[] = [];
  
  // Add lowercase version
  alternatives.push(nodeType.toLowerCase());
  
  // If it has a prefix, try case variations on the node name part
  if (nodeType.includes('.')) {
    const [prefix, nodeName] = nodeType.split('.');
    
    // Try different case variations for the node name
    if (nodeName && nodeName.toLowerCase() !== nodeName) {
      alternatives.push(`${prefix}.${nodeName.toLowerCase()}`);
    }
    
    // For camelCase names like "chatTrigger", also try with capital first letter variations
    // e.g., "chattrigger" -> "chatTrigger"
    if (nodeName && nodeName.toLowerCase() === nodeName && nodeName.length > 1) {
      // Try to detect common patterns and create camelCase version
      const camelCaseVariants = generateCamelCaseVariants(nodeName);
      camelCaseVariants.forEach(variant => {
        alternatives.push(`${prefix}.${variant}`);
      });
    }
  }
  
  // If it's just a bare node name, try with common prefixes
  if (!nodeType.includes('.')) {
    alternatives.push(`nodes-base.${nodeType}`);
    alternatives.push(`nodes-langchain.${nodeType}`);
    
    // Also try camelCase variants for bare names
    const camelCaseVariants = generateCamelCaseVariants(nodeType);
    camelCaseVariants.forEach(variant => {
      alternatives.push(`nodes-base.${variant}`);
      alternatives.push(`nodes-langchain.${variant}`);
    });
  }
  
  // Normalize all alternatives and combine with originals
  const normalizedAlternatives = alternatives.map(alt => normalizeNodeType(alt));
  
  // Combine original alternatives with normalized ones and remove duplicates
  return [...new Set([...alternatives, ...normalizedAlternatives])];
}

/**
 * Generate camelCase variants for a lowercase string
 * @param str The lowercase string
 * @returns Array of possible camelCase variants
 */
function generateCamelCaseVariants(str: string): string[] {
  const variants: string[] = [];
  
  // Common patterns for n8n nodes
  const patterns = [
    // Pattern: wordTrigger (e.g., chatTrigger, webhookTrigger)
    /^(.+)(trigger|node|request|response)$/i,
    // Pattern: httpRequest, mysqlDatabase
    /^(http|mysql|postgres|mongo|redis|mqtt|smtp|imap|ftp|ssh|api)(.+)$/i,
    // Pattern: googleSheets, microsoftTeams
    /^(google|microsoft|amazon|slack|discord|telegram)(.+)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = str.toLowerCase().match(pattern);
    if (match) {
      const [, first, second] = match;
      // Capitalize the second part
      variants.push(first.toLowerCase() + second.charAt(0).toUpperCase() + second.slice(1).toLowerCase());
    }
  }
  
  // Generic camelCase: capitalize after common word boundaries
  if (variants.length === 0) {
    // Try splitting on common boundaries and capitalizing
    const words = str.split(/[-_\s]+/);
    if (words.length > 1) {
      const camelCase = words[0].toLowerCase() + words.slice(1).map(w => 
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ).join('');
      variants.push(camelCase);
    }
  }
  
  return variants;
}

/**
 * Constructs the workflow node type from package name and normalized node type
 * This creates the format that n8n expects in workflow definitions
 * 
 * Examples:
 * - ('n8n-nodes-base', 'nodes-base.webhook') → 'n8n-nodes-base.webhook'
 * - ('@n8n/n8n-nodes-langchain', 'nodes-langchain.agent') → '@n8n/n8n-nodes-langchain.agent'
 * 
 * @param packageName The package name from the database
 * @param nodeType The normalized node type from the database
 * @returns The workflow node type for use in n8n workflows
 */
export function getWorkflowNodeType(packageName: string, nodeType: string): string {
  // Extract just the node name from the normalized type
  const nodeName = nodeType.split('.').pop() || nodeType;
  
  // Construct the full workflow type based on package
  if (packageName === 'n8n-nodes-base') {
    return `n8n-nodes-base.${nodeName}`;
  } else if (packageName === '@n8n/n8n-nodes-langchain') {
    return `@n8n/n8n-nodes-langchain.${nodeName}`;
  }
  
  // Fallback for unknown packages - return as is
  return nodeType;
}