import { z } from 'zod';
import { cosmiconfig } from 'cosmiconfig';
import { CATEGORIES, type CategoryName } from '../types.js';

const categorySchema = z.enum(Object.keys(CATEGORIES) as [CategoryName, ...CategoryName[]]);

const sourceSchema = z.object({
  name: z.string(),
  url: z.string()
    .url()
    .or(z.string().startsWith('file:///')),
  category: categorySchema
    .describe('Category must be one of: ' + Object.keys(CATEGORIES).join(', '))
    .transform((cat) => validateCategory(cat)),
  enabled: z.boolean().default(true),
  priority: z.number()
    .optional()
    .transform((p, ctx) => {
      const category = ctx.path[ctx.path.length - 2] as CategoryName;
      return p ?? CATEGORIES[category].priority;
    })
});

const configSchema = z.object({
  mongodb: z.object({
    uri: z.string().default('mongodb://localhost:27017/blockingmachine'),
    options: z.object({
      maxPoolSize: z.number().default(10),
    }).default({}),
  }).default({}),
  output: z.object({
    directory: z.string().default('./filters/output'),
  }).default({}),
  sources: z.array(sourceSchema)
    .min(1, 'At least one source is required')
    .refine(sources => {
      const urls = sources.map(s => s.url);
      const uniqueUrls = new Set(urls);
      return urls.length === uniqueUrls.size;
    }, 'Duplicate URLs found in sources')
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

export function validateCategory(category: string): CategoryName {
  if (!(category in CATEGORIES)) {
    const validCategories = Object.keys(CATEGORIES).join(', ');
    throw new Error(
      `Invalid category: "${category}". Must be one of: ${validCategories}`
    );
  }
  return category as CategoryName;
}