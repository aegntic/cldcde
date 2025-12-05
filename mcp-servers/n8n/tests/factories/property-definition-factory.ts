import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

/**
 * Interface for n8n node property definitions.
 * Represents the structure of properties that configure node behavior.
 */
interface PropertyDefinition {
  name: string;
  displayName: string;
  type: string;
  default?: any;
  required?: boolean;
  description?: string;
  options?: any[];
}

/**
 * Factory for generating PropertyDefinition test data.
 * Creates realistic property configurations for testing node validation and processing.
 * 
 * @example
 * ```typescript
 * // Create a single property
 * const prop = PropertyDefinitionFactory.build();
 * 
 * // Create a required string property
 * const urlProp = PropertyDefinitionFactory.build({
 *   name: 'url',
 *   displayName: 'URL',
 *   type: 'string',
 *   required: true
 * });
 * 
 * // Create an options property with choices
 * const methodProp = PropertyDefinitionFactory.build({
 *   name: 'method',
 *   type: 'options',
 *   options: [
 *     { name: 'GET', value: 'GET' },
 *     { name: 'POST', value: 'POST' }
 *   ]
 * });
 * 
 * // Create multiple properties for a node
 * const nodeProperties = PropertyDefinitionFactory.buildList(5);
 * ```
 */
export const PropertyDefinitionFactory = Factory.define<PropertyDefinition>(() => ({
  name: faker.word.noun() + faker.word.adjective().charAt(0).toUpperCase() + faker.word.adjective().slice(1),
  displayName: faker.helpers.arrayElement(['URL', 'Method', 'Headers', 'Body', 'Authentication']),
  type: faker.helpers.arrayElement(['string', 'number', 'boolean', 'options', 'json']),
  default: faker.datatype.boolean() ? faker.word.sample() : undefined,
  required: faker.datatype.boolean(),
  description: faker.lorem.sentence(),
  options: faker.datatype.boolean() ? [
    {
      name: faker.word.noun(),
      value: faker.word.noun(),
      description: faker.lorem.sentence()
    }
  ] : undefined
}));