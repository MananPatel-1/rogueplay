// TensorDock API client for managing cloud gaming instances

export interface TensorDockInstance {
  id: string;
  name: string;
  status: string;
  type?: string;
  ipAddress?: string;
  portForwards?: Array<{ port: number; protocol: string }>;
  resources?: {
    vcpu_count?: number;
    ram_gb?: number;
    storage_gb?: number;
    gpus?: Record<string, { count: number; v0Name: string }>;
  };
  rateHourly?: number;
  // Legacy snake_case aliases for compatibility
  ip_address?: string;
}

export interface TensorDockListResponse {
  data: TensorDockInstance[];
}

export interface TensorDockInstanceResponse {
  instance: TensorDockInstance;
}

class TensorDockClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TENSORDOCK_API_KEY || '';
    this.baseUrl = process.env.TENSORDOCK_API_URL || 'https://dashboard.tensordock.com/api/v2';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TensorDock API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async listInstances(): Promise<TensorDockInstance[]> {
    const data = await this.request<TensorDockListResponse>('/instances');
    return data.data || [];
  }

  async getInstance(id: string): Promise<TensorDockInstance> {
    const data = await this.request<TensorDockInstance | TensorDockInstanceResponse>(`/instances/${id}`);
    // Handle both direct response and wrapped response
    if ('instance' in data) {
      return data.instance;
    }
    return data as TensorDockInstance;
  }

  async startInstance(id: string): Promise<void> {
    await this.request(`/instances/${id}/start`, {
      method: 'POST',
    });
  }

  async stopInstance(id: string): Promise<void> {
    await this.request(`/instances/${id}/stop`, {
      method: 'POST',
    });
  }

  async waitForInstanceReady(
    id: string,
    maxWaitMs: number = 180000, // 3 minutes
    pollIntervalMs: number = 5000
  ): Promise<TensorDockInstance> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const instance = await this.getInstance(id);
      const status = instance.status?.toLowerCase();

      const ip = instance.ipAddress || instance.ip_address;
      console.log(`[TensorDock] Instance ${id} status: ${status}, IP: ${ip}`);

      // Accept various "running" status values
      const isRunning = status === 'running' || status === 'active' || status === 'online';

      if (isRunning && ip) {
        return instance;
      }

      // Check for failure states
      const isFailed = status === 'error' || status === 'failed' || status === 'stopped';
      if (isFailed) {
        throw new Error(`Instance ${id} failed to start: ${instance.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Instance ${id} did not become ready within ${maxWaitMs}ms`);
  }
}

export const tensorDockClient = new TensorDockClient();
