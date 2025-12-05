import { Request } from 'express';
import { logger } from './logger';

/**
 * Validates a hostname to prevent header injection attacks
 */
function isValidHostname(host: string): boolean {
  // Allow alphanumeric, dots, hyphens, and optional port
  return /^[a-zA-Z0-9.-]+(:[0-9]+)?$/.test(host) && host.length < 256;
}

/**
 * Validates a URL string
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Detects the base URL for the server, considering:
 * 1. Explicitly configured BASE_URL or PUBLIC_URL
 * 2. Proxy headers (X-Forwarded-Proto, X-Forwarded-Host)
 * 3. Host and port configuration
 */
export function detectBaseUrl(req: Request | null, host: string, port: number): string {
  try {
    // 1. Check for explicitly configured URL
    const configuredUrl = process.env.BASE_URL || process.env.PUBLIC_URL;
    if (configuredUrl) {
      if (isValidUrl(configuredUrl)) {
        logger.debug('Using configured BASE_URL/PUBLIC_URL', { url: configuredUrl });
        return configuredUrl.replace(/\/$/, ''); // Remove trailing slash
      } else {
        logger.warn('Invalid BASE_URL/PUBLIC_URL configured, falling back to auto-detection', { url: configuredUrl });
      }
    }

    // 2. If we have a request, try to detect from proxy headers
    if (req && process.env.TRUST_PROXY && Number(process.env.TRUST_PROXY) > 0) {
      const proto = req.get('X-Forwarded-Proto') || req.protocol || 'http';
      const forwardedHost = req.get('X-Forwarded-Host');
      const hostHeader = req.get('Host');
      
      const detectedHost = forwardedHost || hostHeader;
      if (detectedHost && isValidHostname(detectedHost)) {
        const baseUrl = `${proto}://${detectedHost}`;
        logger.debug('Detected URL from proxy headers', { 
          proto, 
          forwardedHost, 
          hostHeader,
          baseUrl 
        });
        return baseUrl;
      } else if (detectedHost) {
        logger.warn('Invalid hostname detected in proxy headers, using fallback', { detectedHost });
      }
    }

    // 3. Fall back to configured host and port
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    const protocol = 'http'; // Default to http for local bindings
    
    // Don't show standard ports (for http only in this fallback case)
    const needsPort = port !== 80;
    const baseUrl = needsPort ? 
      `${protocol}://${displayHost}:${port}` : 
      `${protocol}://${displayHost}`;
    
    logger.debug('Using fallback URL from host/port', { 
      host, 
      displayHost, 
      port, 
      baseUrl 
    });
    
    return baseUrl;
  } catch (error) {
    logger.error('Error detecting base URL, using fallback', error);
    // Safe fallback
    return `http://localhost:${port}`;
  }
}

/**
 * Gets the base URL for console display during startup
 * This is used when we don't have a request object yet
 */
export function getStartupBaseUrl(host: string, port: number): string {
  return detectBaseUrl(null, host, port);
}

/**
 * Formats endpoint URLs for display
 */
export function formatEndpointUrls(baseUrl: string): {
  health: string;
  mcp: string;
  root: string;
} {
  return {
    health: `${baseUrl}/health`,
    mcp: `${baseUrl}/mcp`,
    root: baseUrl
  };
}