/**
 * AI Observability TypeScript/JavaScript SDK
 * Supports both Node.js and browser environments
 * Monitor LLM usage across 21+ models with smart routing and cost tracking
 */

export interface LLMUsage {
  tenantId: string;
  userId: string;
  provider: string;
  model: string;
  prompt: string;
  completion?: string;
  promptTokens?: number;
  completionTokens?: number;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  name: string;
  metric: 'cost' | 'latency' | 'error_rate' | 'tokens';
  threshold: number;
  condition?: '>' | '<' | '>=';
  window?: '5m' | '15m' | '1h' | '24h';
  severity?: 'info' | 'warning' | 'critical';
  channels?: string[];
  enabled?: boolean;
}

export interface RouteResponse {
  selectedModel: string;
  response: string;
  cost: number;
  latencyMs: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIObservabilityConfig {
  apiKey: string;
  endpoint?: string;
  batchSize?: number;
  flushIntervalMs?: number;
  defaultTenant?: string;
}

// Confirmed working models
export const WORKING_MODELS = {
  groq: [
    'llama-3.1-8b-instant',      // Fastest, ~58ms, ~$0.00003
    'llama-3.3-70b-versatile',   // Best reasoning, ~386ms, ~$0.00003
    'gpt-oss-120b'               // GPT-4 class, ~308ms, ~$0.00014
  ],
  google: [
    'gemma-3-27b-it',            // Best free, ~773ms, FREE
    'gemma-3-1b-it',             // Fast free, ~694ms, FREE
    'gemini-2.5-flash'           // ~1640ms, ~$0.000002
  ]
};

export class AIObservability {
  private apiKey: string;
  private endpoint: string;
  private defaultTenant: string;
  private batch: LLMUsage[] = [];
  private batchSize: number;
  private flushIntervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isBrowser: boolean;

  constructor(config: AIObservabilityConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = (config.endpoint || 'https://ai-api.usefreelanceflow.com').replace(/\/$/, '');
    this.batchSize = config.batchSize || 100;
    this.flushIntervalMs = config.flushIntervalMs || 5000;
    this.defaultTenant = config.defaultTenant || 'default';
    this.isBrowser = typeof window !== 'undefined';

    // Start periodic flush for Node.js
    if (!this.isBrowser) {
      this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
    }
  }

  private async request<T>(method: string, path: string, data?: any, params?: any): Promise<T> {
    const url = `${this.endpoint}${path}`;
    const headers: Record<string, string> = {
      'X-AI-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers
    };

    // Use fetch (works in both Node.js and browser)
    if (method === 'GET' && params) {
      const searchParams = new URLSearchParams(params);
      const urlWithParams = `${url}?${searchParams}`;
      const response = await fetch(urlWithParams, options);
      return response.json();
    } else {
      if (data) {
        options.body = JSON.stringify(data);
      }
      const response = await fetch(url, options);
      return response.json();
    }
  }

  /**
   * Track LLM usage (batched, non-blocking)
   */
  async track(usage: LLMUsage): Promise<void> {
    if (!usage.tenantId) usage.tenantId = this.defaultTenant;
    this.batch.push(usage);
    
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Track usage synchronously (for browsers, uses sendBeacon)
   */
  trackSync(usage: LLMUsage): void {
    if (!usage.tenantId) usage.tenantId = this.defaultTenant;
    
    if (this.isBrowser && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(usage)], { type: 'application/json' });
      navigator.sendBeacon(`${this.endpoint}/api/llmusage/track`, blob);
    } else {
      this.batch.push(usage);
      if (this.batch.length >= this.batchSize) {
        this.flush().catch(console.error);
      }
    }
  }

  /**
   * Flush batched events to server
   */
  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const batchToSend = [...this.batch];
    this.batch = [];

    try {
      await fetch(`${this.endpoint}/api/llmusage/track-batch`, {
        method: 'POST',
        headers: {
          'X-AI-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchToSend)
      });
    } catch (error) {
      // Re-queue for retry
      this.batch.unshift(...batchToSend);
      console.error('Failed to send telemetry:', error);
    }
  }

  /**
   * Health check
   */
  async health(): Promise<any> {
    const endpoints = ['/health/live', '/health/ready', '/health'];
    for (const ep of endpoints) {
      try {
        return await this.request('GET', ep);
      } catch {
        continue;
      }
    }
    return { status: 'Unknown', message: 'Health check failed' };
  }

  /**
   * Route a prompt to the best AI model
   */
  async route(prompt: string, preference: 'cost' | 'speed' | 'quality' | 'balanced' = 'balanced', maxTokens: number = 2000): Promise<RouteResponse> {
    return this.request('POST', '/api/Router/route', {
      prompt,
      preference,
      maxTokens
    });
  }

  /**
   * Get available models
   */
  async getModels(provider?: string): Promise<any[]> {
    const params = provider ? { provider } : {};
    const result = await this.request<any>('GET', '/api/Router/models', undefined, params);
    return result.models || [];
  }

  /**
   * Get budget status
   */
  async getBudget(tenantId?: string): Promise<any> {
    const tid = tenantId || this.defaultTenant;
    return this.request('GET', `/api/Budget/status/${tid}`);
  }

  /**
   * Get usage history
   */
  async getUsageHistory(tenantId?: string, limit: number = 100): Promise<any[]> {
    const tid = tenantId || this.defaultTenant;
    const result = await this.request<any>('GET', `/api/LlmUsage/history/${tid}`, undefined, { limit });
    return result.data || result;
  }

  /**
   * Compare multiple models
   */
  async compareModels(prompt: string, models?: string[]): Promise<any> {
    if (!models) {
      models = [
        'groq/llama-3.3-70b-versatile',
        'groq/llama-3.1-8b-instant',
        'google/gemma-3-27b-it',
        'google/gemma-3-1b-it'
      ];
    }
    return this.request('POST', '/api/Playground/compare', { prompt, models });
  }
  
  /**
   * Generate image from text
   */
  async generateImage(prompt: string): Promise<string> {
    const result = await this.request<any>('POST', '/api/Playground/generate-image', { prompt });
    return result.imageBase64;
  }
  /**
   * Create an alert
   */
  async createAlert(alert: AlertRule, tenantId?: string): Promise<any> {
    const tid = tenantId || this.defaultTenant;
    return this.request('POST', '/api/Alerts', {
      tenantId: tid,
      name: alert.name,
      metric: alert.metric,
      condition: alert.condition || '>',
      threshold: alert.threshold,
      window: alert.window || '1h',
      severity: alert.severity || 'warning',
      channels: alert.channels || ['email'],
      enabled: alert.enabled !== false
    });
  }

  /**
   * Get alerts
   */
  async getAlerts(tenantId?: string): Promise<any[]> {
    const tid = tenantId || this.defaultTenant;
    return this.request('GET', `/api/Alerts/${tid}`);
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string): Promise<any> {
    return this.request('DELETE', `/api/Alerts/${alertId}`);
  }

  /**
   * Search knowledge base (RAG)
   */
  async searchKnowledge(query: string, tenantId?: string, topK: number = 5): Promise<any> {
    const tid = tenantId || this.defaultTenant;
    return this.request('POST', '/api/rag/query', {
      tenantId: tid,
      query,
      topK
    });
  }

  /**
   * Clean shutdown
   */
  close(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush().catch(console.error);
  }
}

// Express middleware for automatic tracking
export function aiObservabilityMiddleware(client: AIObservability) {
  return async (req: any, res: any, next: any) => {
    const start = Date.now();
    
    // Store original end function
    const originalEnd = res.end;
    
    res.end = function(...args: any[]) {
      const duration = Date.now() - start;
      
      // Track request as LLM usage if applicable
      if (req.body?.prompt) {
        client.track({
          tenantId: req.headers['x-tenant-id'] as string || 'default',
          userId: req.user?.id || 'anonymous',
          provider: req.body.provider || 'openai',
          model: req.body.model || 'gpt-4',
          prompt: req.body.prompt,
          completion: req.body.completion,
          durationMs: duration,
          success: res.statusCode < 400,
          metadata: {
            path: req.path,
            method: req.method,
            statusCode: res.statusCode
          }
        }).catch(console.error);
      }
      
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

// Usage example:
/*
import { AIObservability, WORKING_MODELS } from '@freelanceflow/ai-observability';

// Initialize SDK
const client = new AIObservability({
  apiKey: 'your-api-key',
  endpoint: 'https://ai-api.usefreelanceflow.com',
  batchSize: 50,
  flushIntervalMs: 10000,
  defaultTenant: 'my-company'
});

// Track LLM usage
await client.track({
  tenantId: 'tenant-123',
  userId: 'user-456',
  provider: 'groq',
  model: WORKING_MODELS.groq[0],
  prompt: 'What is AI observability?',
  completion: 'AI observability is...',
  promptTokens: 10,
  completionTokens: 50,
  durationMs: 150,
  success: true
});

// Route a prompt
const routeResult = await client.route(
  'Explain quantum computing', 
  'balanced', 
  1000
);
console.log(`Selected model: ${routeResult.selectedModel}`);
console.log(`Response: ${routeResult.response}`);
console.log(`Cost: $${routeResult.cost}`);

// Create an alert
await client.createAlert({
  name: 'High Cost Alert',
  metric: 'cost',
  threshold: 100,
  severity: 'critical'
});

// Shutdown gracefully
client.close();
*/