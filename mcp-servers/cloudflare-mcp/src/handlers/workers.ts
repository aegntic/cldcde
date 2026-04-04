import { z } from "zod";
import { cf } from "../client.js";

export const tools = [
    {
        name: "cloudflare_list_workers",
        description: "List all Cloudflare Workers",
        inputSchema: {
            type: "object",
            properties: {
                accountId: { type: "string", description: "Account ID" },
            },
            required: ["accountId"],
        },
    },
    {
        name: "cloudflare_upload_worker",
        description: "Upload or update a Worker script",
        inputSchema: {
            type: "object",
            properties: {
                accountId: { type: "string", description: "Account ID" },
                name: { type: "string", description: "Worker name" },
                script: { type: "string", description: "The worker script content (JS/TS)" },
                modules: {
                    type: "array",
                    description: "Optional modules for ES workers (not fully implemented in this simple tool version)",
                    items: { type: "object" }
                }
            },
            required: ["accountId", "name", "script"],
        },
    },
    {
        name: "cloudflare_delete_worker",
        description: "Delete a Worker",
        inputSchema: {
            type: "object",
            properties: {
                accountId: { type: "string", description: "Account ID" },
                name: { type: "string", description: "Worker name" },
            },
            required: ["accountId", "name"],
        },
    },
];

export async function handleListWorkers(args: any) {
    const result = await cf.workers.scripts.list({
        account_id: args.accountId,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
    };
}

export async function handleUploadWorker(args: any) {
    // Simple upload for single script workers
    // For ES modules, we might need a more complex structure, typical for advanced tools
    // This uses the 'standard' script upload payload
    const result = await cf.workers.scripts.update(args.name, {
        account_id: args.accountId,
        "metadata": { main_module: "index.js" },
        "index.js": args.script
    } as any);

    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
}

export async function handleDeleteWorker(args: any) {
    const result = await cf.workers.scripts.delete(args.name, {
        account_id: args.accountId,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
}
