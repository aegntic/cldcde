import { z } from "zod";
import { cf } from "../client.js";

export const tools = [
    {
        name: "cloudflare_list_d1_databases",
        description: "List D1 databases",
        inputSchema: {
            type: "object",
            properties: {
                accountId: { type: "string", description: "Account ID" },
                name: { type: "string", description: "Filter by name" },
            },
            required: ["accountId"],
        },
    },
    {
        name: "cloudflare_create_d1_database",
        description: "Create a new D1 database",
        inputSchema: {
            type: "object",
            properties: {
                accountId: { type: "string", description: "Account ID" },
                name: { type: "string", description: "Database name" },
            },
            required: ["accountId", "name"],
        },
    },
    {
        name: "cloudflare_query_d1",
        description: "Execute a SQL query against a D1 database",
        inputSchema: {
            type: "object",
            properties: {
                accountId: { type: "string", description: "Account ID" },
                databaseId: { type: "string", description: "Database ID" },
                sql: { type: "string", description: "SQL Query" },
                params: { type: "array", items: { type: "string" }, description: "Query parameters" },
            },
            required: ["accountId", "databaseId", "sql"],
        },
    },
];

export async function handleListD1Databases(args: any) {
    const result = await cf.d1.database.list({
        account_id: args.accountId,
        name: args.name,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
    };
}

export async function handleCreateD1Database(args: any) {
    const result = await cf.d1.database.create({
        account_id: args.accountId,
        name: args.name,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
}

export async function handleQueryD1(args: any) {
    const result = await cf.d1.database.query(args.databaseId, {
        account_id: args.accountId,
        sql: args.sql,
        params: args.params
    });

    return {
        content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
    };
}
