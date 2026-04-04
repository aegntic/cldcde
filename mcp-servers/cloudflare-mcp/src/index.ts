import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { cf } from "./client.js";

// Handler imports
import * as dnsHandlers from "./handlers/dns.js";
import * as workerHandlers from "./handlers/workers.js";
import * as pageHandlers from "./handlers/pages.js";
import * as d1Handlers from "./handlers/d1.js";

const server = new Server(
    {
        name: "cloudflare-mcp",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            ...dnsHandlers.tools,
            ...workerHandlers.tools,
            ...pageHandlers.tools,
            ...d1Handlers.tools,
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        // DNS & Zones
        if (name.startsWith("cloudflare_list_zones")) {
            return await dnsHandlers.handleListZones(args);
        }
        if (name.startsWith("cloudflare_list_dns_records")) {
            return await dnsHandlers.handleListDnsRecords(args);
        }
        if (name.startsWith("cloudflare_create_dns_record")) {
            return await dnsHandlers.handleCreateDnsRecord(args);
        }
        if (name.startsWith("cloudflare_delete_dns_record")) {
            return await dnsHandlers.handleDeleteDnsRecord(args);
        }
        if (name.startsWith("cloudflare_purge_cache")) {
            return await dnsHandlers.handlePurgeCache(args);
        }

        // Workers
        if (name.startsWith("cloudflare_list_workers")) {
            return await workerHandlers.handleListWorkers(args);
        }
        if (name.startsWith("cloudflare_upload_worker")) {
            return await workerHandlers.handleUploadWorker(args);
        }
        if (name.startsWith("cloudflare_delete_worker")) {
            return await workerHandlers.handleDeleteWorker(args);
        }

        // Pages
        if (name.startsWith("cloudflare_list_pages_projects")) {
            return await pageHandlers.handleListPagesProjects(args);
        }
        if (name.startsWith("cloudflare_list_pages_deployments")) {
            return await pageHandlers.handleListPagesDeployments(args);
        }
        if (name.startsWith("cloudflare_create_pages_deployment")) {
            return await pageHandlers.handleCreatePagesDeployment(args);
        }

        // D1
        if (name.startsWith("cloudflare_list_d1_databases")) {
            return await d1Handlers.handleListD1Databases(args);
        }
        if (name.startsWith("cloudflare_create_d1_database")) {
            return await d1Handlers.handleCreateD1Database(args);
        }
        if (name.startsWith("cloudflare_query_d1")) {
            return await d1Handlers.handleQueryD1(args);
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Cloudflare MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
