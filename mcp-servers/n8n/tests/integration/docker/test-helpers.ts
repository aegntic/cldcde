import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

export const exec = promisify(execCallback);

/**
 * Wait for a container to be healthy by checking the health endpoint
 */
export async function waitForHealthy(containerName: string, timeout = 10000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const { stdout } = await exec(
        `docker exec ${containerName} curl -s http://localhost:3000/health`
      );
      
      if (stdout.includes('ok')) {
        return true;
      }
    } catch (error) {
      // Container might not be ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
}

/**
 * Check if a container is running in HTTP mode by verifying the server is listening
 */
export async function isRunningInHttpMode(containerName: string): Promise<boolean> {
  try {
    const { stdout } = await exec(
      `docker exec ${containerName} sh -c "netstat -tln 2>/dev/null | grep :3000 || echo 'Not listening'"`
    );
    
    return stdout.includes(':3000');
  } catch {
    return false;
  }
}

/**
 * Get process environment variables from inside a running container
 */
export async function getProcessEnv(containerName: string, varName: string): Promise<string | null> {
  try {
    const { stdout } = await exec(
      `docker exec ${containerName} sh -c "cat /proc/1/environ | tr '\\0' '\\n' | grep '^${varName}=' | cut -d= -f2-"`
    );
    
    return stdout.trim() || null;
  } catch {
    return null;
  }
}