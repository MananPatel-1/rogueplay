// Wolf API client for Moonlight pairing
// Each gaming node has its own Wolf instance with unique API credentials

export interface WolfPairResponse {
  success: boolean;
  client_id?: string;
  error?: string;
}

export interface WolfUnpairResponse {
  success: boolean;
  error?: string;
}

export interface WolfClient {
  client_id: string;
  name?: string;
  paired_at?: string;
}

export interface WolfPendingPair {
  pair_secret: string;
  // Other fields that might be returned
}

export interface WolfSession {
  session_id: string;
  client_id: string;
  app_id?: string;
  started_at?: string;
}

export class WolfApiClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wolf API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async pairClient(pairSecret: string, pin: string): Promise<WolfPairResponse> {
    return this.request<WolfPairResponse>('/api/v1/pair/client', {
      method: 'POST',
      body: JSON.stringify({
        pair_secret: pairSecret,
        pin: pin,
      }),
    });
  }

  async unpairClient(clientId: string): Promise<WolfUnpairResponse> {
    return this.request<WolfUnpairResponse>('/api/v1/unpair/client', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
      }),
    });
  }

  async listClients(): Promise<WolfClient[]> {
    const data = await this.request<{ clients: WolfClient[] }>('/api/v1/clients');
    return data.clients || [];
  }

  async getActiveSessions(): Promise<WolfSession[]> {
    const data = await this.request<{ sessions: WolfSession[] }>('/api/v1/sessions');
    return data.sessions || [];
  }

  async getPendingPairSecret(): Promise<string | null> {
    try {
      const data = await this.request<{
        success?: boolean;
        pair_secret?: string;
        requests?: { pair_secret: string; client_ip?: string }[];
        pending?: { pair_secret: string }[];
      }>('/api/v1/pair/pending');

      // Handle different response formats
      if (data.pair_secret) {
        return data.pair_secret;
      }
      if (data.requests && data.requests.length > 0) {
        return data.requests[0].pair_secret;
      }
      if (data.pending && data.pending.length > 0) {
        return data.pending[0].pair_secret;
      }
      return null;
    } catch (error) {
      console.error('Failed to get pending pair secret:', error);
      return null;
    }
  }
}

export function createWolfClient(apiUrl: string, apiKey: string): WolfApiClient {
  return new WolfApiClient(apiUrl, apiKey);
}
