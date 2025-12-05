import fetch from 'node-fetch';

export interface ListmonkConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface Subscriber {
  email: string;
  name: string;
  status: 'enabled' | 'disabled' | 'blocklisted';
  lists: number[];
  attribs?: Record<string, any>;
}

export class ListmonkClient {
  private config: ListmonkConfig;
  private authHeader: string;

  constructor(config: ListmonkConfig) {
    this.config = config;
    // Create basic auth header
    const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    this.authHeader = `Basic ${auth}`;
  }

  /**
   * Create a new subscriber in Listmonk
   */
  async createSubscriber(subscriber: Subscriber): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/subscribers`, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriber)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Listmonk API error: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create subscriber:', error);
      throw error;
    }
  }

  /**
   * Get or create lists for aegntic services
   */
  async ensureLists(): Promise<{ newsletter: number; updates: number }> {
    // Get existing lists
    const listsResponse = await fetch(`${this.config.baseUrl}/api/lists`, {
      headers: {
        'Authorization': this.authHeader
      }
    });

    const { data: lists } = await listsResponse.json();

    let newsletterId = lists.find(l => l.name === 'aegntic Newsletter')?.id;
    let updatesId = lists.find(l => l.name === 'aegntic Product Updates')?.id;

    // Create lists if they don't exist
    if (!newsletterId) {
      const newList = await this.createList({
        name: 'aegntic Newsletter',
        type: 'public',
        optin: 'single',
        tags: ['newsletter', 'aegntic']
      });
      newsletterId = newList.data.id;
    }

    if (!updatesId) {
      const newList = await this.createList({
        name: 'aegntic Product Updates',
        type: 'public',
        optin: 'single',
        tags: ['updates', 'product', 'aegntic']
      });
      updatesId = newList.data.id;
    }

    return { newsletter: newsletterId, updates: updatesId };
  }

  /**
   * Create a new list
   */
  private async createList(list: any): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/lists`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(list)
    });

    if (!response.ok) {
      throw new Error(`Failed to create list: ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * Send transactional email
   */
  async sendTransactionalEmail(data: {
    subscriber_email: string;
    template_id: number;
    data?: Record<string, any>;
  }): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/tx`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${await response.text()}`);
    }

    return await response.json();
  }
}