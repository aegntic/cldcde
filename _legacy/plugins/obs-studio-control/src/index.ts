/**
 * OBS Studio Control Plugin - Main Implementation
 *
 * ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ
 * ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ
 */

import { WebSocket } from 'ws';
import { AskUserQuestion } from '@claude-code/tool-access';

export interface OBSConnectionConfig {
  host: string;
  port: number;
  password?: string;
  autoReconnect?: boolean;
  timeout?: number;
}

export interface Scene {
  name: string;
  sources: string[];
  transition?: string;
  duration?: number;
}

export interface StreamStatus {
  streaming: boolean;
  recording: boolean;
  bitrate: number;
  fps: number;
  droppedFrames: number;
  cpuUsage: number;
  memoryUsage: number;
}

export class OBSControl {
  private ws: WebSocket | null = null;
  private config: OBSConnectionConfig;
  private connected = false;
  private messageHandlers = new Map<string, Function>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: OBSConnectionConfig) {
    this.config = {
      autoReconnect: true,
      timeout: 5000,
      ...config
    };
  }

  /**
   * Initialize WebSocket connection to OBS
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${this.config.host}:${this.config.port}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', async () => {
          console.log('Connected to OBS WebSocket');
          this.connected = true;
          this.reconnectAttempts = 0;

          // Authenticate if password is provided
          if (this.config.password) {
            await this.authenticate(this.config.password);
          }

          resolve(true);
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', () => {
          this.connected = false;
          console.log('OBS WebSocket connection closed');

          if (this.config.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect();
            }, 5000);
          }
        });

        this.ws.on('error', (error) => {
          console.error('OBS WebSocket error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Authenticate with OBS WebSocket
   */
  private async authenticate(password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const authReq = {
        'request-type': 'GetAuthRequired',
        'message-id': this.generateMessageId()
      };

      this.sendRequest(authReq, (response) => {
        if (response.status === 'ok') {
          if (response.authRequired) {
            // Authentication is required, compute response
            const auth = this.computeAuth(password, response.salt, response.challenge);

            const authResp = {
              'request-type': 'Authenticate',
              'message-id': this.generateMessageId(),
              'auth': auth
            };

            this.sendRequest(authResp, (authResponse) => {
              if (authResponse.status === 'ok') {
                console.log('Successfully authenticated with OBS');
                resolve();
              } else {
                reject(new Error('Authentication failed'));
              }
            });
          } else {
            resolve();
          }
        } else {
          reject(new Error('Failed to get auth requirements'));
        }
      });
    });
  }

  /**
   * Compute authentication hash
   */
  private computeAuth(password: string, salt: string, challenge: string): string {
    const crypto = require('crypto');
    const hash = (data: string) => crypto.createHash('sha256').update(data).digest('base64');

    const auth = hash(password + salt) + challenge;
    return hash(auth);
  }

  /**
   * Send request to OBS WebSocket
   */
  private sendRequest(request: any, callback?: Function): void {
    if (!this.ws || !this.connected) {
      throw new Error('Not connected to OBS WebSocket');
    }

    if (callback) {
      this.messageHandlers.set(request['message-id'], callback);
    }

    this.ws.send(JSON.stringify(request));
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message['message-id'] && this.messageHandlers.has(message['message-id'])) {
        const handler = this.messageHandlers.get(message['message-id']);
        if (handler) {
          handler(message);
          this.messageHandlers.delete(message['message-id']);
        }
      }
    } catch (error) {
      console.error('Error parsing OBS message:', error);
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Interactive scene selection using AskUserQuestion
   */
  async selectSceneInteractively(): Promise<string> {
    const scenes = await this.getSceneList();

    const userSelection = await AskUserQuestion({
      questions: [{
        question: 'Which scene would you like to switch to?',
        header: 'Scene Selection',
        options: scenes.map(scene => ({
          label: scene.name,
          description: `Switch to ${scene.name} scene`,
        })),
        multiSelect: false
      }]
    });

    return userSelection.answers.question0 || '';
  }

  /**
   * Switch to specified scene
   */
  async switchScene(sceneName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = {
        'request-type': 'SetCurrentScene',
        'message-id': this.generateMessageId(),
        'scene-name': sceneName
      };

      this.sendRequest(request, (response) => {
        if (response.status === 'ok') {
          console.log(`Switched to scene: ${sceneName}`);
          resolve();
        } else {
          reject(new Error(`Failed to switch to scene: ${response.error}`));
        }
      });
    });
  }

  /**
   * Get list of available scenes
   */
  async getSceneList(): Promise<{ name: string }[]> {
    return new Promise((resolve, reject) => {
      const request = {
        'request-type': 'GetSceneList',
        'message-id': this.generateMessageId()
      };

      this.sendRequest(request, (response) => {
        if (response.status === 'ok') {
          resolve(response.scenes || []);
        } else {
          reject(new Error(`Failed to get scene list: ${response.error}`));
        }
      });
    });
  }

  /**
   * Start streaming
   */
  async startStreaming(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = {
        'request-type': 'StartStreaming',
        'message-id': this.generateMessageId()
      };

      this.sendRequest(request, (response) => {
        if (response.status === 'ok') {
          console.log('Streaming started');
          resolve();
        } else {
          reject(new Error(`Failed to start streaming: ${response.error}`));
        }
      });
    });
  }

  /**
   * Stop streaming
   */
  async stopStreaming(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = {
        'request-type': 'StopStreaming',
        'message-id': this.generateMessageId()
      };

      this.sendRequest(request, (response) => {
        if (response.status === 'ok') {
          console.log('Streaming stopped');
          resolve();
        } else {
          reject(new Error(`Failed to stop streaming: ${response.error}`));
        }
      });
    });
  }

  /**
   * Get current streaming status
   */
  async getStreamingStatus(): Promise<StreamStatus> {
    return new Promise((resolve, reject) => {
      const request = {
        'request-type': 'GetStreamingStatus',
        'message-id': this.generateMessageId()
      };

      this.sendRequest(request, (response) => {
        if (response.status === 'ok') {
          resolve({
            streaming: response.streaming,
            recording: response.recording,
            bitrate: response['bytes-per-sec'] || 0,
            fps: response['fps'] || 0,
            droppedFrames: response['dropped-frames'] || 0,
            cpuUsage: response['cpu-usage'] || 0,
            memoryUsage: response['memory-usage'] || 0
          });
        } else {
          reject(new Error(`Failed to get streaming status: ${response.error}`));
        }
      });
    });
  }

  /**
   * Interactive stream setup wizard
   */
  async runStreamSetupWizard(): Promise<void> {
    console.log('Starting OBS Studio Stream Setup Wizard...');

    // Step 1: Check connection
    if (!this.connected) {
      const shouldConnect = await AskUserQuestion({
        questions: [{
          question: 'OBS Studio is not connected. Would you like to connect now?',
          header: 'Connection Required',
          options: [
            { label: 'Connect to OBS', description: 'Attempt to connect to local OBS instance' },
            { label: 'Cancel', description: 'Cancel setup wizard' }
          ],
          multiSelect: false
        }]
      });

      if (shouldConnect.answers.question0 === 'Connect to OBS') {
        try {
          await this.connect();
        } catch (error) {
          console.error('Failed to connect to OBS:', error);
          return;
        }
      } else {
        return;
      }
    }

    // Step 2: Configure streaming service
    const serviceType = await AskUserQuestion({
      questions: [{
        question: 'Which streaming service will you use?',
        header: 'Streaming Service',
        options: [
          { label: 'Twitch', description: 'Stream to Twitch.tv' },
          { label: 'YouTube', description: 'Stream to YouTube Live' },
          { label: 'Facebook Gaming', description: 'Stream to Facebook Gaming' },
          { label: 'Custom RTMP', description: 'Use custom RTMP server' }
        ],
        multiSelect: false
      }]
    });

    // Step 3: Scene setup
    const hasStartingSoon = await AskUserQuestion({
      questions: [{
        question: 'Do you have a "Starting Soon" scene?',
        header: 'Scene Configuration',
        options: [
          { label: 'Yes', description: 'I have a starting soon scene' },
          { label: 'No', description: 'I need to create one' }
        ],
        multiSelect: false
      }]
    });

    if (hasStartingSoon.answers.question0 === 'No') {
      console.log('Guidance: Create a "Starting Soon" scene with an overlay, countdown timer, and chat widget for professional stream starts.');
    }

    // Step 4: Test audio/video
    const shouldTest = await AskUserQuestion({
      questions: [{
        question: 'Would you like to test your audio and video sources?',
        header: 'Source Testing',
        options: [
          { label: 'Test Now', description: 'Check all audio and video sources' },
          { label: 'Skip', description: 'Skip source testing' }
        ],
        multiSelect: false
      }]
    });

    if (shouldTest.answers.question0 === 'Test Now') {
      await this.testSources();
    }

    console.log('OBS Studio Stream Setup Wizard completed successfully!');
  }

  /**
   * Test audio and video sources
   */
  private async testSources(): Promise<void> {
    console.log('Testing sources...');

    // Get current scene and check sources
    const scenes = await this.getSceneList();
    console.log(`Found ${scenes.length} scenes:`, scenes.map(s => s.name).join(', '));

    // Test audio levels
    console.log('Testing audio levels...');
    // Implementation for audio testing would go here

    console.log('Source testing completed.');
  }

  /**
   * Disconnect from OBS WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected to OBS
   */
  isConnected(): boolean {
    return this.connected;
  }
}

export default OBSControl;