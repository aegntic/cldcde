import { ToolDocumentation } from '../types';

export const getPropertyDependenciesDoc: ToolDocumentation = {
  name: 'get_property_dependencies',
  category: 'configuration',
  essentials: {
    description: 'Shows property dependencies and visibility rules - which fields appear when.',
    keyParameters: ['nodeType', 'config?'],
    example: 'get_property_dependencies({nodeType: "nodes-base.httpRequest"})',
    performance: 'Fast - analyzes property conditions',
    tips: [
      'Shows which properties depend on other property values',
      'Test visibility impact with optional config parameter',
      'Helps understand complex conditional property displays'
    ]
  },
  full: {
    description: `Analyzes property dependencies and visibility conditions for a node. Shows which properties control the visibility of other properties (e.g., sendBody=true reveals body-related fields). Optionally test how a specific configuration affects property visibility.`,
    parameters: {
      nodeType: {
        type: 'string',
        required: true,
        description: 'The node type to analyze (e.g., "nodes-base.httpRequest")',
        examples: [
          'nodes-base.httpRequest',
          'nodes-base.slack',
          'nodes-base.if',
          'nodes-base.switch'
        ]
      },
      config: {
        type: 'object',
        required: false,
        description: 'Optional partial configuration to check visibility impact',
        examples: [
          '{ method: "POST", sendBody: true }',
          '{ operation: "create", resource: "contact" }',
          '{ mode: "rules" }'
        ]
      }
    },
    returns: `Object containing:
- nodeType: The analyzed node type
- displayName: Human-readable node name
- controllingProperties: Properties that control visibility of others
- dependentProperties: Properties whose visibility depends on others
- complexDependencies: Multi-condition dependencies
- currentConfig: If config provided, shows:
  - providedValues: The configuration you passed
  - visibilityImpact: Which properties are visible/hidden`,
    examples: [
      'get_property_dependencies({nodeType: "nodes-base.httpRequest"}) - Analyze HTTP Request dependencies',
      'get_property_dependencies({nodeType: "nodes-base.httpRequest", config: {sendBody: true}}) - Test visibility with sendBody enabled',
      'get_property_dependencies({nodeType: "nodes-base.if", config: {mode: "rules"}}) - Check If node in rules mode'
    ],
    useCases: [
      'Understanding which properties control others',
      'Debugging why certain fields are not visible',
      'Building dynamic UIs that match n8n behavior',
      'Testing configurations before applying them',
      'Understanding complex node property relationships'
    ],
    performance: 'Fast - analyzes property metadata without database queries',
    bestPractices: [
      'Use before configuring complex nodes with many conditional fields',
      'Test different config values to understand visibility rules',
      'Check dependencies when properties seem to be missing',
      'Use for nodes with multiple operation modes (Slack, Google Sheets)',
      'Combine with search_node_properties to find specific fields'
    ],
    pitfalls: [
      'Some properties have complex multi-condition dependencies',
      'Visibility rules can be nested (property A controls B which controls C)',
      'Not all hidden properties are due to dependencies (some are deprecated)',
      'Config parameter only tests visibility, does not validate values'
    ],
    relatedTools: ['search_node_properties', 'get_node_essentials', 'validate_node_operation']
  }
};