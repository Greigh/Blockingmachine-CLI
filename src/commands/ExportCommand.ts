import { BaseCommand, type CommandOptions, type CommandResult } from './BaseCommand.js';
import type { ExportOptions } from '../types.js';
import type { FilterListMetadata } from '../types.js';
import { 
  exportWithOptions, 
  defaultFilterMeta,
  createPaths,
  defaultPerformance
} from '../../../core/dist/index.js';

export class ExportCommand extends BaseCommand<ExportOptions> {
  constructor(options: CommandOptions) {
    super(options);
  }
  
  async execute(options: ExportOptions = {}): Promise<CommandResult> {
    try {
      const config = this.config;  // Use this.config instead of this.context.config
      const baseDir = config.baseDir || process.cwd();
      const paths = createPaths(baseDir);
      
      const meta: FilterListMetadata = {
        ...defaultFilterMeta,
        ...(config.meta || {}),
        // Only set these if not provided in config.meta
        ...(config.meta?.title ? {} : { 
          title: "BlockingMachine Filter List" 
        }),
        ...(config.meta?.description ? {} : {
          description: "Combined filter list"
        }),
        ...(config.meta?.homepage ? {} : {
          homepage: "https://github.com/danielhipskind/blockingmachine"
        }),
        ...(config.meta?.version ? {} : {
          version: "1.0.0"
        }),
        lastUpdated: new Date().toISOString()  // Always update this
      };

      const result = await exportWithOptions(
        options.outputPath || paths.output.dir,
        meta,
        {
          ...defaultPerformance.processing,
          ...options,
        }
      );
      
      return this.success(result, 'Successfully exported filter lists');
    } catch (error) {
      return this.failure(error as Error);
    }
  }
}