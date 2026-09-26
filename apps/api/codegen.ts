import { defineConfig } from '@eddeee888/gcg-typescript-resolver-files';
import type { CodegenConfig } from '@graphql-codegen/cli';

// Server preset (SPEC §6). DateTime is picked up from graphql-scalars automatically, and mappers
// come from schema.mappers.ts. Resolver files are generated once as stubs, then hand-written.
const config: CodegenConfig = {
  schema: 'src/schema/**/schema.graphql',
  generates: {
    'src/schema': defineConfig({
      typesPluginsConfig: {
        contextType: '../context.js#GraphQLContext',
        // GraphQL enums become string unions that fit Prisma's and zod's USState without mapping.
        enumsAsTypes: true,
        useTypeImports: true,
      },
      // NodeNext ESM: relative imports need the .js extension.
      emitLegacyCommonJSImports: false,
    }),
  },
};

export default config;
