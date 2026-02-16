# Genkit AWS Lambda with Bedrock

An AWS Lambda function powered by [Genkit](https://genkit.dev/) and the [AWS Bedrock plugin](https://github.com/genkit-ai/aws-bedrock-js-plugin) for AI-powered story and joke generation, using the new `onCallGenkit` helper for seamless Lambda deployment.

## Prerequisites

- Node.js 20 or later
- AWS Account with:
  - AWS CLI configured
  - Access to AWS Bedrock (request model access in AWS Console)
- AWS credentials configured (via environment variables or AWS profile)
- Serverless Framework (installed automatically as dev dependency)

## Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Install Genkit CLI globally:**

```bash
npm install -g genkit-cli
```


## Local Development

### Run with Serverless Offline (Recommended for Lambda Testing)

The best way to test the Lambda locally with a real HTTP endpoint:

```bash
npm run dev
```

This starts a local server at `http://localhost:3000` that mimics API Gateway. Test it with:

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "topic": "a robot learning to feel emotions",
      "style": "sci-fi",
      "length": "medium"
    }
  }'
```

You can also call the joke flow:

```bash
curl -X POST http://localhost:3000/joke \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "subject": "programming"
    }
  }'
```

### Run with Genkit Dev UI

For testing and debugging the Genkit flow with visual traces:

```bash
npm run genkit:ui
```

This starts the Genkit Developer UI at `http://localhost:4000`. You can:
- Test the `storyGeneratorFlow` with different inputs
- View detailed traces of AI generation
- Debug and optimize your prompts


## Usage Examples

### Request Format

The handler follows the Genkit callable protocol. Wrap your input in a `data` field:

```json
{
  "data": {
    "topic": "a time traveler discovering an ancient civilization",
    "style": "mystery",
    "length": "short"
  }
}
```

Direct input is also supported for convenience:

```json
{
  "topic": "a time traveler discovering an ancient civilization",
  "style": "mystery",
  "length": "short"
}
```

**Parameters:**
- `topic` (required): The main theme or topic for the story
- `style` (optional): Writing style (e.g., "adventure", "mystery", "sci-fi", "romance")
- `length` (optional): Story length - `"short"` (200-300 words), `"medium"` (500-700 words), or `"long"` (1000-1500 words)

### Response Format

Successful response:

```json
{
  "result": {
    "title": "Echoes of Atlantis",
    "genre": "Mystery",
    "story": "The full story text...",
    "wordCount": 287,
    "themes": ["time travel", "ancient mysteries", "discovery"]
  }
}
```

Error response:

```json
{
  "error": {
    "status": "INTERNAL",
    "message": "Failed to generate story"
  }
}
```

## Deployment

### Quick Deploy

Deploy to AWS with a single command:

```bash
npm run deploy
```

This deploys to the `dev` stage by default. After deployment, you'll see output like:

```
endpoints:
  POST - https://abc123.execute-api.us-east-1.amazonaws.com/generate
  POST - https://abc123.execute-api.us-east-1.amazonaws.com/joke
functions:
  storyGenerator: genkit-aws-lambda-bedrock-dev-storyGenerator
  jokeGenerator: genkit-aws-lambda-bedrock-dev-jokeGenerator
  jokeStream: genkit-aws-lambda-bedrock-dev-jokeStream
```

The streaming handler (`jokeStream`) uses a Lambda Function URL printed separately.

### Deploy to Production

```bash
npm run deploy:prod
```

### Deploy to Specific Region

```bash
serverless deploy --region us-west-2
```

### View Deployment Info

```bash
npm run info
```

### View Live Logs

```bash
npm run logs
```

### Remove Deployment

```bash
npm run remove
```

### Test the Deployed Lambda

```bash
curl -X POST https://your-api-url.amazonaws.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "topic": "a robot learning to feel emotions",
      "style": "sci-fi",
      "length": "medium"
    }
  }'
```

## Project Structure

```
.
├── src/
│   ├── index.ts          # Genkit flows + Lambda handlers via onCallGenkit
├── serverless.yml        # Serverless Framework configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Configuration

### Switching Bedrock Models

Edit `src/index.ts` to use different Bedrock models:

```typescript
import { awsBedrock, anthropicClaude35SonnetV2, onCallGenkit } from 'genkitx-aws-bedrock';

const ai = genkit({
  plugins: [awsBedrock({ region: 'us-east-1' })],
  model: anthropicClaude35SonnetV2, // Change model here
});
```

### How onCallGenkit Works

The `onCallGenkit` helper (from the AWS Bedrock plugin) wraps any Genkit flow as an AWS Lambda handler, handling CORS, request parsing, and error formatting automatically:

```typescript
import { onCallGenkit } from 'genkitx-aws-bedrock';

// Simple usage - just wrap a flow
export const handler = onCallGenkit(myFlow);

// With options
export const handler = onCallGenkit(
  {
    cors: { origin: '*' },
    debug: true,
  },
  myFlow
);

// Streaming (requires Lambda Function URL with RESPONSE_STREAM)
export const streamHandler = onCallGenkit(
  { streaming: true, cors: { origin: '*' } },
  myStreamingFlow
);
```

### Adjusting Lambda Resources

Edit `serverless.yml` to change Lambda configuration:

```yaml
provider:
  memorySize: 512    # Increase for better performance
  timeout: 60        # Increase for longer generations
```

## Available Scripts

- `npm run dev` - Run local serverless-offline server (http://localhost:3000)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the Genkit flow standalone
- `npm run genkit:ui` - Start Genkit Developer UI
- `npm run deploy` - Deploy to AWS (dev stage)
- `npm run deploy:prod` - Deploy to AWS (prod stage)
- `npm run info` - Get deployment information
- `npm run logs` - Tail Lambda logs in real-time
- `npm run remove` - Remove deployment from AWS

## Troubleshooting

### "Access Denied" Error

Ensure your AWS credentials have permissions for:
- Lambda function creation
- API Gateway
- CloudFormation
- Bedrock InvokeModel


### TypeScript Errors

Run `npm install` to ensure all dependencies are installed, including type definitions.

## Learn More

- [Genkit Documentation](https://genkit.dev/docs/)
- [AWS Bedrock Plugin](https://github.com/genkit-ai/aws-bedrock-js-plugin)
- [Genkit Client Library](https://genkit.dev/docs/client/)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)

## License

Apache-2.0
