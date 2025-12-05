/**
 * Example workflows for n8n AI agents to understand the structure
 */

export const MINIMAL_WORKFLOW_EXAMPLE = {
  nodes: [
    {
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [250, 300],
      parameters: {
        httpMethod: "POST",
        path: "webhook"
      }
    }
  ],
  connections: {}
};

export const SIMPLE_WORKFLOW_EXAMPLE = {
  nodes: [
    {
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [250, 300],
      parameters: {
        httpMethod: "POST",
        path: "webhook"
      }
    },
    {
      name: "Set",
      type: "n8n-nodes-base.set",
      typeVersion: 2,
      position: [450, 300],
      parameters: {
        mode: "manual",
        assignments: {
          assignments: [
            {
              name: "message",
              type: "string",
              value: "Hello"
            }
          ]
        }
      }
    },
    {
      name: "Respond to Webhook",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1,
      position: [650, 300],
      parameters: {
        respondWith: "firstIncomingItem"
      }
    }
  ],
  connections: {
    "Webhook": {
      "main": [
        [
          {
            "node": "Set",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

export function getWorkflowExampleString(): string {
  return `Example workflow structure:
${JSON.stringify(MINIMAL_WORKFLOW_EXAMPLE, null, 2)}

Each node MUST have:
- name: unique string identifier
- type: full node type with prefix (e.g., "n8n-nodes-base.webhook")
- typeVersion: number (usually 1 or 2)
- position: [x, y] coordinates array
- parameters: object with node-specific settings

Connections format:
{
  "SourceNodeName": {
    "main": [
      [
        {
          "node": "TargetNodeName",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}`;
}