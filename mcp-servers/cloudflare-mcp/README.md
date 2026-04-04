# Cloudflare MCP Server

A Model Context Protocol server for Cloudflare services.

## Features

- **DNS & Zones**: List zones, manage DNS records, purge cache.
- **Workers**: List, upload, and delete workers.
- **Pages**: List projects and deployments, trigger deployments.
- **D1 Storage**: Manage databases and execute queries.

## Configuration

You need to provide your Cloudflare credentials via environment variables.

### Environment Variables

| Variable | Description |
|Args|---|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API Token |
| `CLOUDFLARE_API_KEY` | Your Cloudflare Global API Key (alternative to Token) |
| `CLOUDFLARE_EMAIL` | Required if using `CLOUDFLARE_API_KEY` |

## Installation

1. Build the server:

    ```bash
    npm install
    npm run build
    ```

2. Add to your MCP settings (e.g. `claude_desktop_config.json`):

    ```json
    {
      "mcpServers": {
        "cloudflare": {
          "command": "node",
          "args": ["/path/to/cloudflare-mcp/dist/index.js"],
          "env": {
            "CLOUDFLARE_API_TOKEN": "your-token-here"
          }
        }
      }
    }
    ```

## Tools

- `cloudflare_list_zones`
- `cloudflare_list_dns_records`
- `cloudflare_create_dns_record`
- `cloudflare_delete_dns_record`
- `cloudflare_purge_cache`
- `cloudflare_list_workers`
- `cloudflare_upload_worker`
- `cloudflare_delete_worker`
- `cloudflare_list_pages_projects`
- `cloudflare_list_pages_deployments`
- `cloudflare_create_pages_deployment`
- `cloudflare_list_d1_databases`
- `cloudflare_create_d1_database`
- `cloudflare_query_d1`
