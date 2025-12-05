#!/usr/bin/env node

/**
 * Porkbun DNS Configuration Script
 * Automatically configures DNS records for logue.pro using Porkbun API
 */

const https = require('https');

// Configuration - replace with your actual API credentials
const PORKBUN_API_KEY = process.env.PORKBUN_API_KEY || 'your_porkbun_api_key';
const PORKBUN_SECRET_KEY = process.env.PORKBUN_SECRET_KEY || 'your_porkbun_secret_key';
const DOMAIN = 'logue.pro';

// GitHub Pages IP addresses (as of 2024)
const GITHUB_PAGES_IPS = [
    '185.199.108.153',
    '185.199.109.153',
    '185.199.110.153',
    '185.199.111.153'
];

// DNS records for logue.pro
const DNS_RECORDS = [
    // Root domain (A records for GitHub Pages)
    {
        type: 'A',
        name: '@',
        content: GITHUB_PAGES_IPS[0],
        ttl: 3600
    },
    {
        type: 'A',
        name: '@',
        content: GITHUB_PAGES_IPS[1],
        ttl: 3600
    },
    {
        type: 'A',
        name: '@',
        content: GITHUB_PAGES_IPS[2],
        ttl: 3600
    },
    {
        type: 'A',
        name: '@',
        content: GITHUB_PAGES_IPS[3],
        ttl: 3600
    },
    // www subdomain (CNAME to GitHub Pages)
    {
        type: 'CNAME',
        name: 'www',
        content: 'aegntic.github.io',
        ttl: 3600
    },
    // Email (MX records)
    {
        type: 'MX',
        name: '@',
        content: 'mx1.forwardemail.net',
        priority: 10,
        ttl: 3600
    },
    {
        type: 'MX',
        name: '@',
        content: 'mx2.forwardemail.net',
        priority: 20,
        ttl: 3600
    },
    // SPF for email
    {
        type: 'TXT',
        name: '@',
        content: 'v=spf1 a mx include:forwardemail.net ~all',
        ttl: 3600
    },
    // DMARC for email security
    {
        type: 'TXT',
        name: '_dmarc',
        content: 'v=DMARC1; p=none; rua=mailto:dmarc@logue.pro',
        ttl: 3600
    }
];

/**
 * Make API request to Porkbun
 */
async function makePorkbunRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const authData = {
            apikey: PORKBUN_API_KEY,
            secretapikey: PORKBUN_SECRET_KEY
        };

        let postData = '';
        if (data) {
            postData = JSON.stringify({ ...authData, ...data });
        } else {
            postData = JSON.stringify(authData);
        }

        const options = {
            hostname: 'porkbun.com',
            port: 443,
            path: `/api/json/v3${endpoint}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    if (parsedData.status === 'SUCCESS') {
                        resolve(parsedData);
                    } else {
                        reject(new Error(`Porkbun API Error: ${parsedData.message}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Get current DNS records
 */
async function getCurrentDnsRecords() {
    try {
        const response = await makePorkbunRequest(`/dns/retrieve/${DOMAIN}`);
        return response.records;
    } catch (error) {
        console.error('Failed to get current DNS records:', error.message);
        throw error;
    }
}

/**
 * Delete existing DNS record
 */
async function deleteDnsRecord(recordId) {
    try {
        const response = await makePorkbunRequest(`/dns/delete/${DOMAIN}/${recordId}`, 'POST');
        console.log(`[OK] Deleted record ${recordId}`);
        return response;
    } catch (error) {
        console.error(`Failed to delete record ${recordId}:`, error.message);
        throw error;
    }
}

/**
 * Create new DNS record
 */
async function createDnsRecord(record) {
    try {
        const response = await makePorkbunRequest(`/dns/create/${DOMAIN}`, 'POST', record);
        console.log(`[OK] Created ${record.type} record: ${record.name} -> ${record.content}`);
        return response;
    } catch (error) {
        console.error(`Failed to create ${record.type} record:`, error.message);
        throw error;
    }
}

/**
 * Configure nameservers
 */
async function configureNameservers() {
    const nameservers = [
        'curt.ns.porkbun.com',
        'opal.ns.porkbun.com'
    ];

    console.log('[INFO] Configuring nameservers...');

    try {
        const response = await makePorkbunRequest(`/domain/updateNameservers/${DOMAIN}`, 'POST', {
            nameservers: nameservers
        });
        console.log('[OK] Nameservers configured successfully');
        console.log('[INFO] Nameservers:', nameservers.join(', '));
        return response;
    } catch (error) {
        console.error('Failed to configure nameservers:', error.message);
        throw error;
    }
}

/**
 * Main configuration function
 */
async function configureDns() {
    console.log('╔══════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║ ███████████                     █████                                            ║');
    console.log('║░░███░░░░░███                   ░░███                                             ║');
    console.log('║ ░███    ░███ ████████   ██████  ░███         ██████   ███████ █████ ████  ██████ ║');
    console.log('║ ░██████████ ░░███░░███ ███░░███ ░███        ███░░███ ███░░███░░███ ░███  ███░░███║');
    console.log('║ ░███░░░░░░   ░███ ░░░ ░███ ░███ ░███       ░███ ░███░███ ░███ ░███ ░███ ░███████ ║');
    console.log('║ ░███         ░███     ░███ ░███ ░███      █░███ ░███░███ ░███ ░███ ░███ ░███░░░  ║');
    console.log('║ █████        █████    ░░██████  ███████████░░██████ ░░███████ ░░████████░░██████ ║');
    console.log('║░░░░░        ░░░░░      ░░░░░░  ░░░░░░░░░░░  ░░░░░░   ░░░░░███  ░░░░░░░░  ░░░░░░  ║');
    console.log('║                                                      ███ ░███                    ║');
    console.log('║  ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ                      ░░██████                     ║');
    console.log('║       ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ                 ░░░░░░                      ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════════╝');
    console.log('                       DNS CONFIGURATION FOR LOGUE.PRO');
    console.log('=================================================');

    // Check API credentials
    if (PORKBUN_API_KEY === 'your_porkbun_api_key' || PORKBUN_SECRET_KEY === 'your_porkbun_secret_key') {
        console.error('[ERROR] Please set your Porkbun API credentials:');
        console.error('   export PORKBUN_API_KEY=your_actual_api_key');
        console.error('   export PORKBUN_SECRET_KEY=your_actual_secret_key');
        process.exit(1);
    }

    try {
        // Step 1: Configure nameservers
        await configureNameservers();
        console.log('');

        // Step 2: Get current records
        console.log('[INFO] Getting current DNS records...');
        const currentRecords = await getCurrentDnsRecords();
        console.log(`Found ${currentRecords.length} existing records`);
        console.log('');

        // Step 3: Delete existing A, CNAME, MX, and TXT records
        console.log('[INFO] Cleaning up existing records...');
        const recordsToDelete = currentRecords.filter(record =>
            ['A', 'CNAME', 'MX', 'TXT'].includes(record.type)
        );

        for (const record of recordsToDelete) {
            await deleteDnsRecord(record.id);
        }
        console.log('');

        // Step 4: Create new records
        console.log('[INFO] Creating new DNS records...');
        for (const record of DNS_RECORDS) {
            await createDnsRecord(record);
        }
        console.log('');

        // Step 5: Verify configuration
        console.log('[OK] DNS configuration completed successfully!');
        console.log('');
        console.log('[INFO] Summary:');
        console.log(`   - Domain: ${DOMAIN}`);
        console.log(`   - Root domain: Points to GitHub Pages (${GITHUB_PAGES_IPS.length} A records)`);
        console.log('   - www subdomain: CNAME to aegntic.github.io');
        console.log('   - Email: MX records configured via forwardemail.net');
        console.log('   - Security: SPF and DMARC records configured');
        console.log('');
        console.log('[NOTE] DNS changes may take up to 24 hours to propagate globally.');
        console.log('[INFO] You can check propagation at: https://dnschecker.org');
        console.log('');
        console.log('[SITE] Once propagated, your site will be available at:');
        console.log('   - https://logue.pro');
        console.log('   - https://www.logue.pro');

    } catch (error) {
        console.error('[ERROR] DNS configuration failed:', error.message);
        process.exit(1);
    }
}

/**
 * Show current DNS status
 */
async function showDnsStatus() {
    console.log('╔══════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║ ███████████                     █████                                            ║');
    console.log('║░░███░░░░░███                   ░░███                                             ║');
    console.log('║ ░███    ░███ ████████   ██████  ░███         ██████   ███████ █████ ████  ██████ ║');
    console.log('║ ░██████████ ░░███░░███ ███░░███ ░███        ███░░███ ███░░███░░███ ░███  ███░░███║');
    console.log('║ ░███░░░░░░   ░███ ░░░ ░███ ░███ ░███       ░███ ░███░███ ░███ ░███ ░███ ░███████ ║');
    console.log('║ ░███         ░███     ░███ ░███ ░███      █░███ ░███░███ ░███ ░███ ░███ ░███░░░  ║');
    console.log('║ █████        █████    ░░██████  ███████████░░██████ ░░███████ ░░████████░░██████ ║');
    console.log('║░░░░░        ░░░░░      ░░░░░░  ░░░░░░░░░░░  ░░░░░░   ░░░░░███  ░░░░░░░░  ░░░░░░  ║');
    console.log('║                                                      ███ ░███                    ║');
    console.log('║  ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ                      ░░██████                     ║');
    console.log('║       ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ                 ░░░░░░                      ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('║                                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════════╝');
    console.log('                  CURRENT DNS RECORDS FOR LOGUE.PRO');
    console.log('================================================');

    try {
        const records = await getCurrentDnsRecords();

        if (records.length === 0) {
            console.log('No DNS records found');
            return;
        }

        // Group records by type
        const groupedRecords = records.reduce((groups, record) => {
            if (!groups[record.type]) groups[record.type] = [];
            groups[record.type].push(record);
            return groups;
        }, {});

        // Display records by type
        Object.keys(groupedRecords).sort().forEach(type => {
            console.log(`\n${type} Records:`);
            groupedRecords[type].forEach(record => {
                const name = record.name === '@' ? 'logue.pro' : `${record.name}.logue.pro`;
                let content = record.content;
                if (record.type === 'MX') {
                    content = `${record.content} (priority: ${record.priority})`;
                }
                console.log(`  ${name} -> ${content}`);
            });
        });

    } catch (error) {
        console.error('Failed to get DNS status:', error.message);
    }
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case 'configure':
        case 'config':
            configureDns();
            break;
        case 'status':
        case 'show':
            showDnsStatus();
            break;
        case 'help':
        default:
            console.log('╔══════════════════════════════════════════════════════════════════════════════════╗');
            console.log('║                                                                                  ║');
            console.log('║                                                                                  ║');
            console.log('║                                                                                  ║');
            console.log('║                                                                                  ║');
            console.log('║ ███████████                     █████                                            ║');
            console.log('║░░███░░░░░███                   ░░███                                             ║');
            console.log('║ ░███    ░███ ████████   ██████  ░███         ██████   ███████ █████ ████  ██████ ║');
            console.log('║ ░██████████ ░░███░░███ ███░░███ ░███        ███░░███ ███░░███░░███ ░███  ███░░███║');
            console.log('║ ░███░░░░░░   ░███ ░░░ ░███ ░███ ░███       ░███ ░███░███ ░███ ░███ ░███ ░███████ ║');
            console.log('║ ░███         ░███     ░███ ░███ ░███      █░███ ░███░███ ░███ ░███ ░███ ░███░░░  ║');
            console.log('║ █████        █████    ░░██████  ███████████░░██████ ░░███████ ░░████████░░██████ ║');
            console.log('║░░░░░        ░░░░░      ░░░░░░  ░░░░░░░░░░░  ░░░░░░   ░░░░░███  ░░░░░░░░  ░░░░░░  ║');
            console.log('║                                                      ███ ░███                    ║');
            console.log('║  ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ                      ░░██████                     ║');
            console.log('║       ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ                 ░░░░░░                      ║');
            console.log('║                                                                                  ║');
            console.log('║                                                                                  ║');
            console.log('║                                                                                  ║');
            console.log('║                                                                                  ║');
            console.log('╚══════════════════════════════════════════════════════════════════════════════════╝');
            console.log('                      DNS CONFIGURATION TOOL');
            console.log('================================================');
            console.log('');
            console.log('Usage:');
            console.log('  node scripts/porkbun-dns.js configure  - Configure DNS records');
            console.log('  node scripts/porkbun-dns.js status     - Show current DNS status');
            console.log('  node scripts/porkbun-dns.js help       - Show this help');
            console.log('');
            console.log('Environment variables:');
            console.log('  PORKBUN_API_KEY     - Your Porkbun API key');
            console.log('  PORKBUN_SECRET_KEY  - Your Porkbun secret key');
            console.log('');
            console.log('Get your API keys from: https://porkbun.com/account/api');
            break;
    }
}

module.exports = {
    configureDns,
    showDnsStatus,
    getCurrentDnsRecords,
    createDnsRecord,
    deleteDnsRecord,
    configureNameservers
};