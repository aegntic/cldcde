# Issue #90: "propertyValues[itemName] is not iterable" Error - Research Findings

## Executive Summary

The error "propertyValues[itemName] is not iterable" occurs when AI agents create workflows with incorrect data structures for n8n nodes that use `fixedCollection` properties. This primarily affects Switch Node v2, If Node, and Filter Node. The error prevents workflows from loading in the n8n UI, resulting in empty canvases.

## Root Cause Analysis

### 1. Data Structure Mismatch

The error occurs when n8n's validation engine expects an iterable array but encounters a non-iterable object. This happens with nodes using `fixedCollection` type properties.

**Incorrect Structure (causes error):**
```json
{
  "rules": {
    "conditions": {
      "values": [
        {
          "value1": "={{$json.status}}",
          "operation": "equals", 
          "value2": "active"
        }
      ]
    }
  }
}
```

**Correct Structure:**
```json
{
  "rules": {
    "conditions": [
      {
        "value1": "={{$json.status}}",
        "operation": "equals",
        "value2": "active"
      }
    ]
  }
}
```

### 2. Affected Nodes

Based on the research and issue comments, the following nodes are affected:

1. **Switch Node v2** (`n8n-nodes-base.switch` with typeVersion: 2)
   - Uses `rules` parameter with `conditions` fixedCollection
   - v3 doesn't have this issue due to restructured schema

2. **If Node** (`n8n-nodes-base.if` with typeVersion: 1)
   - Uses `conditions` parameter with nested conditions array
   - Similar structure to Switch v2

3. **Filter Node** (`n8n-nodes-base.filter`)
   - Uses `conditions` parameter
   - Same fixedCollection pattern

### 3. Why AI Agents Create Incorrect Structures

1. **Training Data Issues**: AI models may have been trained on outdated or incorrect n8n workflow examples
2. **Nested Object Inference**: AI tends to create unnecessarily nested structures when it sees collection-type parameters
3. **Legacy Format Confusion**: Mixing v2 and v3 Switch node formats
4. **Schema Misinterpretation**: The term "fixedCollection" may lead AI to create object wrappers

## Current Impact

From issue #90 comments:
- Multiple users experiencing the issue
- Workflows fail to load completely (empty canvas)
- Users resort to using Switch Node v3 or direct API calls
- The issue appears in "most MCPs" according to user feedback

## Recommended Actions

### 1. Immediate Validation Enhancement

Add specific validation for fixedCollection properties in the workflow validator:

```typescript
// In workflow-validator.ts or enhanced-config-validator.ts
function validateFixedCollectionParameters(node, result) {
  const problematicNodes = {
    'n8n-nodes-base.switch': { version: 2, fields: ['rules'] },
    'n8n-nodes-base.if': { version: 1, fields: ['conditions'] },
    'n8n-nodes-base.filter': { version: 1, fields: ['conditions'] }
  };
  
  const nodeConfig = problematicNodes[node.type];
  if (nodeConfig && node.typeVersion === nodeConfig.version) {
    // Validate structure
  }
}
```

### 2. Enhanced MCP Tool Validation

Update the validation tools to detect and prevent this specific error pattern:

1. **In `validate_node_operation` tool**: Add checks for fixedCollection structures
2. **In `validate_workflow` tool**: Include specific validation for Switch/If nodes
3. **In `n8n_create_workflow` tool**: Pre-validate parameters before submission

### 3. AI-Friendly Examples

Update workflow examples to show correct structures:

```typescript
// In workflow-examples.ts
export const SWITCH_NODE_EXAMPLE = {
  name: "Switch",
  type: "n8n-nodes-base.switch", 
  typeVersion: 3, // Prefer v3 over v2
  parameters: {
    // Correct v3 structure
  }
};
```

### 4. Migration Strategy

For existing workflows with Switch v2:
1. Detect Switch v2 nodes in validation
2. Suggest migration to v3
3. Provide automatic conversion utility

### 5. Documentation Updates

1. Add warnings about fixedCollection structures in tool documentation
2. Include specific examples of correct vs incorrect structures
3. Document the Switch v2 to v3 migration path

## Proposed Implementation Priority

1. **High Priority**: Add validation to prevent creation of invalid structures
2. **High Priority**: Update existing validation tools to catch this error
3. **Medium Priority**: Add auto-fix capabilities to correct structures
4. **Medium Priority**: Update examples and documentation
5. **Low Priority**: Create migration utilities for v2 to v3

## Testing Strategy

1. Create test cases for each affected node type
2. Test both correct and incorrect structures
3. Verify validation catches all variants of the error
4. Test auto-fix suggestions work correctly

## Success Metrics

- Zero instances of "propertyValues[itemName] is not iterable" in newly created workflows
- Clear error messages that guide users to correct structures
- Successful validation of all Switch/If node configurations before workflow creation

## Next Steps

1. Implement validation enhancements in the workflow validator
2. Update MCP tools to include these validations
3. Add comprehensive tests
4. Update documentation with clear examples
5. Consider adding a migration tool for existing workflows