import { z } from "zod";
import { cf } from "../client.js";

// Tool Definitions
export const tools = [
    {
        name: "cloudflare_list_zones",
        description: "List available Cloudflare zones",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Filter by zone name" },
            },
        },
    },
    {
        name: "cloudflare_list_dns_records",
        description: "List DNS records for a zone",
        inputSchema: {
            type: "object",
            properties: {
                zoneId: { type: "string", description: "Zone ID" },
                type: { type: "string", description: "Record type (A, CNAME, etc.)" },
                name: { type: "string", description: "Filter by record name" },
            },
            required: ["zoneId"],
        },
    },
    {
        name: "cloudflare_create_dns_record",
        description: "Create a new DNS record",
        inputSchema: {
            type: "object",
            properties: {
                zoneId: { type: "string", description: "Zone ID" },
                type: { type: "string", description: "Record type (A, CNAME, TXT, etc.)" },
                name: { type: "string", description: "Record name (e.g. example.com)" },
                content: { type: "string", description: "Record content (e.g. 1.2.3.4)" },
                proxied: { type: "boolean", description: "Whether the record is proxied by Cloudflare" },
                ttl: { type: "number", description: "Time to Live (TTL) in seconds" },
                comment: { type: "string", description: "Comment for the record" },
            },
            required: ["zoneId", "type", "name", "content"],
        },
    },
    {
        name: "cloudflare_delete_dns_record",
        description: "Delete a DNS record",
        inputSchema: {
            type: "object",
            properties: {
                zoneId: { type: "string", description: "Zone ID" },
                recordId: { type: "string", description: "DNS Record ID" },
            },
            required: ["zoneId", "recordId"],
        },
    },
    {
        name: "cloudflare_purge_cache",
        description: "Purge cache for a zone",
        inputSchema: {
            type: "object",
            properties: {
                zoneId: { type: "string", description: "Zone ID" },
                purge_everything: { type: "boolean", description: "Purge everything?" },
                files: { type: "array", items: { type: "string" }, description: "List of URLs to purge" },
            },
            required: ["zoneId"],
        },
    },
];

// Handlers
export async function handleListZones(args: any) {
    const result = await cf.zones.list({
        name: args.name,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
    };
}

export async function handleListDnsRecords(args: any) {
    const result = await cf.dns.records.list({
        zone_id: args.zoneId,
        type: args.type,
        name: args.name,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }],
    };
}

export async function handleCreateDnsRecord(args: any) {
    const result = await cf.dns.records.create({
        zone_id: args.zoneId,
        type: args.type as any,
        name: args.name,
        content: args.content,
        proxied: args.proxied,
        ttl: args.ttl || 1, // 1 = automatic
        comment: args.comment,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
}

export async function handleDeleteDnsRecord(args: any) {
    const result = await cf.dns.records.delete(args.recordId, {
        zone_id: args.zoneId,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
}

export async function handlePurgeCache(args: any) {
    const result = await cf.cache.purge({
        zone_id: args.zoneId,
        purge_everything: args.purge_everything,
        files: args.files,
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
}
