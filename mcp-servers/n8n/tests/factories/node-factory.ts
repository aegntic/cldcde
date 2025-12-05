import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { ParsedNode } from '../../src/parsers/node-parser';

/**
 * Factory for generating ParsedNode test data using Fishery.
 * Creates realistic node configurations with random but valid data.
 * 
 * @example
 * ```typescript
 * // Create a single node with defaults
 * const node = NodeFactory.build();
 * 
 * // Create a node with specific properties
 * const slackNode = NodeFactory.build({
 *   nodeType: 'nodes-base.slack',
 *   displayName: 'Slack',
 *   isAITool: true
 * });
 * 
 * // Create multiple nodes
 * const nodes = NodeFactory.buildList(5);
 * 
 * // Create with custom sequence
 * const sequencedNodes = NodeFactory.buildList(3, {
 *   displayName: (i) => `Node ${i}`
 * });
 * ```
 */
export const NodeFactory = Factory.define<ParsedNode>(() => ({
  nodeType: faker.helpers.arrayElement(['nodes-base.', 'nodes-langchain.']) + faker.word.noun(),
  displayName: faker.helpers.arrayElement(['HTTP', 'Slack', 'Google', 'AWS']) + ' ' + faker.word.noun(),
  description: faker.lorem.sentence(),
  packageName: faker.helpers.arrayElement(['n8n-nodes-base', '@n8n/n8n-nodes-langchain']),
  category: faker.helpers.arrayElement(['transform', 'trigger', 'output', 'input']),
  style: faker.helpers.arrayElement(['declarative', 'programmatic']),
  isAITool: faker.datatype.boolean(),
  isTrigger: faker.datatype.boolean(),
  isWebhook: faker.datatype.boolean(),
  isVersioned: faker.datatype.boolean(),
  version: faker.helpers.arrayElement(['1.0', '2.0', '3.0', '4.2']),
  documentation: faker.datatype.boolean() ? faker.lorem.paragraphs(3) : undefined,
  properties: [],
  operations: [],
  credentials: []
}));