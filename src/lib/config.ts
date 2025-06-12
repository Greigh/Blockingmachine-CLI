import { z } from 'zod';
import { cosmiconfig } from 'cosmiconfig';

const categorySchema = z.string();

const sourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  category: categorySchema,
  enabled: z.boolean().default(true),
  priority: z.number().optional()
});

const configSchema = z.object({
  output: z.object({
    directory: z.string().default('./filters/output'),
  }).default({}),
  sources: z.array(sourceSchema)
    .min(1, 'At least one source is required')
});

export type Config = z.infer<typeof configSchema>;

export async function loadConfig(): Promise<Config> {
  const explorer = cosmiconfig('blockingmachine');
  const result = await explorer.search();
  
  if (!result) {
    throw new Error('No configuration file found');
  }
  
  try {
    return configSchema.parse(result.config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`Invalid configuration:\n${issues}`);
    }
    throw error;
  }
}