import { ToolDocumentation } from '../types';

export const searchNodePropertiesDoc: ToolDocumentation = {
  name: 'search_node_properties',
  category: 'configuration',
  essentials: {
    description: 'Find specific properties in a node without downloading all 200+ properties.',
    keyParameters: ['nodeType', 'query'],
    example: 'search_node_properties({nodeType: "nodes-base.httpRequest", query: "auth"})',
    performance: 'Fast - searches indexed properties',
    tips: [
      'Search for "auth", "header", "body", "json", "credential"',
      'Returns property paths and descriptions',
      'Much faster than get_node_info for finding specific fields'
    ]
  },
  full: {
    description: `Searches for specific properties within a node's configuration schema. Essential for finding authentication fields, headers, body parameters, or any specific property without downloading the entire node schema (which can be 100KB+). Returns matching properties with their paths, types, and descriptions.`,
    parameters: {
      nodeType: {
        type: 'string',
        required: true,
        description: 'Full type with prefix',
        examples: [
          'nodes-base.httpRequest',
          'nodes-base.slack',
          'nodes-base.postgres',
          'nodes-base.googleSheets'
        ]
      },
      query: {
        type: 'string',
        required: true,
        description: 'Property to find: "auth", "header", "body", "json"',
        examples: [
          'auth',
          'header',
          'body',
          'json',
          'credential',
          'timeout',
          'retry',
          'pagination'
        ]
      },
      maxResults: {
        type: 'number',
        required: false,
        description: 'Max results (default 20)',
        default: 20
      }
    },
    returns: `Object containing:
- nodeType: The searched node type
- query: Your search term
- matches: Array of matching properties with:
  - name: Property identifier
  - displayName: Human-readable name
  - type: Property type (string, number, options, etc.)
  - description: Property description
  - path: Full path to property (for nested properties)
  - required: Whether property is required
  - default: Default value if any
  - options: Available options for selection properties
  - showWhen: Visibility conditions
- totalMatches: Number of matches found
- searchedIn: Total properties searched`,
    examples: [
      'search_node_properties({nodeType: "nodes-base.httpRequest", query: "auth"}) - Find authentication fields',
      'search_node_properties({nodeType: "nodes-base.slack", query: "channel"}) - Find channel-related properties',
      'search_node_properties({nodeType: "nodes-base.postgres", query: "query"}) - Find query fields',
      'search_node_properties({nodeType: "nodes-base.webhook", query: "response"}) - Find response options'
    ],
    useCases: [
      'Finding authentication/credential fields quickly',
      'Locating specific parameters without full node info',
      'Discovering header or body configuration options',
      'Finding nested properties in complex nodes',
      'Checking if a node supports specific features (retry, pagination, etc.)'
    ],
    performance: 'Very fast - searches pre-indexed property metadata',
    bestPractices: [
      'Use before get_node_info to find specific properties',
      'Search for common terms: auth, header, body, credential',
      'Check showWhen conditions to understand visibility',
      'Use with get_property_dependencies for complete understanding',
      'Limit results if you only need to check existence'
    ],
    pitfalls: [
      'Some properties may be hidden due to visibility conditions',
      'Property names may differ from display names',
      'Nested properties show full path (e.g., "options.retry.limit")',
      'Search is case-sensitive for property names'
    ],
    relatedTools: ['get_node_essentials', 'get_property_dependencies', 'get_node_info']
  }
};