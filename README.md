# Genkit AWS Lambda with Bedrock

An AWS Lambda function powered by [Firebase Genkit](https://genkit.dev/) and the [AWS Bedrock plugin](https://github.com/xavidop/genkitx-aws-bedrock) for AI-powered story generation.

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
    "topic": "a robot learning to feel emotions",
    "style": "sci-fi",
    "length": "medium"
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

```json
{
  "success": true,
  "data": {
    "title": "Echoes of Atlantis",
    "genre": "Mystery",
    "story": "The full story text...",
    "wordCount": 287,
    "themes": ["time travel", "ancient mysteries", "discovery"]
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
functions:
  storyGenerator: genkit-aws-lambda-bedrock-dev-storyGenerator
```

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
    "topic": "a robot learning to feel emotions",
    "style": "sci-fi",
    "length": "medium"
  }'
```

Or use the test script:

```bash
./test-lambda.sh https://your-api-url.amazonaws.com/generate
```

## Project Structure

```
.
├── src/
│   ├── index.ts          # Main Lambda handler with Genkit flow
│   └── local-test.ts     # Local testing utilities (optional)
├── serverless.yml        # Serverless Framework configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Configuration

### Switching Bedrock Models

Edit `src/index.ts` to use different Bedrock models:

```typescript
import { awsBedrock, anthropicClaude35SonnetV2 } from 'genkitx-aws-bedrock';

const ai = genkit({
  plugins: [awsBedrock({ region: 'us-east-1' })],
  model: anthropicClaude35SonnetV2, // Change model here
});
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

- [Firebase Genkit Documentation](https://genkit.dev/docs/)
- [AWS Bedrock Plugin](https://github.com/xavidop/genkitx-aws-bedrock)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)

## License

Apache-2.0
