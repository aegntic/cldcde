import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

interface NodeDefinition {
  name: string;
  displayName: string;
  description: string;
  version: number;
  defaults: { name: string };
  inputs: string[];
  outputs: string[];
  properties: any[];
  credentials?: any[];
  group?: string[];
}

export const nodeFactory = Factory.define<NodeDefinition>(() => ({
  name: faker.helpers.slugify(faker.word.noun()),
  displayName: faker.company.name(),
  description: faker.lorem.sentence(),
  version: faker.number.int({ min: 1, max: 5 }),
  defaults: {
    name: faker.word.noun()
  },
  inputs: ['main'],
  outputs: ['main'],
  group: [faker.helpers.arrayElement(['transform', 'trigger', 'output'])],
  properties: [
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      default: 'user',
      options: [
        { name: 'User', value: 'user' },
        { name: 'Post', value: 'post' }
      ]
    }
  ],
  credentials: []
}));

// Specific node factories
export const webhookNodeFactory = nodeFactory.params({
  name: 'webhook',
  displayName: 'Webhook',
  description: 'Starts the workflow when a webhook is called',
  group: ['trigger'],
  properties: [
    {
      displayName: 'Path',
      name: 'path',
      type: 'string',
      default: 'webhook',
      required: true
    },
    {
      displayName: 'Method',
      name: 'method',
      type: 'options',
      default: 'GET',
      options: [
        { name: 'GET', value: 'GET' },
        { name: 'POST', value: 'POST' }
      ]
    }
  ]
});

export const slackNodeFactory = nodeFactory.params({
  name: 'slack',
  displayName: 'Slack',
  description: 'Send messages to Slack',
  group: ['output'],
  credentials: [
    {
      name: 'slackApi',
      required: true
    }
  ],
  properties: [
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      default: 'message',
      options: [
        { name: 'Message', value: 'message' },
        { name: 'Channel', value: 'channel' }
      ]
    },
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      displayOptions: {
        show: {
          resource: ['message']
        }
      },
      default: 'post',
      options: [
        { name: 'Post', value: 'post' },
        { name: 'Update', value: 'update' }
      ]
    },
    {
      displayName: 'Channel',
      name: 'channel',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['post']
        }
      },
      default: ''
    }
  ]
});