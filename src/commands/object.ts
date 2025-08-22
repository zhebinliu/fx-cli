import { Command, Flags } from '@oclif/core';
import { ObjectService } from '../services/object.js';
import { ObjectListOptions } from '../services/object.js';
import Table from 'cli-table3';

export default class ObjectCommand extends Command {
  static description = 'Manage Fxiaoke objects (list, get, create, update, delete)';

  static flags = {
    list: Flags.boolean({
      char: 'l',
      description: 'List objects from organization',
      default: false,
    }),
    get: Flags.string({
      char: 'g',
      description: 'Get a specific object by ID',
    }),
    create: Flags.boolean({
      char: 'c',
      description: 'Create a new object',
      default: false,
    }),
    update: Flags.string({
      char: 'u',
      description: 'Update an object by ID',
    }),
    delete: Flags.string({
      char: 'd',
      description: 'Delete an object by ID',
    }),
    type: Flags.string({
      char: 't',
      description: 'Filter objects by type',
    }),
    pageSize: Flags.integer({
      char: 's',
      description: 'Number of objects per page',
      default: 20,
    }),
    page: Flags.integer({
      char: 'p',
      description: 'Page number',
      default: 1,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose logging',
      default: false,
    }),
    debug: Flags.boolean({
      char: 'D',
      description: 'Enable debug logging',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ObjectCommand);
    const objectService = new ObjectService();
    
    // Set logging level
    const isVerbose = flags.verbose || flags.debug;
    const isDebug = flags.debug;
    
    const options: ObjectListOptions = {
      verbose: isVerbose,
      debug: isDebug,
      pageSize: flags.pageSize,
      pageNumber: flags.page,
      objectType: flags.type
    };

    if (flags.list) {
      await this.listObjects(objectService, options);
    } else if (flags.get) {
      await this.getObject(objectService, flags.get, options);
    } else if (flags.create) {
      console.log('🚧 Object creation not yet implemented');
      console.log('   This will be implemented in the next phase');
    } else if (flags.update) {
      console.log('🚧 Object update not yet implemented');
      console.log('   This will be implemented in the next phase');
    } else if (flags.delete) {
      console.log('🚧 Object deletion not yet implemented');
      console.log('   This will be implemented in the next phase');
    } else {
      // Show help if no flags provided
      this.showHelp();
    }
  }

  private async listObjects(objectService: ObjectService, options: ObjectListOptions): Promise<void> {
    console.log('📋 Listing objects from organization...');
    
    const result = await objectService.listObjects(options);
    
    if (result.success) {
      const data = result.data!;
      
      console.log(`\n📊 Object List Results:`);
      console.log(`   Total Objects: ${data.totalCount}`);
      console.log(`   Page: ${data.pageNumber} of ${Math.ceil(data.totalCount / data.pageSize)}`);
      console.log(`   Page Size: ${data.pageSize}`);
      console.log(`   Has More: ${data.hasMore ? 'Yes' : 'No'}`);
      
      if (data.objects.length > 0) {
        console.log('\n📋 Objects:');
        
        // Create table using cli-table3
        const table = new Table({
          head: ['ID', 'Name', 'Type', 'Status'],
          colWidths: [30, 25, 15, 10],
          style: {
            head: ['cyan', 'bold'],
            border: ['gray']
          }
        });
        
        // Add data rows
        data.objects.forEach((obj) => {
          const status = obj.isActive ? 'Active' : 'Inactive';
          table.push([
            obj.id || 'N/A',
            obj.name || 'N/A',
            obj.objectType || 'N/A',
            status
          ]);
        });
        
        // Display the table
        console.log(table.toString());
      } else {
        console.log('\n📭 No objects found');
      }
      
      if (data.hasMore) {
        console.log('\n💡 Use --page to view more results');
      }
    } else {
      this.error(`❌ Failed to list objects: ${result.error}`);
    }
  }

  private async getObject(objectService: ObjectService, objectId: string, options: ObjectListOptions): Promise<void> {
    console.log(`📋 Getting object ${objectId}...`);
    
    const result = await objectService.getObject(objectId, options);
    
    if (result.success) {
      const obj = result.data!;
      
      console.log(`\n📋 Object Details:`);
      console.log(`   Name: ${obj.name}`);
      console.log(`   Type: ${obj.objectType}`);
      console.log(`   ID: ${obj.id}`);
      console.log(`   Created: ${obj.createdAt}`);
      console.log(`   Updated: ${obj.updatedAt}`);
      
      // Show additional properties if they exist
      const additionalProps = Object.keys(obj).filter((key: string) => 
        !['id', 'name', 'objectType', 'createdAt', 'updatedAt'].includes(key)
      );
      
      if (additionalProps.length > 0) {
        console.log('\n📋 Additional Properties:');
        additionalProps.forEach((prop: string) => {
          console.log(`   ${prop}: ${obj[prop]}`);
        });
      }
    } else {
      this.error(`❌ Failed to get object: ${result.error}`);
    }
  }

  private showHelp(): void {
    console.log('📋 Fxiaoke Object Management');
    console.log('');
    console.log('Usage:');
    console.log('  fx object --list                    List objects from organization');
    console.log('  fx object --get <id>               Get a specific object by ID');
    console.log('  fx object --create                 Create a new object (not implemented)');
    console.log('  fx object --update <id>            Update an object (not implemented)');
    console.log('  fx object --delete <id>            Delete an object (not implemented)');
    console.log('');
    console.log('Options:');
    console.log('  -t, --type <type>                  Filter by object type');
    console.log('  -s, --pageSize <number>            Objects per page (default: 20)');
    console.log('  -p, --page <number>                Page number (default: 1)');
    console.log('  -v, --verbose                      Enable verbose output');
    console.log('  -d, --debug                        Enable debug output (includes verbose)');
    console.log('');
    console.log('Examples:');
    console.log('  fx object --list                   List all objects');
    console.log('  fx object --list --type customer   List customer objects only');
    console.log('  fx object --list --pageSize 50     List 50 objects per page');
    console.log('  fx object --get 12345              Get object with ID 12345');
    console.log('  fx object --list --verbose         List with detailed logging');
  }
}
