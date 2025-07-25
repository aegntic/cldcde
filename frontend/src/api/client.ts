// API Client - CLDCDE Pro
// By FrontendNinja - Production Ready

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as any)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });

      const data = response.ok ? await response.json() : null;

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      return { data, status: response.status };
    } catch (error) {
      console.error('API Error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Auth endpoints
  async getCurrentUser() {
    return this.request<User>('/auth/me');
  }

  async logout() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    if (result.data) {
      this.clearToken();
    }
    return result;
  }

  // Repository endpoints
  async listRepositories(page = 1) {
    return this.request<Repository[]>(`/repositories?page=${page}`);
  }

  async syncRepositories() {
    return this.request('/repositories/sync', { method: 'POST' });
  }

  async getRepository(id: string) {
    return this.request<Repository>(`/repositories/${id}`);
  }

  // Workflow endpoints
  async listWorkflows() {
    return this.request<Workflow[]>('/workflows');
  }

  async createWorkflow(workflow: CreateWorkflowInput) {
    return this.request<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, updates: UpdateWorkflowInput) {
    return this.request<Workflow>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async pauseWorkflow(id: string) {
    return this.request(`/workflows/${id}/pause`, { method: 'POST' });
  }

  async resumeWorkflow(id: string) {
    return this.request(`/workflows/${id}/resume`, { method: 'POST' });
  }

  // Project endpoints
  async listProjects() {
    return this.request<Project[]>('/projects');
  }

  async createProject(project: CreateProjectInput) {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async getProject(id: string) {
    return this.request<Project>(`/projects/${id}`);
  }

  async addProjectMember(projectId: string, userId: string, role: string) {
    return this.request(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  // Activity endpoints
  async getActivityFeed(limit = 20) {
    return this.request<Activity[]>(`/activity?limit=${limit}`);
  }

  async getActivityStats() {
    return this.request<ActivityStats>('/activity/stats');
  }
}

// Types
export interface User {
  id: number;
  username: string;
  email?: string;
  avatar_url?: string;
}

export interface Repository {
  id: number;
  github_repo_id: number;
  owner: string;
  name: string;
  full_name: string;
  description?: string;
  is_private: boolean;
  default_branch: string;
  language?: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  last_pushed_at?: string;
}

export interface Workflow {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'infrastructure';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'error';
  phase: 'planning' | 'requirements' | 'design' | 'implementation' | 'testing';
  progress: number;
  repository_id?: number;
  created_by_user_id: number;
  assigned_to_user_id?: number;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export interface WorkflowNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end';
  status: 'pending' | 'active' | 'completed' | 'error' | 'skipped';
  x?: number;
  y?: number;
}

export interface WorkflowConnection {
  from: string;
  to: string;
  type?: string;
  label?: string;
}

export interface Project {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  visibility: 'private' | 'public';
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
  workflows?: Workflow[];
}

export interface ProjectMember {
  user_id: number;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  user?: User;
}

export interface Activity {
  id: number;
  user_id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  description: string;
  created_at: string;
  user?: User;
}

export interface ActivityStats {
  total_activities: number;
  activities_today: number;
  activities_this_week: number;
  most_active_users: Array<{
    user_id: number;
    username: string;
    activity_count: number;
  }>;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  type: string;
  repository_id?: number;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  status?: string;
  phase?: string;
  progress?: number;
  assigned_to_user_id?: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  visibility?: 'private' | 'public';
}

// Export singleton instance
export const apiClient = new ApiClient();

// WebSocket connection for real-time updates
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.emit('connected', null);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit(message.type, message.data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected', null);
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  private reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log('Reconnecting WebSocket...');
      this.connect();
    }, 5000);
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket listener for ${event}:`, error);
      }
    });
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
  }
}

export const wsClient = new WebSocketClient();