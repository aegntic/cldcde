import { ListmonkClient } from "./listmonk-client.js";

export class ListmonkService {
  private client?: ListmonkClient;
  private listIds?: { newsletter: number; updates: number };
  private mockMode: boolean;

  constructor() {
    this.mockMode = process.env.MOCK_EMAIL_SERVICE === "true";
    
    if (process.env.LISTMONK_URL && !this.mockMode) {
      this.client = new ListmonkClient({
        baseUrl: process.env.LISTMONK_URL || "http://localhost:9000",
        username: process.env.LISTMONK_USER || "aegnt_catface",
        password: process.env.LISTMONK_PASSWORD || "LMAEp@ssWrd11:11"
      });
    }
  }

  async addSubscriber(data: {
    email: string;
    name: string;
    lists: string[];
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (this.mockMode) {
      console.log("📧 MOCK: Adding subscriber to Listmonk");
      console.log(`  Email: ${data.email}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Lists: ${data.lists.join(", ")}`);
      return;
    }

    if (!this.client) {
      console.warn("Listmonk not configured, skipping subscriber addition");
      return;
    }

    try {
      // Ensure lists exist
      if (!this.listIds) {
        this.listIds = await this.client.ensureLists();
      }

      // Map list names to IDs
      const listNumbers: number[] = [];
      if (data.lists.includes("newsletter")) {
        listNumbers.push(this.listIds.newsletter);
      }
      if (data.lists.includes("product-updates")) {
        listNumbers.push(this.listIds.updates);
      }

      // Create subscriber
      await this.client.createSubscriber({
        email: data.email,
        name: data.name,
        status: "enabled",
        lists: listNumbers,
        attribs: {
          source: "aegntic-mcp",
          tier: data.metadata?.tier || "free",
          registered_at: new Date().toISOString(),
          ...data.metadata
        }
      });

      console.log(`✅ Added ${data.email} to Listmonk`);
    } catch (error) {
      console.error("Failed to add subscriber to Listmonk:", error);
      // Don't throw - email list addition shouldn't break registration
    }
  }
}