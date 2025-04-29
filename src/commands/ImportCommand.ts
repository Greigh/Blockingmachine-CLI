import { BaseCommand, type CommandOptions, type CommandResult } from './BaseCommand.js';
import type { ImportOptions } from './types.js';
import { connectDB } from '../lib/db.js';
import { ImportProcessor } from '../lib/import.js';

export class ImportCommand extends BaseCommand<ImportOptions> {
  constructor(options: CommandOptions) {
    super(options);
  }
  
  async execute(options: ImportOptions = {}): Promise<CommandResult> {
    try {
      await connectDB(this.config.mongodb);
      
      const processor = new ImportProcessor(this.context);
      const result = await processor.processAllSources();
      
      return this.success(result, 'Successfully imported all sources');
    } catch (error) {
      return this.failure(error as Error);
    }
  }
}