# AI Observability TypeScript SDK

Monitor LLM usage across 21+ models with smart routing and cost tracking.

## Installation

ash
npm install freelanceflow


## Quick Start

	ypescript
import { AIObservability } from 'freelanceflow';

const client = new AIObservability({ apiKey: 'your_api_key' });

// Route a prompt
const response = await client.route('What is AI?', 'speed');
console.log(response);

// Track usage
await client.track({
  userId: 'user-123',
  provider: 'groq',
  model: 'llama-3.1-8b-instant',
  prompt: 'What is AI?',
  completion: 'AI is...',
  promptTokens: 10,
  completionTokens: 50,
  durationMs: 150
});


## Documentation

Full docs: https://ai-api.usefreelanceflow.com/docs
