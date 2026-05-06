# AI Observability TypeScript SDK

[![npm version](https://badge.fury.io/js/freelanceflow.svg)](https://www.npmjs.com/package/freelanceflow)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Monitor, track, and optimize your LLM usage across 21+ AI models directly from Node.js, Next.js, React, or any TypeScript/JavaScript application.

## ✨ Features

- 🚀 **Smart Routing** — Route prompts to the best model by cost, speed, or quality
- 📊 **Cost Tracking** — Real-time usage and cost monitoring across providers
- 💰 **Budget Management** — Set budgets and receive threshold alerts
- 🔍 **Model Comparison** — Compare 21+ models side-by-side
- 📚 **RAG Knowledge Base** — Search your documents with semantic queries
- ⚡ **Batched Telemetry** — Non-blocking, auto-flushing usage tracking
- 🌐 **Universal** — Works in Node.js, browser, Edge, and serverless environments

## 📦 Installation

ash
npm install freelanceflow


ash
yarn add freelanceflow


ash
pnpm add freelanceflow


## 🚀 Quick Start

	ypescript
import { AIObservability } from 'freelanceflow';

const client = new AIObservability({ apiKey: 'your_api_key' });

// Route a prompt to the best model
const response = await client.route('What is machine learning?', 'speed');
console.log('Response:', response.response);
console.log('Model:', response.selectedModel);
console.log('Cost: $' + response.cost);
console.log('Latency:', response.latencyMs + 'ms');


## 📊 Usage Examples

### Track LLM Usage

	ypescript
await client.track({
  userId: 'user-123',
  provider: 'groq',
  model: 'llama-3.1-8b-instant',
  prompt: 'Explain quantum computing',
  completion: 'Quantum computing is...',
  promptTokens: 12,
  completionTokens: 48,
  durationMs: 150,
  success: true
});


### Compare Models

	ypescript
const comparison = await client.compareModels('What is Python?');
comparison.results.forEach(model => {
  console.log(': v1.0.0{model.cost} — ms');
});


### Get Usage History

	ypescript
const history = await client.getUsageHistory('my-tenant', 100);
console.log('Found  records');


### Manage Alerts

	ypescript
// Create an alert
await client.createAlert({
  name: 'Budget Alert',
  metric: 'cost',
  threshold: 50,
  condition: '>',
  severity: 'warning'
});

// List alerts
const alerts = await client.getAlerts('my-tenant');
console.log(alerts);


### Express Middleware

	ypescript
import { AIObservability, aiObservabilityMiddleware } from 'freelanceflow';

const client = new AIObservability({ apiKey: 'your_key' });
app.use(aiObservabilityMiddleware(client));


## 🔧 API Reference

| Method | Description |
|--------|-------------|
| oute(prompt, preference?) | Route a prompt to the best model |
| 	rack(usage) | Track LLM usage (batched, non-blocking) |
| getModels(provider?) | Get available AI models |
| compareModels(prompt, models?) | Compare models side-by-side |
| getBudget(tenantId?) | Get budget status |
| getUsageHistory(tenantId?, limit?) | Get usage history |
| createAlert(alert, tenantId?) | Create an alert rule |
| getAlerts(tenantId?) | List active alerts |
| deleteAlert(alertId) | Delete an alert |
| searchKnowledge(query, tenantId?) | Search RAG knowledge base |
| health() | Check API health |
| close() | Flush and close client |

## 🔑 Authentication

Get your free API key at the [AI Observability Dashboard](https://ai-api.usefreelanceflow.com).

	ypescript
const client = new AIObservability({
  apiKey: 'your_api_key',
  endpoint: 'https://ai-api.usefreelanceflow.com', // Optional
  batchSize: 100,                                    // Optional (default: 100)
  flushIntervalMs: 5000                              // Optional (default: 5000ms)
});


## 🌐 Browser Support

This SDK works in the browser. The client automatically detects the environment and uses etch instead of Node.js timers:

html
<script type="module">
import { AIObservability } from 'https://esm.sh/freelanceflow';

const client = new AIObservability({ apiKey: 'your_key' });
const result = await client.route('Hello world!');
</script>


## 📖 Full Documentation

Complete API reference and guides: [https://ai-api.usefreelanceflow.com/docs](https://ai-api.usefreelanceflow.com/docs)

## 🤝 Contributing

Contributions welcome! Open an issue or pull request on [GitHub](https://github.com/BuildMintZ/aiobservability-typescript).

## 📄 License

MIT © [Cyprain Chidozie](https://github.com/BuildMintZ)
