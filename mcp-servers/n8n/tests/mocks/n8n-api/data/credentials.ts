/**
 * Mock credential data for MSW handlers
 */

export interface MockCredential {
  id: string;
  name: string;
  type: string;
  data?: Record<string, any>; // Usually encrypted in real n8n
  createdAt: string;
  updatedAt: string;
}

export const mockCredentials: MockCredential[] = [
  {
    id: 'cred_1',
    name: 'Slack Account',
    type: 'slackApi',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'cred_2',
    name: 'HTTP Header Auth',
    type: 'httpHeaderAuth',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'cred_3',
    name: 'OpenAI API',
    type: 'openAiApi',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

/**
 * Factory for creating mock credentials
 */
export const credentialFactory = {
  create: (type: string, name?: string): MockCredential => ({
    id: `cred_${Date.now()}`,
    name: name || `${type} Credential`,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
};