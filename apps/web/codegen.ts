import type { CodegenConfig } from '@graphql-codegen/cli';

// Client preset (SPEC §6): typed documents for Apollo's own hooks. The schema is read straight from
// the api's SDL modules, so the web app never needs a running server to generate types.
const config: CodegenConfig = {
  schema: '../api/src/schema/**/schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  ignoreNoDocuments: true,
  generates: {
    'src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      config: {
        scalars: { DateTime: 'string' },
        strictScalars: true,
        // USState becomes a string union, assignable to/from @covertree/validation's USState.
        enumType: 'string-literal',
        useTypeImports: true,
      },
    },
  },
};

export default config;
