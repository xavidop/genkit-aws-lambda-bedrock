import { genkit, z } from 'genkit';
import { awsBedrock, amazonNovaProV1, onCallGenkit } from 'genkitx-aws-bedrock';

// Initialize Genkit with AWS Bedrock plugin
const ai = genkit({
  plugins: [awsBedrock()],
  model: amazonNovaProV1(),
});

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Input schema for the story generator
 */
const StoryInputSchema = z.object({
  topic: z.string().describe('The main topic or theme for the story'),
  style: z.string().optional().describe('Writing style (e.g., adventure, mystery, sci-fi)'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

/**
 * Output schema for generated stories
 */
const StoryOutputSchema = z.object({
  title: z.string(),
  genre: z.string(),
  story: z.string(),
  wordCount: z.number(),
  themes: z.array(z.string()),
});

// ============================================================================
// Flow Definitions
// ============================================================================

/**
 * Story Generator Flow
 * Generates creative stories based on topic, style, and length
 */
const storyGeneratorFlow = ai.defineFlow(
  {
    name: 'storyGeneratorFlow',
    inputSchema: StoryInputSchema,
    outputSchema: StoryOutputSchema,
  },
  async (input) => {
    const lengthMap = {
      short: '200-300',
      medium: '500-700',
      long: '1000-1500',
    };

    const wordCount = lengthMap[input.length];

    const prompt = `Create a creative ${input.style || 'fictional'} story with the following requirements:
      Topic: ${input.topic}
      Length: ${wordCount} words
      
      Please provide a captivating story with a clear beginning, middle, and end.
      Include rich descriptions and engaging characters.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: StoryOutputSchema },
    });

    if (!output) {
      throw new Error('Failed to generate story');
    }

    return output;
  }
);

/**
 * Joke Generator Flow
 * A simple flow that generates jokes about a given subject
 */
const jokeFlow = ai.defineFlow(
  {
    name: 'jokeFlow',
    inputSchema: z.object({
      subject: z.string().describe('The subject to tell a joke about'),
    }),
    outputSchema: z.object({
      joke: z.string(),
      type: z.string().optional(),
    }),
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `Tell me a funny joke about ${input.subject}. Make it clever and appropriate for all ages.`,
      output: {
        schema: z.object({
          joke: z.string(),
          type: z.string().optional(),
        }),
      },
    });

    return llmResponse.output || { joke: llmResponse.text };
  }
);

/**
 * Streaming Joke Generator Flow
 * Same as jokeFlow but streams text chunks as they arrive from the LLM.
 * Uses streamSchema + sendChunk so that `flow.stream()` emits intermediate data.
 */
const jokeStreamingFlow = ai.defineFlow(
  {
    name: 'jokeStreamingFlow',
    inputSchema: z.object({
      subject: z.string().describe('The subject to tell a joke about'),
    }),
    outputSchema: z.object({
      joke: z.string(),
      type: z.string().optional(),
    }),
    streamSchema: z.string(),
  },
  async (input, sendChunk) => {
    const { stream, response } = await ai.generateStream({
      prompt: `Tell me a funny joke about ${input.subject}. Make it clever and appropriate for all ages.`,
      output: {
        schema: z.object({
          joke: z.string(),
          type: z.string().optional(),
        }),
      },
    });

    // Forward LLM text chunks to the flow stream
    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    const result = await response;
    return result.output || { joke: result.text };
  }
);

// ============================================================================
// Lambda Handlers using onCallGenkit
// ============================================================================

/**
 * Story Generator Handler
 *
 * Basic usage of onCallGenkit - wraps the flow with CORS and error handling
 *
 * @example
 * POST /generate
 * {
 *   "data": {
 *     "topic": "a robot learning to feel emotions",
 *     "style": "sci-fi",
 *     "length": "medium"
 *   }
 * }
 */
export const storyGeneratorHandler = onCallGenkit(
  {
    cors: {
      origin: '*',
      methods: ['POST', 'OPTIONS'],
    },
    debug: process.env.NODE_ENV !== 'production',
  },
  storyGeneratorFlow
);

/**
 * Joke Generator Handler
 *
 * Simple flow without additional options
 *
 * @example
 * POST /joke
 * {
 *   "data": {
 *     "subject": "programming"
 *   }
 * }
 */
export const jokeHandler = onCallGenkit(jokeFlow);

/**
 * Joke Streaming Handler
 *
 * Uses streaming: true for real incremental streaming
 * via Lambda Function URLs with InvokeMode: RESPONSE_STREAM.
 * Compatible with `streamFlow` from `genkit/beta/client`.
 *
 * @example
 * POST /joke-stream
 * Accept: text/event-stream
 * {
 *   "data": {
 *     "subject": "programming"
 *   }
 * }
 */
export const jokeStreamHandler = onCallGenkit(
  {
    streaming: true,
    cors: {
      origin: '*',
      methods: ['POST', 'OPTIONS'],
    },
    debug: process.env.NODE_ENV !== 'production',
  },
  jokeStreamingFlow
);

// ============================================================================
// Export flows for Genkit Dev UI
// ============================================================================

export { storyGeneratorFlow, jokeFlow, jokeStreamingFlow };