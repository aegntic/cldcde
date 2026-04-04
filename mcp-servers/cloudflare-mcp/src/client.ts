import { Cloudflare } from 'cloudflare';

if (!process.env.CLOUDFLARE_API_TOKEN && !process.env.CLOUDFLARE_API_KEY) {
    console.error("Error: CLOUDFLARE_API_TOKEN or CLOUDFLARE_API_KEY environment variable is required.");
    process.exit(1);
}

export const cf = new Cloudflare({
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    apiKey: process.env.CLOUDFLARE_API_KEY,
    apiEmail: process.env.CLOUDFLARE_EMAIL, // Required if using apiKey
});
