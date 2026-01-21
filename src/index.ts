import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { genkit, z } from 'genkit';
import { awsBedrock, amazonNovaProV1 } from 'genkitx-aws-bedrock';

// Initialize Genkit with AWS Bedrock plugin
const ai = genkit({
  plugins: [
    awsBedrock(),
  ],
  model: amazonNovaProV1(),
});

// Define input schema for the story generator
const StoryInputSchema = z.object({
  topic: z.string().describe('The main topic or theme for the story'),
  style: z.string().optional().describe('Writing style (e.g., adventure, mystery, sci-fi)'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

// Define output schema for the generated story
const StorySchema = z.object({
  title: z.string(),
  genre: z.string(),
  story: z.string(),
  wordCount: z.number(),
  themes: z.array(z.string()),
});

// Define a story generator flow
export const storyGeneratorFlow = ai.defineFlow(
  {
    name: 'storyGeneratorFlow',
    inputSchema: StoryInputSchema,
    outputSchema: StorySchema,
  },
  async (input) => {
    // Determine word count based on length
    const lengthMap = {
      short: '200-300',
      medium: '500-700',
      long: '1000-1500',
    };

    const wordCount = lengthMap[input.length];

    // Create a prompt based on the input
    const prompt = `Create a creative ${input.style || 'fictional'} story with the following requirements:
      Topic: ${input.topic}
      Length: ${wordCount} words
      
      Please provide a captivating story with a clear beginning, middle, and end.
      Include rich descriptions and engaging characters.`;

    // Generate structured story data
    const { output } = await ai.generate({
      prompt,
      output: { schema: StorySchema },
    });

    if (!output) {
      throw new Error('Failed to generate story');
    }

    return output;
  }
);

// Lambda handler for AWS Lambda integration
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};

    // Validate and set defaults
    const input = {
      topic: body.topic || 'a brave explorer on an alien planet',
      style: body.style || 'adventure',
      length: (body.length as 'short' | 'medium' | 'long') || 'medium',
    };

    console.log('Generating story with input:', input);

    // Call the Genkit flow
    const story = await storyGeneratorFlow(input);

    console.log('Story generated successfully');

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        data: story,
      }),
    };
  } catch (error) {
    console.error('Error generating story:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    };
  }
};