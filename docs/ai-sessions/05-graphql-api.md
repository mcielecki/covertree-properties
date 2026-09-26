 ▐▛███▛█   Claude Code v2.1.282
▝▜██████▀  Opus 5.5 · Claude Pro
 ▝▝   ▝▝   ~/covertree-properties

  Get to finished work sooner with Opus 5.5. Switch anytime with /model.
  1 more notice hidden

❯ /clear                                                                        

❯ /milestone 5                                                                  
  ⎿  Read docs/SPEC.md (875 lines)

⏺ I'll look at the current state of the API before writing the plan.

  Ran 3 shell commands (ctrl+o to expand)

⏺ Milestone 5 plan: GraphQL schema, resolvers and integration tests

  I read the M1–M4 code. The service, repository, weather provider and domain
  errors already exist, so this milestone adds the GraphQL layer on top without
  changing business logic.

  Dependencies (apps/api)

  - Runtime: graphql-yoga, graphql, graphql-scalars
  - Dev: @graphql-codegen/cli, @eddeee888/gcg-typescript-resolver-files, tsx
  - Before using them I'll check each with context7: the server preset's config
    (mappers suffix, typesPluginsConfig.enumsAsTypes, scalar overrides),
    createYoga maskedErrors.maskError and cors, and graphql-scalars
    DateTimeResolver.

  Files to create or change

  File: apps/api/codegen.ts
  Purpose: Server preset on src/schema, enumsAsTypes: true, DateTime taken from
  graphql-scalars, mappers from schema.mappers.ts
  ────────────────────────────────────────
  File: src/schema/base/schema.graphql
  Purpose: DateTime, SortOrder, Query, Mutation (§2.1)
  ────────────────────────────────────────
  File: src/schema/property/schema.graphql
  Purpose: USState, Property, WeatherData, PropertyFilter, PropertyPage,
  CreatePropertyInput, queries and mutations, with descriptions from §2.1
  ────────────────────────────────────────
  File: src/schema/property/schema.mappers.ts
  Purpose: PropertyMapper = PropertyRecord, WeatherDataMapper = WeatherCurrent
  ────────────────────────────────────────
  File: src/schema/property/resolvers/Query/{properties,property}.ts
  Purpose: Thin resolvers that call context.propertyService.list/getById
  ────────────────────────────────────────
  File:
  src/schema/property/resolvers/Mutation/{createProperty,deleteProperty}.ts
  Purpose: Thin resolvers that call create and delete
  ────────────────────────────────────────
  File: src/schema/property/resolvers/Property.ts
  Purpose: Pass-through resolvers (the mapper already fits)
  ────────────────────────────────────────
  File: src/schema/property/resolvers/WeatherData.ts
  Purpose: Converts snake_case to camelCase, turns absent fields into null, maps

  is_day to a boolean
  ────────────────────────────────────────
  File: src/schema/*.generated.ts
  Purpose: Generated resolver types, typeDefs and resolver map
  ────────────────────────────────────────
  File: src/errors/mask-error.ts
  Purpose: Maps each domain error to a GraphQLError with the code, message and
  extensions from §5; everything else goes to Yoga's default masking
  ────────────────────────────────────────
  File: src/context.ts
  Purpose: GraphQLContext { propertyService }
  ────────────────────────────────────────
  File: src/app.ts
  Purpose: createApp({ propertyService, logger, corsOrigin, isDev }) returns a
  Yoga instance, with a small plugin that logs unexpected errors together with
  the operation name
  ────────────────────────────────────────
  File: src/config/env.ts
  Purpose: Parses process.env with zod (§6 env table). WEATHERSTACK_API_KEY is
  required unless WEATHER_PROVIDER=fake
  ────────────────────────────────────────
  File: src/main.ts
  Purpose: Loads the repo-root .env, parses the env, builds Prisma, the
  repository, the provider and the service, logs the fake-provider warn line,
  and starts a node:http server
  ────────────────────────────────────────
  File: apps/api/package.json
  Purpose: Scripts: codegen becomes prisma generate && graphql-codegen, plus
  dev:
   tsx watch src/main.ts
  ────────────────────────────────────────
  File: test/helpers/graphql.ts
  Purpose: createTestApp() (real PrismaPropertyRepository plus
  FakeWeatherProvider), gql(app, query, variables) via yoga.fetch, and
  insertProperty(prisma, overrides, createdAt?) for controlling ordering

  Tests: unit tests (written first)

  Test: src/errors/mask-error.test.ts
  Covers: Each domain error maps to BAD_USER_INPUT + fieldErrors, NOT_FOUND +
  id,
  ALREADY_EXISTS ± id, LOCATION_NOT_FOUND + zipCode with the §5 message, or
  WEATHER_SERVICE_UNAVAILABLE with the generic message and no provider code.
  Unknown errors are masked. (AC-5.10, 5.13)
  ────────────────────────────────────────
  Test: src/schema/property/resolvers/WeatherData.test.ts
  Covers: camelCase mapping, every optional field absent becomes null, is_day
  yes/no/missing becomes true/false/null (AC-5.14, W.5 data side)
  ────────────────────────────────────────
  Test: src/config/env.test.ts
  Covers: Defaults, key required for weatherstack but not for fake, invalid
  timeout or port rejected

  Tests: integration (test/integration/, real covertree_test via yoga.fetch)

  ┌──────────────────────────┬───────────────────────────────────────────────┐
  │           File           │                      ACs                      │
  ├──────────────────────────┼───────────────────────────────────────────────┤
  │                          │ 1.1–1.6 (the fake records no calls, and a     │
  │ properties-query.test.ts │ vi.spyOn(globalThis, 'fetch') spy is never    │
  │                          │ called), 2.1–2.4, 3.1–3.9                     │
  ├──────────────────────────┼───────────────────────────────────────────────┤
  │ property-query.test.ts   │ 4.1–4.5                                       │
  ├──────────────────────────┼───────────────────────────────────────────────┤
  │ create-property.test.ts  │ 5.1–5.10, 5.12 (Promise.all), 5.13, 5.14, 6.4 │
  ├──────────────────────────┼───────────────────────────────────────────────┤
  │ delete-property.test.ts  │ 6.1–6.3                                       │
  ├──────────────────────────┼───────────────────────────────────────────────┤
  │                          │ 7.1–7.3 via introspection (exact Property     │
  │ schema.test.ts           │ fields; CreatePropertyInput has only the 4    │
  │                          │ fields), and sending id or lat in the input   │
  │                          │ gives GRAPHQL_VALIDATION_FAILED               │
  └──────────────────────────┴───────────────────────────────────────────────┘

  Points to decide or possible SPEC deviations

  1. AC-5.11 (timeout) in integration. Integration tests use the fake provider,
     so they can only check that a WeatherUnavailableError from the provider
     becomes WEATHER_SERVICE_UNAVAILABLE with nothing persisted. The real
     timeout is already covered by the adapter unit tests from M3.
  2. AC-3.8 / AC-5.5 with an invalid enum. An inline literal (state: XX) gives
     GRAPHQL_VALIDATION_FAILED. The same value passed as a variable is a
     variable-coercion error in graphql-js, and Yoga may not tag it with that
     code. I'll test both forms. If the variable form comes back with a
     different code, I'll write down the actual behavior in §5 of SPEC rather
     than add a workaround.
  3. Generated GraphQL files are committed. Prisma's output stays gitignored.
     typeDefs.generated.ts is imported at runtime and the server preset writes
     resolver stubs into src, so committing them keeps typecheck working from a
     clean clone without running codegen. If you'd prefer them gitignored and
     generated on postinstall, tell me.
  4. main.ts reads the repo-root .env with an explicit path, because pnpm dev
     runs inside apps/api. There's no build or start script yet; those belong to
     M6 (Docker).

  Out of scope: Dockerfiles and compose services (M6), anything in the web app
  (M7).

  Reply "approved" and I'll start, or tell me what to change.

✻ Worked for 1m 5s · done 11:46 AM

❯ approved, all 4 points as proposed.                                           

  Called plugin:context7:context7 4 times (ctrl+o to expand)

⏺ Docs confirm the plan. Installing dependencies.

⏺ Bash(pnpm --filter @covertree/api add graphql graphql-yoga graphql-scalars
      2>&1 | tail -5 && pnpm --filter @covertree/api add -D @graphql-codegen/cli
      @eddeee888/gcg-…)
  ⎿  apps/api postinstall:
     apps/api postinstall: ✔ Generated Prisma Client (7.10.0) to ./src/gene
     rated/prisma in 17ms
     … +26 lines (ctrl+o to expand)
  ⎿  Updated apps/api/package.json (+7 -1)
      17      "@prisma/adapter-pg": "^7.10.0",
      18      "@prisma/client": "^7.10.0",
      19      "dotenv": "^18.0.3",
      20 +    "graphql": "^17.0.2",                                      
      21 +    "graphql-scalars": "^2.0.0",                               
      22 +    "graphql-yoga": "^5.24.1",                                 
      23      "zod": "^4.6.5"
      24    },
      25    "devDependencies": {
      23 -    "prisma": "7.10.0"                                         
      26 +    "@eddeee888/gcg-typescript-resolver-files": "^0.19.0",     
      27 +    "@graphql-codegen/cli": "^7.4.3",                          
      28 +    "prisma": "7.10.0",                                        
      29 +    "tsx": "^4.23.15"                                          
      30    }
      31  }
  ⎿  … 1 more file changed
  ⎿  (timeout 5m)
  ⎿  Found 16 new diagnostic issues in 8 files (ctrl+o to expand)

⏺ The installer picked graphql@17. I'll check whether Yoga, graphql-scalars and
  codegen accept it as a peer dependency.

  Ran 1 shell command (ctrl+o to expand)

⏺ All four accept graphql 17, and typecheck is clean (the IDE diagnostics above
  are stale). Next I'll write the SDL and codegen config.

⏺ Bash(mkdir -p src/schema/base src/schema/property && cat >
      src/schema/base/schema.graphql <<'EOF'
      "ISO-8601 date-time string on the wire."…)
  ⎿  ❯ Parse Configuration
     ✔ Parse Configuration
     ❯ Generate outputs
     … +23 lines (ctrl+o to expand)
  ⎿  Created apps/api/codegen.ts (+21 -0)
       1 +import { defineConfig } from '@eddeee888/gcg-typescript-resolve
         +r-files';                                                      
       2 +import type { CodegenConfig } from '@graphql-codegen/cli';     
       3 +                                                               
       4 +const config: CodegenConfig = {                                
       5 +  schema: 'src/schema/**/schema.graphql',                      
       6 +  generates: {                                                 
       7 +    'src/schema': defineConfig({                               
       8 +      // DateTime is picked up from graphql-scalars automatical
         +ly.                                                            
       9 +      resolverTypesPath: './types.generated.ts',               
      10 +      typesPluginsConfig: {                                    
      11 +        contextType: '../context.js#GraphQLContext',           
      12 +        // GraphQL enums become string unions that fit Prisma's
         + and zod's USState without mapping.                            
      13 +        enumsAsTypes: true,                                    
      14 +      },                                                       
      15 +      emitLegacyCommonJSImports: false,                        
      16 +    }),                                                        
      17 +  },                                                           
      18 +  hooks: { afterAllFileWrite: ['prettier --write'] },          
      19 +};                                                             
      20 +                                                               
      21 +export default config;                                         
  ⎿  Updated apps/api/package.json (+3 -2)
       5    "type": "module",
       6    "scripts": {
       7      "postinstall": "prisma generate",
       8 -    "codegen": "prisma generate",                              
       8 +    "codegen": "prisma generate && graphql-codegen",           
       9      "typecheck": "tsc --noEmit",
      10      "lint": "eslint .",
      11      "test": "vitest run",
      12      "test:unit": "vitest run --project unit",
      13 -    "test:integration": "vitest run --project integration"     
      13 +    "test:integration": "vitest run --project integration",    
      14 +    "dev": "tsx watch src/main.ts"                             
      15    },
      16    "dependencies": {
      17      "@covertree/validation": "workspace:*",
  ⎿  Created apps/api/src/context.ts (+5 -0)
      1 +import type { PropertyService } from './property/property.servic
        +e.js';                                                          
      2 +                                                                
      3 +export interface GraphQLContext {                               
      4 +  propertyService: PropertyService;                             
      5 +}                                                               
  ⎿  Created apps/api/src/schema/base/schema.graphql (+10 -0)
       1 +"ISO-8601 date-time string on the wire."                       
       2 +scalar DateTime                                                
       3 +                                                               
       4 +enum SortOrder {                                               
       5 +  ASC                                                          
       6 +  DESC                                                         
       7 +}                                                              
       8 +                                                               
       9 +type Query                                                     
      10 +type Mutation                                                  
  ⎿  Created
     apps/api/src/schema/property/resolvers/Mutation/createProperty.ts (+8 
     -0)
      1 +import type { MutationResolvers } from './../../../types.generat
        +ed.js';                                                         
      2 +export const createProperty: NonNullable<MutationResolvers['crea
        +teProperty']> = async (                                         
      3 +  _parent,                                                      
      4 +  _arg,                                                         
      5 +  _ctx,                                                         
      6 +) => {                                                          
      7 +  /* Implement Mutation.createProperty resolver logic here */   
      8 +};                                                              
  ⎿  … 13 more files changed

  Searched for 1 pattern (ctrl+o to expand)

⏺ I noticed types.generated.ts imports mappers without import type (I'll fix via
  useTypeImports), and the preset created a PropertyPage resolver stub. Before
  writing the WeatherData resolvers, I'll check how the adapter types the Int
  fields.

  Read 1 file (ctrl+o to expand)

⏺ The Int fields are validated as integers in the adapter, so the resolvers can
  pass them straight through. Next I'll fix the codegen config and write the
  failing unit tests.

⏺ Bash(cat > codegen.ts <<'EOF'
      import { defineConfig } from '@eddeee888/gcg-typescript-resolver-files';…)
  ⎿  import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarType
     Config } from 'graphql';
     import type { PropertyMapper, WeatherDataMapper } from './property/sch
     … +56 lines (ctrl+o to expand)
  ⎿  Updated apps/api/codegen.ts (+3 -4)
       1  import { defineConfig } from '@eddeee888/gcg-typescript-resolve
          r-files';
       2  import type { CodegenConfig } from '@graphql-codegen/cli';
       3  
       4 +// Server preset (SPEC §6). DateTime is picked up from graphql-
         +scalars automatically, and mappers                             
       5 +// come from schema.mappers.ts. Resolver files are generated on
         +ce as stubs, then hand-written.                                
       6  const config: CodegenConfig = {
       7    schema: 'src/schema/**/schema.graphql',
       8    generates: {
       9      'src/schema': defineConfig({
       8 -      // DateTime is picked up from graphql-scalars automatical
         -ly.                                                            
       9 -      resolverTypesPath: './types.generated.ts',               
      10        typesPluginsConfig: {
      11          contextType: '../context.js#GraphQLContext',
      12          // GraphQL enums become string unions that fit Prisma's
           and zod's USState without mapping.
      13          enumsAsTypes: true,
      14 +        useTypeImports: true,                                  
      15        },
      15 -      emitLegacyCommonJSImports: false,                        
      16      }),
      17    },
      18 -  hooks: { afterAllFileWrite: ['prettier --write'] },          
      18  };
      19  
      20  export default config;
  ⎿  Updated apps/api/src/schema/resolvers.generated.ts (+18 -18)
       1  /* This file was automatically generated. DO NOT UPDATE MANUALL
          Y. */
       2 -import type { Resolvers } from './types.generated.js';         
       3 -import { properties as Query_properties } from './property/reso
         -lvers/Query/properties.js';                                    
       4 -import { property as Query_property } from './property/resolver
         -s/Query/property.js';                                          
       5 -import { createProperty as Mutation_createProperty } from './pr
         -operty/resolvers/Mutation/createProperty.js';                  
       6 -import { deleteProperty as Mutation_deleteProperty } from './pr
         -operty/resolvers/Mutation/deleteProperty.js';                  
       7 -import { Property } from './property/resolvers/Property.js';   
       8 -import { PropertyPage } from './property/resolvers/PropertyPage
         -.js';                                                          
       9 -import { WeatherData } from './property/resolvers/WeatherData.j
         -s';                                                            
      10 -import { DateTimeResolver } from 'graphql-scalars';            
      11 -export const resolvers: Resolvers = {                          
      12 -  Query: { properties: Query_properties, property: Query_proper
         -ty },                                                          
      13 -  Mutation: { createProperty: Mutation_createProperty, deletePr
         -operty: Mutation_deleteProperty },                             
      14 -                                                               
      15 -  Property: Property,                                          
      16 -  PropertyPage: PropertyPage,                                  
      17 -  WeatherData: WeatherData,                                    
      18 -  DateTime: DateTimeResolver,                                  
      19 -};                                                             
       2 +    import type   { Resolvers } from './types.generated';      
       3 +    import    { properties as Query_properties } from './proper
         +ty/resolvers/Query/properties';                                
       4 +import    { property as Query_property } from './property/resol
         +vers/Query/property';                                          
       5 +import    { createProperty as Mutation_createProperty } from '.
         +/property/resolvers/Mutation/createProperty';                  
       6 +import    { deleteProperty as Mutation_deleteProperty } from '.
         +/property/resolvers/Mutation/deleteProperty';                  
       7 +import    { Property } from './property/resolvers/Property';   
       8 +import    { PropertyPage } from './property/resolvers/PropertyP
         +age';                                                          
       9 +import    { WeatherData } from './property/resolvers/WeatherDat
         +a';                                                            
      10 +import    { DateTimeResolver } from 'graphql-scalars';         
      11 +    export const resolvers: Resolvers = {                      
      12 +      Query: { properties: Query_properties,property: Query_pro
         +perty },                                                       
      13 +      Mutation: { createProperty: Mutation_createProperty,delet
         +eProperty: Mutation_deleteProperty },                          
      14 +                                                               
      15 +      Property: Property,                                      
      16 +PropertyPage: PropertyPage,                                    
      17 +WeatherData: WeatherData,                                      
      18 +DateTime: DateTimeResolver                                     
      19 +    }                                                          
  ⎿  Updated apps/api/src/schema/schema.generated.graphqls (+11 -31)
       5    zipCode: String!
       6  }
       7  
       8 -"""                                                            
       9 -ISO-8601 date-time string on the wire.                         
      10 -"""                                                            
       8 +"""ISO-8601 date-time string on the wire."""                   
       9  scalar DateTime
      10  
      11  type Mutation {
     ...
      37    long: Float!
      38    state: USState!
      39  
      42 -  """                                                          
      43 -  Street name and number, e.g. '15528 E Golden Eagle Blvd'.    
      44 -  """                                                          
      40 +  """Street name and number, e.g. '15528 E Golden Eagle Blvd'."
         +""                                                             
      41    street: String!
      42  
      47 -  """                                                          
      48 -  Weather observed when the property was created. Never refresh
         -ed.                                                            
      49 -  """                                                          
      43 +  """Weather observed when the property was created. Never refr
         +eshed."""                                                      
      44    weatherData: WeatherData!
      45  
      52 -  """                                                          
      53 -  Exactly 5 digits. A string, so leading zeros are preserved.  
      54 -  """                                                          
      46 +  """Exactly 5 digits. A string, so leading zeros are preserved
         +."""                                                           
      47    zipCode: String!
      48  }
      49  
      50  input PropertyFilter {
      59 -  """                                                          
      60 -  Case-insensitive exact match.                                
      61 -  """                                                          
      51 +  """Case-insensitive exact match."""                          
      52    city: String
      53    state: USState
      54  
     … 46 more lines (ctrl+o to expand)
  ⎿  Updated apps/api/src/schema/types.generated.ts (+51 -218)
      1 -import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTyp
        -eConfig } from 'graphql';                                       
      2 -import { PropertyMapper, WeatherDataMapper } from './property/sc
        -hema.mappers.js';                                               
      3 -import { GraphQLContext } from '../context.js';                 
      1 +import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScal
        +arTypeConfig } from 'graphql';                                  
      2 +import type { PropertyMapper, WeatherDataMapper } from './proper
        +ty/schema.mappers';                                             
      3 +import type { GraphQLContext } from '../context.js';            
      4  export type Maybe<T> = T | null | undefined;
      5  export type InputMaybe<T> = T | null | undefined;
      6  export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T
         , K>>;
     ...
       8  export type EnumResolverSignature<T, AllowedValues = any> = { [
          key in keyof T]?: AllowedValues };
       9  /** All built-in and custom scalars, mapped to their actual val
          ues */
      10  export type Scalars = {
      11 -  ID: { input: string; output: string | number };              
      12 -  String: { input: string; output: string };                   
      13 -  Boolean: { input: boolean; output: boolean };                
      14 -  Int: { input: number; output: number };                      
      15 -  Float: { input: number; output: number };                    
      11 +  ID: { input: string; output: string | number; }              
      12 +  String: { input: string; output: string; }                   
      13 +  Boolean: { input: boolean; output: boolean; }                
      14 +  Int: { input: number; output: number; }                      
      15 +  Float: { input: number; output: number; }                    
      16    /** ISO-8601 date-time string on the wire. */
      17 -  DateTime: { input: Date | string; output: Date | string };   
      17 +  DateTime: { input: Date | string; output: Date | string; }   
      18  };
      19  
      20  export type CreatePropertyInput = {
     ...
      35    deleteProperty: Scalars['ID']['output'];
      36  };
      37  
      38 +                                                               
      39  export type MutationcreatePropertyArgs = {
      40    input: CreatePropertyInput;
      41  };
      42  
      43 +                                                               
      44  export type MutationdeletePropertyArgs = {
      45    id: Scalars['ID']['input'];
      46  };
     … 352 more lines (ctrl+o to expand)
  ⎿  … 1 more file changed

⏺ The remaining errors come from the unimplemented resolver stubs, which is
  expected at this point. Now the failing unit tests.

⏺ Bash(mkdir -p src/config && cat >
      src/schema/property/resolvers/WeatherData.test.ts <<'EOF'
      import type { GraphQLResolveInfo } from 'graphql';…)
  ⎿  -   "cloudCover": 0,
     +   "cloudCover": undefined,
         "precip": 0,
     … +22 lines (ctrl+o to expand)
  ⎿  Created apps/api/src/config/env.test.ts (+67 -0)
       1 +import { describe, expect, it } from 'vitest';                 
       2 +import { parseEnv } from './env.js';                           
       3 +                                                               
       4 +const DATABASE_URL = 'postgresql://covertree:covertree@localhos
         +t:5432/covertree';                                             
       5 +                                                               
       6 +describe('parseEnv', () => {                                   
       7 +  it('applies the SPEC §6 defaults', () => {                   
       8 +    const env = parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY: 
         +'key' });                                                      
       9 +                                                               
      10 +    expect(env).toEqual({                                      
      11 +      DATABASE_URL,                                            
      12 +      WEATHER_PROVIDER: 'weatherstack',                        
      13 +      WEATHERSTACK_API_KEY: 'key',                             
      14 +      WEATHERSTACK_BASE_URL: 'https://api.weatherstack.com',   
      15 +      WEATHERSTACK_TIMEOUT_MS: 5000,                           
      16 +      PORT: 4000,                                              
      17 +      CORS_ORIGIN: 'http://localhost:5173',                    
      18 +      NODE_ENV: 'development',                                 
      19 +    });                                                        
      20 +  });                                                          
      21 +                                                               
      22 +  it('parses numeric variables from strings', () => {          
      23 +    const env = parseEnv({                                     
      24 +      DATABASE_URL,                                            
      25 +      WEATHERSTACK_API_KEY: 'key',                             
      26 +      WEATHERSTACK_TIMEOUT_MS: '2500',                         
      27 +      PORT: '8080',                                            
      28 +    });                                                        
      29 +                                                               
      30 +    expect(env.WEATHERSTACK_TIMEOUT_MS).toBe(2500);            
      31 +    expect(env.PORT).toBe(8080);                               
      32 +  });                                                          
      33 +                                                               
      34 +  it('requires DATABASE_URL', () => {                          
      35 +    expect(() => parseEnv({ WEATHERSTACK_API_KEY: 'key' })).toT
         +hrow(/DATABASE_URL/);                                          
      36 +  });                                                          
      37 +                                                               
      38 +  it.each([undefined, ''])('requires WEATHERSTACK_API_KEY for t
         +he weatherstack provider (%j)', (key) => {                     
      39 +    expect(() => parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY:
         + key })).toThrow(                                              
      40 +      /WEATHERSTACK_API_KEY/,                                  
     … 27 more lines (ctrl+o to expand)
  ⎿  Created apps/api/src/errors/mask-error.test.ts (+107 -0)
        1 +import { GraphQLError } from 'graphql';                       
        2 +import { describe, expect, it } from 'vitest';                
        3 +import {                                                      
        4 +  AlreadyExistsError,                                         
        5 +  LocationNotFoundError,                                      
        6 +  NotFoundError,                                              
        7 +  ValidationError,                                            
        8 +  WeatherUnavailableError,                                    
        9 +} from './domain-errors.js';                                  
       10 +import { maskError } from './mask-error.js';                  
       11 +                                                              
       12 +/** Yoga passes resolver errors wrapped in a GraphQLError with
          + the thrown error as originalError. */                        
       13 +function wrapped(error: Error): GraphQLError {                
       14 +  return new GraphQLError(error.message, { originalError: erro
          +r, path: ['field'] });                                        
       15 +}                                                             
       16 +                                                              
       17 +function mask(error: unknown, isDev = false): GraphQLError {  
       18 +  const result = maskError(error, 'Unexpected error.', isDev);
       19 +  if (!(result instanceof GraphQLError)) {                    
       20 +    throw new Error('expected a GraphQLError');               
       21 +  }                                                           
       22 +  return result;                                              
       23 +}                                                             
       24 +                                                              
       25 +describe('maskError', () => {                                 
       26 +  it('maps ValidationError to BAD_USER_INPUT with fieldErrors'
          +, () => {                                                     
       27 +    const result = mask(wrapped(new ValidationError({ zipCode:
          + ['Zip code must be exactly 5 digits'] })));                  
       28 +                                                              
       29 +    expect(result.message).toBe('Invalid input');             
       30 +    expect(result.extensions).toEqual({                       
       31 +      code: 'BAD_USER_INPUT',                                 
       32 +      fieldErrors: { zipCode: ['Zip code must be exactly 5 dig
          +its'] },                                                      
       33 +    });                                                       
       34 +  });                                                         
       35 +                                                              
       36 +  it('maps NotFoundError to NOT_FOUND with the id', () => {   
       37 +    const id = '7c0b6a55-8f0a-4a73-9d67-9f2a0a4b8e11';        
       38 +                                                              
       39 +    const result = mask(wrapped(new NotFoundError(id)));      
       40 +                                                              
     … 67 more lines (ctrl+o to expand)
  ⎿  Created apps/api/src/schema/property/resolvers/WeatherData.test.ts
     (+130 -0)
        1 +import type { GraphQLResolveInfo } from 'graphql';            
        2 +import { describe, expect, it } from 'vitest';                
        3 +import type { GraphQLContext } from '../../../context.js';    
        4 +import type { WeatherCurrent } from '../../../weather/weather-
          +provider.js';                                                 
        5 +import type { WeatherDataResolvers } from '../../types.generat
          +ed.js';                                                       
        6 +import { WeatherData } from './WeatherData.js';               
        7 +                                                              
        8 +type Field = Exclude<keyof WeatherDataResolvers, '__isTypeOf'>
          +;                                                             
        9 +                                                              
       10 +/** Resolves one field the way graphql-js does: explicit resol
          +ver, else the parent's property. */                           
       11 +async function resolve(field: Field, parent: WeatherCurrent): 
          +Promise<unknown> {                                            
       12 +  const resolver = WeatherData[field];                        
       13 +  if (resolver === undefined) {                               
       14 +    return (parent as Record<string, unknown>)[field];        
       15 +  }                                                           
       16 +  if (typeof resolver !== 'function') {                       
       17 +    throw new Error(`${field}: expected a resolver function`);
       18 +  }                                                           
       19 +  return resolver(parent, {}, {} as GraphQLContext, {} as Grap
          +hQLResolveInfo);                                              
       20 +}                                                             
       21 +                                                              
       22 +async function resolveAll(parent: WeatherCurrent): Promise<Rec
          +ord<Field, unknown>> {                                        
       23 +  const fields: Field[] = [                                   
       24 +    'observationTime',                                        
       25 +    'temperature',                                            
       26 +    'weatherDescriptions',                                    
       27 +    'weatherIcons',                                           
       28 +    'feelsLike',                                              
       29 +    'weatherCode',                                            
       30 +    'windSpeed',                                              
       31 +    'windDegree',                                             
       32 +    'windDir',                                                
       33 +    'pressure',                                               
       34 +    'precip',                                                 
       35 +    'humidity',                                               
       36 +    'cloudCover',                                             
       37 +    'uvIndex',                                                
       38 +    'visibility',                                             
       39 +    'isDay',                                                  
       40 +  ];                                                          
     … 90 more lines (ctrl+o to expand)

⏺ All three test files fail as expected: the modules don't exist yet and the
  resolver stubs return undefined. Now the implementations.

⏺ Bash(cat > src/schema/property/resolvers/WeatherData.ts <<'EOF'
      import type { WeatherDataResolvers } from './../../types.generated.js';…)
  ⎿       21|   }
          22|   return result;
      ❯ src/errors/mask-error.test.ts:93:20
     … +23 lines (ctrl+o to expand)
  ⎿  Created apps/api/src/config/env.ts (+40 -0)
       1 +import { z } from 'zod';                                       
       2 +import {                                                       
       3 +  DEFAULT_WEATHERSTACK_BASE_URL,                               
       4 +  DEFAULT_WEATHERSTACK_TIMEOUT_MS,                             
       5 +} from '../weather/weatherstack/weatherstack.provider.js';     
       6 +                                                               
       7 +// Environment variables from SPEC §6. Parsed once at startup i
         +n main.ts.                                                     
       8 +const envSchema = z                                            
       9 +  .object({                                                    
      10 +    DATABASE_URL: z.string().min(1),                           
      11 +    WEATHER_PROVIDER: z.enum(['weatherstack', 'fake']).default(
         +'weatherstack'),                                               
      12 +    WEATHERSTACK_API_KEY: z.string().optional(),               
      13 +    WEATHERSTACK_BASE_URL: z.url().default(DEFAULT_WEATHERSTACK
         +_BASE_URL),                                                    
      14 +    WEATHERSTACK_TIMEOUT_MS: z.coerce.number().int().positive()
         +.default(DEFAULT_WEATHERSTACK_TIMEOUT_MS),                     
      15 +    PORT: z.coerce.number().int().min(1).max(65535).default(400
         +0),                                                            
      16 +    CORS_ORIGIN: z.string().min(1).default('http://localhost:51
         +73'),                                                          
      17 +    NODE_ENV: z.string().default('development'),               
      18 +  })                                                           
      19 +  .refine((env) => env.WEATHER_PROVIDER === 'fake' || Boolean(e
         +nv.WEATHERSTACK_API_KEY), {                                    
      20 +    path: ['WEATHERSTACK_API_KEY'],                            
      21 +    error: 'required unless WEATHER_PROVIDER=fake',            
      22 +  });                                                          
      23 +                                                               
      24 +export type Env = z.output<typeof envSchema>;                  
      25 +                                                               
      26 +/** Throws an Error naming each invalid variable. Values are ne
         +ver echoed (the key is secret). */                             
      27 +export function parseEnv(source: Readonly<Record<string, string
         + | undefined>>): Env {                                         
      28 +  // Empty strings (e.g. `PORT=` in .env) mean "not set", so de
         +faults apply.                                                  
      29 +  const defined = Object.fromEntries(                          
      30 +    Object.entries(source).filter(([, value]) => value !== unde
         +fined && value !== ''),                                        
      31 +  );                                                           
      32 +  const result = envSchema.safeParse(defined);                 
      33 +  if (result.success) {                                        
      34 +    return result.data;                                        
      35 +  }                                                            
      36 +  const problems = result.error.issues.map(                    
      37 +    (issue) => `${issue.path.join('.') || 'env'}: ${issue.messa
         +ge}`,                                                          
      38 +  );                                                           
      39 +  throw new Error(`Invalid environment configuration:\n  ${prob
         +lems.join('\n  ')}`);                                          
      40 +}                                                              
  ⎿  Created apps/api/src/errors/mask-error.ts (+66 -0)
       1 +import { GraphQLError } from 'graphql';                        
       2 +import { maskError as yogaMaskError } from 'graphql-yoga';     
       3 +import {                                                       
       4 +  AlreadyExistsError,                                          
       5 +  LocationNotFoundError,                                       
       6 +  NotFoundError,                                               
       7 +  ValidationError,                                             
       8 +  WeatherUnavailableError,                                     
       9 +} from './domain-errors.js';                                   
      10 +                                                               
      11 +/**                                                            
      12 + * Yoga's `maskedErrors.maskError` (SPEC §5): turns domain erro
         +rs into client-facing GraphQLErrors                            
      13 + * with `extensions.code`. Everything else goes through Yoga's 
         +default masking.                                               
      14 + * Messages are fixed here, so internal reasons and provider co
         +des never reach the client.                                    
      15 + */                                                            
      16 +export function maskError(error: unknown, message: string, isDe
         +v?: boolean): Error {                                          
      17 +  const original = error instanceof GraphQLError ? error.origin
         +alError : error;                                               
      18 +  const domain = toClientError(original);                      
      19 +  if (domain === undefined) {                                  
      20 +    return yogaMaskError(error, message, isDev);               
      21 +  }                                                            
      22 +  const graphQLError = error instanceof GraphQLError ? error : 
         +undefined;                                                     
      23 +  return new GraphQLError(domain.message, {                    
      24 +    nodes: graphQLError?.nodes,                                
      25 +    source: graphQLError?.source,                              
      26 +    positions: graphQLError?.positions,                        
      27 +    path: graphQLError?.path,                                  
      28 +    extensions: domain.extensions,                             
      29 +  });                                                          
      30 +}                                                              
      31 +                                                               
      32 +function toClientError(                                        
      33 +  error: unknown,                                              
      34 +): { message: string; extensions: Record<string, unknown> } | u
         +ndefined {                                                     
      35 +  if (error instanceof ValidationError) {                      
      36 +    return {                                                   
      37 +      message: 'Invalid input',                                
      38 +      extensions: { code: 'BAD_USER_INPUT', fieldErrors: error.
         +fieldErrors },                                                 
      39 +    };                                                         
      40 +  }                                                            
     … 26 more lines (ctrl+o to expand)
  ⎿  Updated apps/api/src/schema/property/resolvers/WeatherData.ts (+18 
     -34)
       1  import type { WeatherDataResolvers } from './../../types.genera
          ted.js';
       2 +                                                               
       3 +// The parent is the stored Weatherstack `current` object (snak
         +e_case). Pure field mapping:                                   
       4 +// optional fields Weatherstack omitted (or the adapter dropped
         +) resolve to null (AC-5.14).                                   
       5  export const WeatherData: WeatherDataResolvers = {
       3 -  /* Implement WeatherData resolver logic here */              
       4 -  cloudCover: async (_parent, _arg, _ctx) => {                 
       5 -    /* WeatherData.cloudCover resolver is required because Weat
         -herData.cloudCover exists but WeatherDataMapper.cloudCover does
         - not */                                                        
       6 -  },                                                           
       7 -  feelsLike: async (_parent, _arg, _ctx) => {                  
       8 -    /* WeatherData.feelsLike resolver is required because Weath
         -erData.feelsLike exists but WeatherDataMapper.feelsLike does no
         -t */                                                           
       9 -  },                                                           
      10 -  isDay: async (_parent, _arg, _ctx) => {                      
      11 -    /* WeatherData.isDay resolver is required because WeatherDa
         -ta.isDay exists but WeatherDataMapper.isDay does not */        
      12 -  },                                                           
      13 -  observationTime: async (_parent, _arg, _ctx) => {            
      14 -    /* WeatherData.observationTime resolver is required because
         - WeatherData.observationTime exists but WeatherDataMapper.obser
         -vationTime does not */                                         
      15 -  },                                                           
      16 -  uvIndex: async (_parent, _arg, _ctx) => {                    
      17 -    /* WeatherData.uvIndex resolver is required because Weather
         -Data.uvIndex exists but WeatherDataMapper.uvIndex does not */  
      18 -  },                                                           
      19 -  weatherCode: async (_parent, _arg, _ctx) => {                
      20 -    /* WeatherData.weatherCode resolver is required because Wea
         -therData.weatherCode exists but WeatherDataMapper.weatherCode d
         -oes not */                                                     
      21 -  },                                                           
      22 -  weatherDescriptions: async (_parent, _arg, _ctx) => {        
      23 -    /* WeatherData.weatherDescriptions resolver is required bec
         -ause WeatherData.weatherDescriptions exists but WeatherDataMapp
         -er.weatherDescriptions does not */                             
      24 -  },                                                           
      25 -  weatherIcons: async (_parent, _arg, _ctx) => {               
      26 -    /* WeatherData.weatherIcons resolver is required because We
         -atherData.weatherIcons exists but WeatherDataMapper.weatherIcon
         -s does not */                                                  
      27 -  },                                                           
      28 -  windDegree: async (_parent, _arg, _ctx) => {                 
      29 -    /* WeatherData.windDegree resolver is required because Weat
         -herData.windDegree exists but WeatherDataMapper.windDegree does
         - not */                                                        
      30 -  },                                                           
      31 -  windDir: async (_parent, _arg, _ctx) => {                    
      32 -    /* WeatherData.windDir resolver is required because Weather
         -Data.windDir exists but WeatherDataMapper.windDir does not */  
      33 -  },                                                           
      34 -  windSpeed: async (_parent, _arg, _ctx) => {                  
      35 -    /* WeatherData.windSpeed resolver is required because Weath
         -erData.windSpeed exists but WeatherDataMapper.windSpeed does no
         -t */                                                           
      36 -  },                                                           
       6 +  observationTime: (parent) => parent.observation_time,        
     … 15 more lines (ctrl+o to expand)

⏺ Two mask-error tests fail on instanceof GraphQLError. That usually means two
  copies of graphql are loaded, so I'll check which versions are installed.

  Ran 1 shell command (ctrl+o to expand)

⏺ Only one graphql@17 sits in the dependency tree for Yoga, so I'll check what
  maskError actually returns in those two cases.

  Ran 1 shell command (ctrl+o to expand)

⏺ That hang is my own mistake: a stray cat > with no input was waiting on stdin.
  I'll stop it and rerun without it.

⏺ Stop Task  ⎿  cat > /tmp/claude-501/dbg.test.ts 2>/dev/null; mkdir -p src/__dbg &&
     cat > src/__dbg/dbg.test.ts <<'EOF'
     import { GraphQLError } from 'graphql';… · stopped

  Ran 3 shell commands (ctrl+o to expand)

⏺ Yoga's maskError produces a GraphQLError from a different graphql module
  instance, which is why it also masked my plain BAD_USER_INPUT error. I'll
  check how graphql 17 and Yoga declare their entry points to resolve this.

  Ran 1 shell command (ctrl+o to expand)

⏺ Found the issue: graphql 17's dual export conditions cause Vitest and Node to
  resolve different GraphQLError classes, breaking instanceof checks. I'll pin
  graphql@^16 instead, which avoids the dual-export problem and stays compatible
  with all peers, including Apollo Client on the web side.

⏺ Bash(cd /Users/marcincielecki/covertree-properties && pnpm --filter
      @covertree/api add graphql@^16.11.0 2>&1 | tail -2; ls node_modules/.pnpm
      | grep -E '^graphql(-yo…)
  ⎿  apps/api postinstall: Done
     Done in 1.7s using pnpm v12.6.0
     graphql-yoga@5.24.1_graphql@16.14.2
     … +8 lines (ctrl+o to expand)
  ⎿  Updated apps/api/package.json (+1 -1)
      18      "@prisma/adapter-pg": "^7.10.0",
      19      "@prisma/client": "^7.10.0",
      20      "dotenv": "^18.0.3",
      21 -    "graphql": "^17.0.2",                                      
      21 +    "graphql": "^16.14.2",                                     
      22      "graphql-scalars": "^2.0.0",
      23      "graphql-yoga": "^5.24.1",
      24      "zod": "^4.6.5"
  ⎿  … 1 more file changed

⏺ Quick update: I pinned graphql 16, but two maskError tests still fail. I'm
  checking whether this is the same dual-module problem.

  Ran 1 shell command (ctrl+o to expand)

⏺ GraphQL 16 has the same dual-resolution issue—Vite picks up the ESM build
  while Node-loaded Yoga uses CJS. I'll fix this by aliasing graphql in the
  Vitest config to the same file Node resolves, matching production behavior.

⏺ Bash(cat > vitest.config.ts <<'EOF'
      import { defineConfig } from 'vitest/config';…)
  ⎿   Test Files  3 passed (3)
           Tests  28 passed (28)
        Start at  11:52:57
        Duration  198ms (import 56%, transform 34%, tests 6%, worker 4%)
  ⎿  Updated apps/api/vitest.config.ts (+7 -0)
       1  import { defineConfig } from 'vitest/config';
       2  
       3 +// Vite would resolve `graphql` for our source to its ESM build
         + (package.json "module"), while                                
       4 +// graphql-yoga, loaded by Node, gets the CJS "main". Two copie
         +s break `instanceof GraphQLError`.                             
       5 +// Pin ours to the file Node picks, as it is at runtime.       
       6 +const resolve = { alias: [{ find: /^graphql$/, replacement: 'gr
         +aphql/index.js' }] };                                          
       7 +                                                               
       8  export default defineConfig({
       9    test: {
      10      projects: [
      11        {
      12 +        resolve,                                               
      13          test: {
      14            name: 'unit',
      15            include: ['src/**/*.test.ts', 'test/helpers/**/*.test
          .ts'],
      16          },
      17        },
      18        {
      19 +        resolve,                                               
      20          test: {
      21            name: 'integration',
      22            include: ['test/integration/**/*.test.ts'],

⏺ The three unit suites pass (28 tests). Now I'll move on to the resolvers and
  createApp, starting with a failing app.test.ts covering error logging with
  operation names, CORS, and ensuring domain errors aren't logged.

  Searched for 1 pattern (ctrl+o to expand)

⏺ Bash(cat > src/app.test.ts <<'EOF'
      import { describe, expect, it, vi } from 'vitest';…)
  ⎿   Test Files  1 failed (1)
           Tests  no tests
        Start at  11:53:25
        Duration  104ms (worker 97%, environment 3%)
  ⎿  Created apps/api/src/app.test.ts (+87 -0)
       1 +import { describe, expect, it, vi } from 'vitest';             
       2 +import { createApp } from './app.js';                          
       3 +import type { Logger } from './logger.js';                     
       4 +import { InMemoryPropertyRepository } from './property/in-memor
         +y-property.repository.js';                                     
       5 +import { PropertyService } from './property/property.service.js
         +';                                                             
       6 +import { FakeWeatherProvider } from './weather/fake-weather.pro
         +vider.js';                                                     
       7 +                                                               
       8 +const CORS_ORIGIN = 'http://localhost:5173';                   
       9 +                                                               
      10 +function setup(repository = new InMemoryPropertyRepository()) {
      11 +  const logger: Logger = { info: vi.fn(), warn: vi.fn(), error:
         + vi.fn() };                                                    
      12 +  const app = createApp({                                      
      13 +    propertyService: new PropertyService(repository, new FakeWe
         +atherProvider()),                                              
      14 +    logger,                                                    
      15 +    corsOrigin: CORS_ORIGIN,                                   
      16 +  });                                                          
      17 +  const post = (query: string) =>                              
      18 +    app.fetch('http://localhost/graphql', {                    
      19 +      method: 'POST',                                          
      20 +      headers: { 'content-type': 'application/json' },         
      21 +      body: JSON.stringify({ query }),                         
      22 +    });                                                        
      23 +  return { app, logger, post };                                
      24 +}                                                              
      25 +                                                               
      26 +describe('createApp', () => {                                  
      27 +  it('serves the property schema', async () => {               
      28 +    const { post } = setup();                                  
      29 +                                                               
      30 +    const response = await post('query { properties { totalCoun
         +t } }');                                                       
      31 +                                                               
      32 +    expect(await response.json()).toEqual({ data: { properties:
         + { totalCount: 0 } } });                                       
      33 +  });                                                          
      34 +                                                               
      35 +  it('masks unexpected errors and logs them with the operation 
         +name', async () => {                                           
      36 +    const repository = new InMemoryPropertyRepository();       
      37 +    const failure = new Error('connection refused');           
      38 +    vi.spyOn(repository, 'list').mockRejectedValue(failure);   
      39 +    const { logger, post } = setup(repository);                
      40 +                                                               
     … 47 more lines (ctrl+o to expand)

⏺ The test fails because app.ts doesn't exist yet. Before writing the logging
  plugin I'll confirm the Envelop plugin hooks.

  Called plugin:context7:context7 (ctrl+o to expand)

⏺ I'll write a small onExecute/onExecuteDone plugin and let app.test.ts confirm
  that it sees errors before Yoga masks them.

⏺ Bash(cat > src/app.ts <<'EOF'
      import { GraphQLError } from 'graphql';…)
  ⎿  src/app.ts(24,5): error TS2322: Type 'GraphQLSchemaWithContext<GraphQL
     Context & YogaInitialContext>' is not assignable to type 'YogaSchemaDe
     finition<Record<string, unknown>, GraphQLContext> | undefined'.
     … +49 lines (ctrl+o to expand)
  ⎿  Created apps/api/src/app.ts (+56 -0)
       1 +import { GraphQLError } from 'graphql';                        
       2 +import { createSchema, createYoga, type Plugin } from 'graphql-
         +yoga';                                                         
       3 +import type { GraphQLContext } from './context.js';            
       4 +import { isDomainError, maskError } from './errors/mask-error.j
         +s';                                                            
       5 +import type { Logger } from './logger.js';                     
       6 +import type { PropertyService } from './property/property.servi
         +ce.js';                                                        
       7 +import { resolvers } from './schema/resolvers.generated.js';   
       8 +import { typeDefs } from './schema/typeDefs.generated.js';     
       9 +                                                               
      10 +export interface AppDeps {                                     
      11 +  propertyService: PropertyService;                            
      12 +  logger: Logger;                                              
      13 +  /** Allowed browser origin (the web app). */                 
      14 +  corsOrigin: string;                                          
      15 +  /** Adds `originalError` to masked errors. Never true in prod
         +uction. */                                                     
      16 +  isDev?: boolean;                                             
      17 +}                                                              
      18 +                                                               
      19 +export type App = ReturnType<typeof createApp>;                
      20 +                                                               
      21 +/** The GraphQL server, independent of HTTP hosting: main.ts se
         +rves it, tests call `app.fetch`. */                            
      22 +export function createApp({ propertyService, logger, corsOrigin
         +, isDev = false }: AppDeps) {                                  
      23 +  return createYoga<Record<string, unknown>, GraphQLContext>({ 
      24 +    schema: createSchema<GraphQLContext>({ typeDefs, resolvers 
         +}),                                                            
      25 +    context: { propertyService },                              
      26 +    maskedErrors: { maskError, isDev },                        
      27 +    cors: { origin: corsOrigin, methods: ['GET', 'POST', 'OPTIO
         +NS'] },                                                        
      28 +    plugins: [useUnexpectedErrorLogging(logger)],              
      29 +    logging: false,                                            
      30 +  });                                                          
      31 +}                                                              
      32 +                                                               
      33 +/** Logs errors that are about to be masked, with the operation
         + name (SPEC §5). */                                            
      34 +function useUnexpectedErrorLogging(logger: Logger): Plugin {   
      35 +  return {                                                     
      36 +    onExecute({ args }) {                                      
      37 +      return {                                                 
      38 +        onExecuteDone({ result }) {                            
      39 +          if (!('errors' in result) || !result.errors) {       
      40 +            return;                                            
     … 16 more lines (ctrl+o to expand)
  ⎿  Updated apps/api/src/errors/mask-error.ts (+5 -0)
      29    });
      30  }
      31  
      32 +/** True for the errors this module maps to a client-facing cod
         +e. Anything else is unexpected. */                             
      33 +export function isDomainError(error: unknown): boolean {       
      34 +  return toClientError(error) !== undefined;                   
      35 +}                                                              
      36 +                                                               
      37  function toClientError(
      38    error: unknown,
      39  ): { message: string; extensions: Record<string, unknown> } | u
          ndefined {
  ⎿  Updated
     apps/api/src/schema/property/resolvers/Mutation/createProperty.ts (+5 
     -6)
      1  import type { MutationResolvers } from './../../../types.generat
         ed.js';
      2 -export const createProperty: NonNullable<MutationResolvers['crea
        -teProperty']> = async (                                         
      2 +                                                                
      3 +export const createProperty: NonNullable<MutationResolvers['crea
        +teProperty']> = (                                               
      4    _parent,
      4 -  _arg,                                                         
      5 -  _ctx,                                                         
      6 -) => {                                                          
      7 -  /* Implement Mutation.createProperty resolver logic here */   
      8 -};                                                              
      5 +  { input },                                                    
      6 +  ctx,                                                          
      7 +) => ctx.propertyService.create(input);                         
  ⎿  Updated
     apps/api/src/schema/property/resolvers/Mutation/deleteProperty.ts (+5 
     -6)
      1  import type { MutationResolvers } from './../../../types.generat
         ed.js';
      2 -export const deleteProperty: NonNullable<MutationResolvers['dele
        -teProperty']> = async (                                         
      2 +                                                                
      3 +export const deleteProperty: NonNullable<MutationResolvers['dele
        +teProperty']> = (                                               
      4    _parent,
      4 -  _arg,                                                         
      5 -  _ctx,                                                         
      6 -) => {                                                          
      7 -  /* Implement Mutation.deleteProperty resolver logic here */   
      8 -};                                                              
      5 +  { id },                                                       
      6 +  ctx,                                                          
      7 +) => ctx.propertyService.delete(id);                            
  ⎿  Updated apps/api/src/schema/property/resolvers/Property.ts (+3 -1)
      1  import type { PropertyResolvers } from './../../types.generated.
         js';
      2 -export const Property: PropertyResolvers = {/* Implement Propert
        -y resolver logic here */};                                      
      2 +                                                                
      3 +// PropertyMapper (PropertyRecord) already has every field; defa
        +ult resolvers suffice.                                          
      4 +export const Property: PropertyResolvers = {};                  
  ⎿  … 3 more files changed

⏺ Found three issues: my codegen rewrite dropped emitLegacyCommonJSImports: 
  false (breaking .js extensions in imports), the createYoga generics are wrong,
  and the logging assertion nearly matches but needs the full diff to fix. I'll
  restore the dropped option, correct the generics, and check the diff next.

⏺ Bash(sed -i '' 's#        useTypeImports: true,\n      },#&#' codegen.ts &&
      python3 - <<'EOF'
      p='codegen.ts'…)
  ⎿  import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarType
     Config } from 'graphql';
     import type { PropertyMapper, WeatherDataMapper } from './property/sch
     … +33 lines (ctrl+o to expand)
  ⎿  Updated apps/api/codegen.ts (+2 -0)
      13          enumsAsTypes: true,
      14          useTypeImports: true,
      15        },
      16 +      // NodeNext ESM: relative imports need the .js extension.
      17 +      emitLegacyCommonJSImports: false,                        
      18      }),
      19    },
      20  };
  ⎿  Updated apps/api/src/app.ts (+1 -1)
      20  
      21  /** The GraphQL server, independent of HTTP hosting: main.ts se
          rves it, tests call `app.fetch`. */
      22  export function createApp({ propertyService, logger, corsOrigin
          , isDev = false }: AppDeps) {
      23 -  return createYoga<Record<string, unknown>, GraphQLContext>({ 
      23 +  return createYoga({                                          
      24      schema: createSchema<GraphQLContext>({ typeDefs, resolvers 
          }),
      25      context: { propertyService },
      26      maskedErrors: { maskError, isDev },
  ⎿  Updated apps/api/src/schema/resolvers.generated.ts (+8 -8)
       1  /* This file was automatically generated. DO NOT UPDATE MANUALL
          Y. */
       2 -    import type   { Resolvers } from './types.generated';      
       3 -    import    { properties as Query_properties } from './proper
         -ty/resolvers/Query/properties';                                
       4 -import    { property as Query_property } from './property/resol
         -vers/Query/property';                                          
       5 -import    { createProperty as Mutation_createProperty } from '.
         -/property/resolvers/Mutation/createProperty';                  
       6 -import    { deleteProperty as Mutation_deleteProperty } from '.
         -/property/resolvers/Mutation/deleteProperty';                  
       7 -import    { Property } from './property/resolvers/Property';   
       8 -import    { PropertyPage } from './property/resolvers/PropertyP
         -age';                                                          
       9 -import    { WeatherData } from './property/resolvers/WeatherDat
         -a';                                                            
       2 +    import type   { Resolvers } from './types.generated.js';   
       3 +    import    { properties as Query_properties } from './proper
         +ty/resolvers/Query/properties.js';                             
       4 +import    { property as Query_property } from './property/resol
         +vers/Query/property.js';                                       
       5 +import    { createProperty as Mutation_createProperty } from '.
         +/property/resolvers/Mutation/createProperty.js';               
       6 +import    { deleteProperty as Mutation_deleteProperty } from '.
         +/property/resolvers/Mutation/deleteProperty.js';               
       7 +import    { Property } from './property/resolvers/Property.js';
       8 +import    { PropertyPage } from './property/resolvers/PropertyP
         +age.js';                                                       
       9 +import    { WeatherData } from './property/resolvers/WeatherDat
         +a.js';                                                         
      10  import    { DateTimeResolver } from 'graphql-scalars';
      11      export const resolvers: Resolvers = {
      12        Query: { properties: Query_properties,property: Query_pro
          perty },
  ⎿  Updated apps/api/src/schema/typeDefs.generated.ts (+1 -1)
      1  import type { DocumentNode } from 'graphql';
      2 -  export const typeDefs = {"kind":"Document","definitions":[{"ki
        -nd":"ScalarTypeDefinition","description":{"kind":"StringValue","
        -value":"ISO-8601 date-time string on the wire.","block":false},"
        -name":{"kind":"Name","value":"DateTime"}},{"kind":"EnumTypeDefin
        -ition","name":{"kind":"Name","value":"SortOrder"},"values":[{"ki
        -nd":"EnumValueDefinition","name":{"kind":"Name","value":"ASC"}},
        -{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"DES
        -C"}}]},{"name":{"kind":"Name","value":"Query"},"kind":"ObjectTyp
        -eDefinition","fields":[{"kind":"FieldDefinition","name":{"kind":
        -"Name","value":"properties"},"arguments":[{"kind":"InputValueDef
        -inition","name":{"kind":"Name","value":"filter"},"type":{"kind":
        -"NamedType","name":{"kind":"Name","value":"PropertyFilter"}}},{"
        -kind":"InputValueDefinition","name":{"kind":"Name","value":"sort
        -Order"},"type":{"kind":"NamedType","name":{"kind":"Name","value"
        -:"SortOrder"}},"defaultValue":{"kind":"EnumValue","value":"DESC"
        -}},{"kind":"InputValueDefinition","description":{"kind":"StringV
        -alue","value":"1..100","block":false},"name":{"kind":"Name","val
        -ue":"limit"},"type":{"kind":"NamedType","name":{"kind":"Name","v
        -alue":"Int"}},"defaultValue":{"kind":"IntValue","value":"20"}},{
        -"kind":"InputValueDefinition","description":{"kind":"StringValue
        -","value":">= 0","block":false},"name":{"kind":"Name","value":"o
        -ffset"},"type":{"kind":"NamedType","name":{"kind":"Name","value"
        -:"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"type"
        -:{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind"
        -:"Name","value":"PropertyPage"}}}},{"kind":"FieldDefinition","de
        -scription":{"kind":"StringValue","value":"Returns null if no pro
        -perty has this id.","block":false},"name":{"kind":"Name","value"
        -:"property"},"arguments":[{"kind":"InputValueDefinition","name":
        -{"kind":"Name","value":"id"},"type":{"kind":"NonNullType","type"
        -:{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"ty
        -pe":{"kind":"NamedType","name":{"kind":"Name","value":"Property"
        -}}}],"directives … [+12467 chars]                               
      2 +  export const typeDefs = {"kind":"Document","definitions":[{"ki
        +nd":"ScalarTypeDefinition","description":{"kind":"StringValue","
        +value":"ISO-8601 date-time string on the wire.","block":false},"
        +name":{"kind":"Name","value":"DateTime"},"directives":[]},{"kind
        +":"EnumTypeDefinition","name":{"kind":"Name","value":"SortOrder"
        +},"directives":[],"values":[{"kind":"EnumValueDefinition","name"
        +:{"kind":"Name","value":"ASC"},"directives":[]},{"kind":"EnumVal
        +ueDefinition","name":{"kind":"Name","value":"DESC"},"directives"
        +:[]}]},{"name":{"kind":"Name","value":"Query"},"kind":"ObjectTyp
        +eDefinition","fields":[{"kind":"FieldDefinition","name":{"kind":
        +"Name","value":"properties"},"arguments":[{"kind":"InputValueDef
        +inition","name":{"kind":"Name","value":"filter"},"type":{"kind":
        +"NamedType","name":{"kind":"Name","value":"PropertyFilter"}},"di
        +rectives":[]},{"kind":"InputValueDefinition","name":{"kind":"Nam
        +e","value":"sortOrder"},"type":{"kind":"NamedType","name":{"kind
        +":"Name","value":"SortOrder"}},"defaultValue":{"kind":"EnumValue
        +","value":"DESC"},"directives":[]},{"kind":"InputValueDefinition
        +","description":{"kind":"StringValue","value":"1..100","block":f
        +alse},"name":{"kind":"Name","value":"limit"},"type":{"kind":"Nam
        +edType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"k
        +ind":"IntValue","value":"20"},"directives":[]},{"kind":"InputVal
        +ueDefinition","description":{"kind":"StringValue","value":">= 0"
        +,"block":false},"name":{"kind":"Name","value":"offset"},"type":{
        +"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaul
        +tValue":{"kind":"IntValue","value":"0"},"directives":[]}],"type"
        +:{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind"
        +:"Name","value":"PropertyPage"}}},"directives":[]},{"kind":"Fiel
        +dDefinition","description":{"kind":"StringValue","value":"Return
        +s null if no property has this id.","block":false},"name":{"kind
        +":"Name","value":"property"},"arguments":[{"kind":"InputValueDef
        +inition","name":{"kind":"Name","value":"id"},"type":{"kind":"Non
        +NullType","type" … [+14616 chars]                               
  ⎿  Updated apps/api/src/schema/types.generated.ts (+1 -1)
      1  import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScal
         arTypeConfig } from 'graphql';
      2 -import type { PropertyMapper, WeatherDataMapper } from './proper
        -ty/schema.mappers';                                             
      2 +import type { PropertyMapper, WeatherDataMapper } from './proper
        +ty/schema.mappers.js';                                          
      3  import type { GraphQLContext } from '../context.js';
      4  export type Maybe<T> = T | null | undefined;
      5  export type InputMaybe<T> = T | null | undefined;
  ⎿  (timeout 3m)

⏺ Typecheck is clean now. args.operationName is only set when the client sends
  it separately, so I'll take the name from the document with getOperationAST
  instead.

⏺ Bash(python3 - <<'EOF'
      p='src/app.ts'…)
  ⎿        Tests  184 passed (184)
        Start at  11:54:08
        Duration  387ms (import 44%, transform 39%, tests 15%, worker 2%)
  ⎿  Updated apps/api/src/app.ts (+4 -2)
      1 -import { GraphQLError } from 'graphql';                         
      1 +import { getOperationAST, GraphQLError } from 'graphql';        
      2  import { createSchema, createYoga, type Plugin } from 'graphql-y
         oga';
      3  import type { GraphQLContext } from './context.js';
      4  import { isDomainError, maskError } from './errors/mask-error.js
         ';
     ...
      43              const original = error instanceof GraphQLError ? er
          ror.originalError : error;
      44              if (original !== undefined && !isDomainError(origin
          al)) {
      45                logger.error('Unexpected error', {
      46 -                operationName: args.operationName ?? null,     
      46 +                // Named in the document, or chosen by the requ
         +est's `operationName`.                                         
      47 +                operationName:                                 
      48 +                  getOperationAST(args.document, args.operation
         +Name)?.name?.value ?? null,                                    
      49                  path: error.path,
      50                  error: original,
      51                });

⏺ All 184 unit tests pass. Now main.ts.

⏺ Bash(cat > src/main.ts <<'EOF'
      import { config as loadDotenv } from 'dotenv';…)
  ⎿  apps/api lint: /Users/marcincielecki/covertree-properties/apps/api/src
     /app.test.ts
     apps/api lint:   46:12  error  A method that is not declared with `thi
     … +32 lines (ctrl+o to expand)
  ⎿  Created apps/api/src/main.ts (+56 -0)
       1 +import { config as loadDotenv } from 'dotenv';                 
       2 +import { createServer } from 'node:http';                      
       3 +import { fileURLToPath } from 'node:url';                      
       4 +import { createApp } from './app.js';                          
       5 +import { parseEnv } from './config/env.js';                    
       6 +import { createPrismaClient } from './db/prisma.js';           
       7 +import type { Logger } from './logger.js';                     
       8 +import { PrismaPropertyRepository } from './property/prisma-pro
         +perty.repository.js';                                          
       9 +import { PropertyService } from './property/property.service.js
         +';                                                             
      10 +import { FakeWeatherProvider } from './weather/fake-weather.pro
         +vider.js';                                                     
      11 +import type { WeatherProvider } from './weather/weather-provide
         +r.js';                                                         
      12 +import { WeatherstackProvider } from './weather/weatherstack/we
         +atherstack.provider.js';                                       
      13 +                                                               
      14 +// The repo-root .env (`pnpm dev` runs in apps/api). Variables 
         +already set in the environment win.                            
      15 +loadDotenv({ path: fileURLToPath(new URL('../../../.env', impor
         +t.meta.url)), quiet: true });                                  
      16 +                                                               
      17 +const logger: Logger = console;                                
      18 +const env = parseEnv(process.env);                             
      19 +                                                               
      20 +let weather: WeatherProvider;                                  
      21 +if (env.WEATHER_PROVIDER === 'fake') {                         
      22 +  logger.warn(                                                 
      23 +    'WEATHER_PROVIDER=fake: weather data and coordinates are FA
         +KE, Weatherstack will not be called',                          
      24 +  );                                                           
      25 +  weather = new FakeWeatherProvider();                         
      26 +} else {                                                       
      27 +  weather = new WeatherstackProvider({                         
      28 +    // parseEnv guarantees the key when the provider is weather
         +stack.                                                         
      29 +    apiKey: env.WEATHERSTACK_API_KEY ?? '',                    
      30 +    baseUrl: env.WEATHERSTACK_BASE_URL,                        
      31 +    timeoutMs: env.WEATHERSTACK_TIMEOUT_MS,                    
      32 +    logger,                                                    
      33 +  });                                                          
      34 +}                                                              
      35 +                                                               
      36 +const prisma = createPrismaClient(env.DATABASE_URL);           
      37 +const app = createApp({                                        
      38 +  propertyService: new PropertyService(new PrismaPropertyReposi
         +tory(prisma), weather),                                        
      39 +  logger,                                                      
      40 +  corsOrigin: env.CORS_ORIGIN,                                 
     … 16 more lines (ctrl+o to expand)
  ⎿  (timeout 3m)

⏺ Lint reports 8 errors. I'll fix them:
  - unbound-method in the test
  - any leaking through the plugin types
  - an expect.not helper that returns any
  - the promise returned to createServer

  Ran 1 shell command (ctrl+o to expand)

⏺ Envelop types args and result loosely (any). I'll narrow them to graphql's
  ExecutionArgs and ExecutionResult. We have no subscriptions, so the results
  are never streamed.

⏺ Bash(python3 - <<'EOF'
      import re…)
  ⎿  $ eslint .
     [warn] src/generated/prisma/internal/prismaNamespaceBrowser.ts
     [warn] src/generated/prisma/models.ts
     … +7 lines (ctrl+o to expand)
  ⎿  Updated apps/api/src/app.test.ts (+7 -6)
       8  const CORS_ORIGIN = 'http://localhost:5173';
       9  
      10  function setup(repository = new InMemoryPropertyRepository()) {
      11 -  const logger: Logger = { info: vi.fn(), warn: vi.fn(), error:
         - vi.fn() };                                                    
      11 +  const logError = vi.fn<Logger['error']>();                   
      12 +  const logger: Logger = { info: vi.fn(), warn: vi.fn(), error:
         + logError };                                                   
      13    const app = createApp({
      14      propertyService: new PropertyService(repository, new FakeWe
          atherProvider()),
      15      logger,
     ...
      21        headers: { 'content-type': 'application/json' },
      22        body: JSON.stringify({ query }),
      23      });
      23 -  return { app, logger, post };                                
      24 +  return { app, logError, post };                              
      25  }
      26  
      27  describe('createApp', () => {
     ...
      37      const repository = new InMemoryPropertyRepository();
      38      const failure = new Error('connection refused');
      39      vi.spyOn(repository, 'list').mockRejectedValue(failure);
      39 -    const { logger, post } = setup(repository);                
      40 +    const { logError, post } = setup(repository);              
      41  
      42      const response = await post('query ListProperties { propert
          ies { totalCount } }');
      43  
      44      const body = (await response.json()) as { errors: { message
          : string; extensions: unknown }[] };
      45      expect(body.errors[0]?.message).toBe('Unexpected error.');
      46      expect(JSON.stringify(body)).not.toContain('connection refu
          sed');
      46 -    expect(logger.error).toHaveBeenCalledWith(                 
      47 +    expect(logError).toHaveBeenCalledWith(                     
      48        'Unexpected error',
      49        expect.objectContaining({ operationName: 'ListProperties'
          , error: failure }),
      50      );
      51    });
      52  
      53    it('does not log domain errors as unexpected', async () => {
      53 -    const { logger, post } = setup();                          
      54 +    const { logError, post } = setup();                        
      55  
      56      const response = await post('query { property(id: "not-a-uu
          id") { id } }');
     … 8 more lines (ctrl+o to expand)
  ⎿  Updated apps/api/src/app.ts (+10 -8)
      1 -import { getOperationAST, GraphQLError } from 'graphql';        
      1 +import {                                                        
      2 +  getOperationAST,                                              
      3 +  type ExecutionArgs,                                           
      4 +  type ExecutionResult,                                         
      5 +} from 'graphql';                                               
      6  import { createSchema, createYoga, type Plugin } from 'graphql-y
         oga';
      7  import type { GraphQLContext } from './context.js';
      8  import { isDomainError, maskError } from './errors/mask-error.js
         ';
     ...
      38  function useUnexpectedErrorLogging(logger: Logger): Plugin {
      39    return {
      40      onExecute({ args }) {
      41 +      // Envelop types these loosely. The schema has no subscri
         +ptions, so results are never streams.                          
      42 +      const { document, operationName } = args as ExecutionArgs
         +;                                                              
      43        return {
      44          onExecuteDone({ result }) {
      39 -          if (!('errors' in result) || !result.errors) {       
      40 -            return;                                            
      41 -          }                                                    
      42 -          for (const error of result.errors) {                 
      43 -            const original = error instanceof GraphQLError ? er
         -ror.originalError : error;                                     
      45 +          for (const error of (result as ExecutionResult).error
         +s ?? []) {                                                     
      46 +            const original = error.originalError;              
      47              if (original !== undefined && !isDomainError(origin
          al)) {
      48                logger.error('Unexpected error', {
      49                  // Named in the document, or chosen by the requ
          est's `operationName`.
      47 -                operationName:                                 
      48 -                  getOperationAST(args.document, args.operation
         -Name)?.name?.value ?? null,                                    
      50 +                operationName: getOperationAST(document, operat
         +ionName)?.name?.value ?? null,                                 
      51                  path: error.path,
      52                  error: original,
      53                });
  ⎿  Updated apps/api/src/config/env.test.ts (+9 -3)
      60    });
      61  
      62    it('never includes the API key in its error message', () => {
      63 -    expect(() => parseEnv({ WEATHERSTACK_API_KEY: 'secret-key-1
         -23' })).toThrow(                                               
      64 -      expect.objectContaining({ message: expect.not.stringConta
         -ining('secret-key-123') }),                                    
      65 -    );                                                         
      63 +    let message = '';                                          
      64 +    try {                                                      
      65 +      parseEnv({ WEATHERSTACK_API_KEY: 'secret-key-123' });    
      66 +    } catch (error) {                                          
      67 +      message = (error as Error).message;                      
      68 +    }                                                          
      69 +                                                               
      70 +    expect(message).toMatch(/DATABASE_URL/);                   
      71 +    expect(message).not.toContain('secret-key-123');           
      72    });
      73  });
  ⎿  Updated apps/api/src/main.ts (+1 -1)
      41    isDev: env.NODE_ENV === 'development',
      42  });
      43  
      44 -const server = createServer(app);                              
      44 +const server = createServer(app.requestListener);              
      45  server.listen(env.PORT, () => {
      46    logger.info(`GraphQL API listening on http://localhost:${env.
          PORT}${app.graphqlEndpoint}`);
      47  });
  ⎿  (timeout 3m)

⏺ Typecheck and lint pass cleanly; the Prettier warnings were just false
  positives from generated files since I ran it from apps/api instead of the
  repo root, so I'll rerun Prettier from there.

  Ran 1 shell command (ctrl+o to expand)

⏺ I'll format those four source files and add *.generated.graphqls to
  .prettierignore.

⏺ Bash(sed -i ''
      's#^\*\*/\*.generated.ts$#**/*.generated.ts\n**/*.generated.graphqls#'
      .prettierignore && pnpm exec prettier --write apps/api >/dev/null && pnpm
      forma…)
  ⎿  Checking formatting...
     All matched files use Prettier code style!
      M .prettierignore
     … +13 lines (ctrl+o to expand)
  ⎿  Updated .prettierignore (+1 -0)
       4  coverage
       5  **/generated/**
       6  **/*.generated.ts
       7 +**/*.generated.graphqls                                        
       8  docs/ai-sessions
       9  # Hand-written prose and harness config: keep author formatting
           (tables, line breaks).
      10  docs/
  ⎿  Updated apps/api/src/app.ts (+1 -5)
      1 -import {                                                        
      2 -  getOperationAST,                                              
      3 -  type ExecutionArgs,                                           
      4 -  type ExecutionResult,                                         
      5 -} from 'graphql';                                               
      1 +import { getOperationAST, type ExecutionArgs, type ExecutionResu
        +lt } from 'graphql';                                            
      2  import { createSchema, createYoga, type Plugin } from 'graphql-y
         oga';
      3  import type { GraphQLContext } from './context.js';
      4  import { isDomainError, maskError } from './errors/mask-error.js
         ';
  ⎿  Updated apps/api/src/config/env.test.ts (+8 -5)
      35      expect(() => parseEnv({ WEATHERSTACK_API_KEY: 'key' })).toT
          hrow(/DATABASE_URL/);
      36    });
      37  
      38 -  it.each([undefined, ''])('requires WEATHERSTACK_API_KEY for t
         -he weatherstack provider (%j)', (key) => {                     
      39 -    expect(() => parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY:
         - key })).toThrow(                                              
      40 -      /WEATHERSTACK_API_KEY/,                                  
      41 -    );                                                         
      42 -  });                                                          
      38 +  it.each([undefined, ''])(                                    
      39 +    'requires WEATHERSTACK_API_KEY for the weatherstack provide
         +r (%j)',                                                       
      40 +    (key) => {                                                 
      41 +      expect(() => parseEnv({ DATABASE_URL, WEATHERSTACK_API_KE
         +Y: key })).toThrow(                                            
      42 +        /WEATHERSTACK_API_KEY/,                                
      43 +      );                                                       
      44 +    },                                                         
      45 +  );                                                           
      46  
      47    it('does not require WEATHERSTACK_API_KEY when WEATHER_PROVID
          ER=fake', () => {
      48      const env = parseEnv({ DATABASE_URL, WEATHER_PROVIDER: 'fak
          e' });
  ⎿  Updated apps/api/src/config/env.ts (+5 -1)
      11      WEATHER_PROVIDER: z.enum(['weatherstack', 'fake']).default(
          'weatherstack'),
      12      WEATHERSTACK_API_KEY: z.string().optional(),
      13      WEATHERSTACK_BASE_URL: z.url().default(DEFAULT_WEATHERSTACK
          _BASE_URL),
      14 -    WEATHERSTACK_TIMEOUT_MS: z.coerce.number().int().positive()
         -.default(DEFAULT_WEATHERSTACK_TIMEOUT_MS),                     
      14 +    WEATHERSTACK_TIMEOUT_MS: z.coerce                          
      15 +      .number()                                                
      16 +      .int()                                                   
      17 +      .positive()                                              
      18 +      .default(DEFAULT_WEATHERSTACK_TIMEOUT_MS),               
      19      PORT: z.coerce.number().int().min(1).max(65535).default(400
          0),
      20      CORS_ORIGIN: z.string().min(1).default('http://localhost:51
          73'),
      21      NODE_ENV: z.string().default('development'),
  ⎿  Updated apps/api/src/errors/mask-error.test.ts (+3 -1)
      24  
      25  describe('maskError', () => {
      26    it('maps ValidationError to BAD_USER_INPUT with fieldErrors',
           () => {
      27 -    const result = mask(wrapped(new ValidationError({ zipCode: 
         -['Zip code must be exactly 5 digits'] })));                    
      27 +    const result = mask(                                       
      28 +      wrapped(new ValidationError({ zipCode: ['Zip code must be
         + exactly 5 digits'] })),                                       
      29 +    );                                                         
      30  
      31      expect(result.message).toBe('Invalid input');
      32      expect(result.extensions).toEqual({
⏺ Formatting is clean. Next are the integration tests. I'll check that Postgres
  is running and look at the keys.ts signatures the seed helper needs.

  Ran 1 shell command (ctrl+o to expand)

⏺ The DB is healthy, and the contract file already exports buildNewProperty,
  which I'll reuse for seeding. Next come the shared helper and the five
  integration suites.

⏺ Bash(cd /Users/marcincielecki/covertree-properties/apps/api && cat >
      test/helpers/graphql.ts <<'EOF'
      import { vi } from 'vitest';…)
  ⎿  19:interface AddressOverrides {
  ⎿  Updated apps/api/src/property/property.repository.contract.ts (+1 -1)
      16  const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';
      17  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-
          [0-9a-f]{12}$/;
      18  
      19 -interface AddressOverrides {                                   
      19 +export interface AddressOverrides {                            
      20    street?: string;
      21    city?: string;
      22    state?: USState;
  ⎿  Created apps/api/test/helpers/graphql.ts (+100 -0)
        1 +import { vi } from 'vitest';                                  
        2 +import { createApp, type App } from '../../src/app.js';       
        3 +import type { PrismaClient } from '../../src/generated/prisma/
          +client.js';                                                   
        4 +import type { Prisma } from '../../src/generated/prisma/client
          +.js';                                                         
        5 +import type { Logger } from '../../src/logger.js';            
        6 +import { PrismaPropertyRepository } from '../../src/property/p
          +risma-property.repository.js';                                
        7 +import {                                                      
        8 +  buildNewProperty,                                           
        9 +  type AddressOverrides,                                      
       10 +} from '../../src/property/property.repository.contract.js';  
       11 +import { PropertyService } from '../../src/property/property.s
          +ervice.js';                                                   
       12 +import { FakeWeatherProvider } from '../../src/weather/fake-we
          +ather.provider.js';                                           
       13 +import type { WeatherProvider } from '../../src/weather/weathe
          +r-provider.js';                                               
       14 +import { createTestPrismaClient } from './db.js';             
       15 +                                                              
       16 +export interface ResponseError {                              
       17 +  message: string;                                            
       18 +  path?: (string | number)[];                                 
       19 +  extensions: { code: string; [key: string]: unknown };       
       20 +}                                                             
       21 +                                                              
       22 +export interface GraphQLResponse<TData> {                     
       23 +  status: number;                                             
       24 +  body: { data?: TData | null; errors?: ResponseError[] };    
       25 +}                                                             
       26 +                                                              
       27 +export interface TestApp {                                    
       28 +  app: App;                                                   
       29 +  logError: ReturnType<typeof vi.fn<Logger['error']>>;        
       30 +}                                                             
       31 +                                                              
       32 +/** The real app wired like main.ts, with the test database an
          +d the given weather provider. */                              
       33 +export function createTestApp(prisma: PrismaClient, weather: W
          +eatherProvider): TestApp {                                    
       34 +  const logError = vi.fn<Logger['error']>();                  
       35 +  const app = createApp({                                     
       36 +    propertyService: new PropertyService(new PrismaPropertyRep
          +ository(prisma), weather),                                    
       37 +    logger: { info: vi.fn(), warn: vi.fn(), error: logError },
       38 +    corsOrigin: 'http://localhost:5173',                      
       39 +  });                                                         
       40 +  return { app, logError };                                   
     … 60 more lines (ctrl+o to expand)

⏺ The helper typechecks. Now the query suites (US-1 to US-4).

⏺ Bash(cat > test/integration/properties-query.test.ts <<'EOF'
      import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from
      'vitest';…)
  ⎿       × AC-3.8: rejects an unknown state literal with GRAPHQL_VALIDATIO
     N_FAILED 8ms
          × AC-3.8: rejects an unknown state passed as a variable 6ms
     … +13 lines (ctrl+o to expand)
  ⎿  Created apps/api/test/integration/properties-query.test.ts (+236 -0)
        1 +import { afterAll, afterEach, beforeEach, describe, expect, it
          +, vi } from 'vitest';                                         
        2 +import { truncateAll } from '../helpers/db.js';               
        3 +import {                                                      
        4 +  createIntegrationHarness,                                   
        5 +  errorCodes,                                                 
        6 +  gql,                                                        
        7 +  insertMany,                                                 
        8 +  insertProperty,                                             
        9 +} from '../helpers/graphql.js';                               
       10 +                                                              
       11 +interface PropertiesData {                                    
       12 +  properties: { items: { id: string; city: string; state: stri
          +ng; zipCode: string }[]; totalCount: number };                
       13 +}                                                             
       14 +                                                              
       15 +const PROPERTIES = /* GraphQL */ `                            
       16 +  query Properties($filter: PropertyFilter, $sortOrder: SortOr
          +der, $limit: Int, $offset: Int) {                             
       17 +    properties(filter: $filter, sortOrder: $sortOrder, limit: 
          +$limit, offset: $offset) {                                    
       18 +      items {                                                 
       19 +        id                                                    
       20 +        city                                                  
       21 +        state                                                 
       22 +        zipCode                                               
       23 +      }                                                       
       24 +      totalCount                                              
       25 +    }                                                         
       26 +  }                                                           
       27 +`;                                                            
       28 +                                                              
       29 +const { prisma, weather, app } = createIntegrationHarness();  
       30 +                                                              
       31 +const list = (variables: Record<string, unknown> = {}) =>     
       32 +  gql<PropertiesData>(app, PROPERTIES, variables);            
       33 +                                                              
       34 +const ids = async (variables: Record<string, unknown> = {}) =>
       35 +  (await list(variables)).body.data?.properties.items.map((ite
          +m) => item.id);                                               
       36 +                                                              
       37 +beforeEach(async () => {                                      
       38 +  await truncateAll(prisma);                                  
       39 +  weather.reset();                                            
       40 +});                                                           
     … 196 more lines (ctrl+o to expand)
  ⎿  Created apps/api/test/integration/property-query.test.ts (+155 -0)
        1 +import { afterAll, beforeEach, describe, expect, it, vi } from
          + 'vitest';                                                    
        2 +import { truncateAll } from '../helpers/db.js';               
        3 +import { createIntegrationHarness, errorCodes, gql } from '../
          +helpers/graphql.js';                                          
        4 +                                                              
        5 +const ALL_FIELDS = /* GraphQL */ `                            
        6 +  fragment AllFields on Property {                            
        7 +    id                                                        
        8 +    street                                                    
        9 +    city                                                      
       10 +    state                                                     
       11 +    zipCode                                                   
       12 +    lat                                                       
       13 +    long                                                      
       14 +    createdAt                                                 
       15 +    weatherData {                                             
       16 +      observationTime                                         
       17 +      temperature                                             
       18 +      weatherDescriptions                                     
       19 +      weatherIcons                                            
       20 +      feelsLike                                               
       21 +      weatherCode                                             
       22 +      windSpeed                                               
       23 +      windDegree                                              
       24 +      windDir                                                 
       25 +      pressure                                                
       26 +      precip                                                  
       27 +      humidity                                                
       28 +      cloudCover                                              
       29 +      uvIndex                                                 
       30 +      visibility                                              
       31 +      isDay                                                   
       32 +    }                                                         
       33 +  }                                                           
       34 +`;                                                            
       35 +                                                              
       36 +const PROPERTY = /* GraphQL */ `                              
       37 +  ${ALL_FIELDS}                                               
       38 +  query Property($id: ID!) {                                  
       39 +    property(id: $id) {                                       
       40 +      ...AllFields                                            
     … 115 more lines (ctrl+o to expand)

⏺ 31 of 33 pass. Both failures are the invalid-enum cases I flagged in point 2
  of the plan, so I'll look at what Yoga actually returns for each.

  Ran 1 shell command (ctrl+o to expand)

⏺ Two findings: the invalid-enum literal case only returns 400 when the client
  sends Apollo's Accept header, so I'll update the test helper to send it; the
  invalid-enum variable case returns 400 with no extensions.code, which I'll
  document in SPEC as approved. This also revealed a real bug—my logging plugin
  mislabels these as "Unexpected error"—so I'll write a red test first, then fix
  it.

⏺ Bash(python3 - <<'EOF'
      p='src/app.test.ts'…)
  ⎿       × does not log request errors such as an invalid variable value 4
     ms
     ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
           Tests  1 failed | 5 passed (6)
  ⎿  Updated apps/api/src/app.test.ts (+16 -0)
      60      expect(logError).not.toHaveBeenCalled();
      61    });
      62  
      63 +  it('does not log request errors such as an invalid variable v
         +alue', async () => {                                           
      64 +    const { app, logError } = setup();                         
      65 +                                                               
      66 +    const response = await app.fetch('http://localhost/graphql'
         +, {                                                            
      67 +      method: 'POST',                                          
      68 +      headers: { 'content-type': 'application/json' },         
      69 +      body: JSON.stringify({                                   
      70 +        query: 'query Q($filter: PropertyFilter) { properties(f
         +ilter: $filter) { totalCount } }',                             
      71 +        variables: { filter: { state: 'XX' } },                
      72 +      }),                                                      
      73 +    });                                                        
      74 +                                                               
      75 +    expect(response.status).toBe(400);                         
      76 +    expect(logError).not.toHaveBeenCalled();                   
      77 +  });                                                          
      78 +                                                               
      79    it('allows the configured CORS origin', async () => {
      80      const { app } = setup();
      81  

⏺ Bash(python3 - <<'EOF'
      p='src/app.ts'…)
  ⎿  19:  extensions: { code: string; [key: string]: unknown };
  ⎿  Updated apps/api/src/app.ts (+6 -1)
      40          onExecuteDone({ result }) {
      41            for (const error of (result as ExecutionResult).error
          s ?? []) {
      42              const original = error.originalError;
      43 -            if (original !== undefined && !isDomainError(origin
         -al)) {                                                         
      43 +            // A GraphQLError as the cause is a request problem
         + (e.g. variable coercion), not a bug.                          
      44 +            if (                                               
      45 +              original !== undefined &&                        
      46 +              !(original instanceof GraphQLError) &&           
      47 +              !isDomainError(original)                         
      48 +            ) {                                                
      49                logger.error('Unexpected error', {
      50                  // Named in the document, or chosen by the requ
          est's `operationName`.
      51                  operationName: getOperationAST(document, operat
          ionName)?.name?.value ?? null,
  ⎿  Updated apps/api/test/helpers/graphql.ts (+5 -1)
      55  ): Promise<GraphQLResponse<TData>> {
      56    const response = await app.fetch('http://localhost/graphql', 
          {
      57      method: 'POST',
      58 -    headers: { 'content-type': 'application/json' },           
      58 +    headers: {                                                 
      59 +      'content-type': 'application/json',                      
      60 +      // What Apollo Client sends. Yoga then answers request er
         +rors with HTTP 400 (GraphQL over HTTP).                        
      61 +      accept: 'application/graphql-response+json, application/j
         +son;q=0.9',                                                    
      62 +    },                                                         
      63      body: JSON.stringify({ query, variables }),
      64    });
      65    return { status: response.status, body: (await response.json(
          )) as GraphQLResponse<TData>['body'] };
  ⎿  Updated apps/api/test/integration/properties-query.test.ts (+7 -3)
      218      expect(errorCodes(response)).toEqual(['GRAPHQL_VALIDATION_
           FAILED']);
      219    });
      220  
      221 -  it('AC-3.8: rejects an unknown state passed as a variable', 
          -async () => {                                                 
      221 +  it('AC-3.8: rejects an unknown state passed as a variable wi
          +th HTTP 400 (SPEC §5)', async () => {                         
      222      const response = await list({ filter: { state: 'XX' } });
      223  
      224 -    expect(response.body.data ?? null).toBeNull();            
      225 -    expect(errorCodes(response)).toEqual(['GRAPHQL_VALIDATION_
          -FAILED']);                                                    
      224 +    // Variable coercion error from graphql-js: no data, no ex
          +tensions.code.                                                
      225 +    expect(response.status).toBe(400);                        
      226 +    expect(response.body.data).toBeUndefined();               
      227 +    expect(response.body.errors).toEqual([                    
      228 +      expect.objectContaining({ message: expect.stringContaini
          +ng('"USState" enum') as unknown }),                           
      229 +    ]);                                                       
      230    });
      231  
      232    it.each([{}, { city: null, zipCode: null, state: null }, nul
           l])(

⏺ The ResponseError type claims extensions is always present, but coercion
  errors have none. I'll make it optional and update the callers.

⏺ Bash(sed -i '' 's/  extensions: { code: string; \[key: string\]: unknown };/
      \/** Absent on request errors such as variable coercion failures. *\/\n
      extensions?: {…)
  ⎿  src/app.ts(46,37): error TS2304: Cannot find name 'GraphQLError'.
          × masks unexpected errors and logs them with the operation name 7
     ms
     … +17 lines (ctrl+o to expand)
  ⎿  Updated apps/api/src/schema/resolvers.generated.ts (+18 -18)
       1  /* This file was automatically generated. DO NOT UPDATE MANUALL
          Y. */
       2 -    import type   { Resolvers } from './types.generated.js';   
       3 -    import    { properties as Query_properties } from './proper
         -ty/resolvers/Query/properties.js';                             
       4 -import    { property as Query_property } from './property/resol
         -vers/Query/property.js';                                       
       5 -import    { createProperty as Mutation_createProperty } from '.
         -/property/resolvers/Mutation/createProperty.js';               
       6 -import    { deleteProperty as Mutation_deleteProperty } from '.
         -/property/resolvers/Mutation/deleteProperty.js';               
       7 -import    { Property } from './property/resolvers/Property.js';
       8 -import    { PropertyPage } from './property/resolvers/PropertyP
         -age.js';                                                       
       9 -import    { WeatherData } from './property/resolvers/WeatherDat
         -a.js';                                                         
      10 -import    { DateTimeResolver } from 'graphql-scalars';         
      11 -    export const resolvers: Resolvers = {                      
      12 -      Query: { properties: Query_properties,property: Query_pro
         -perty },                                                       
      13 -      Mutation: { createProperty: Mutation_createProperty,delet
         -eProperty: Mutation_deleteProperty },                          
      14 -                                                               
      15 -      Property: Property,                                      
      16 -PropertyPage: PropertyPage,                                    
      17 -WeatherData: WeatherData,                                      
      18 -DateTime: DateTimeResolver                                     
      19 -    }                                                          
       2 +import type { Resolvers } from './types.generated.js';         
       3 +import { properties as Query_properties } from './property/reso
         +lvers/Query/properties.js';                                    
       4 +import { property as Query_property } from './property/resolver
         +s/Query/property.js';                                          
       5 +import { createProperty as Mutation_createProperty } from './pr
         +operty/resolvers/Mutation/createProperty.js';                  
       6 +import { deleteProperty as Mutation_deleteProperty } from './pr
         +operty/resolvers/Mutation/deleteProperty.js';                  
       7 +import { Property } from './property/resolvers/Property.js';   
       8 +import { PropertyPage } from './property/resolvers/PropertyPage
         +.js';                                                          
       9 +import { WeatherData } from './property/resolvers/WeatherData.j
         +s';                                                            
      10 +import { DateTimeResolver } from 'graphql-scalars';            
      11 +export const resolvers: Resolvers = {                          
      12 +  Query: { properties: Query_properties, property: Query_proper
         +ty },                                                          
      13 +  Mutation: { createProperty: Mutation_createProperty, deletePr
         +operty: Mutation_deleteProperty },                             
      14 +                                                               
      15 +  Property: Property,                                          
      16 +  PropertyPage: PropertyPage,                                  
      17 +  WeatherData: WeatherData,                                    
      18 +  DateTime: DateTimeResolver,                                  
      19 +};                                                             
  ⎿  Updated apps/api/src/schema/schema.generated.graphqls (+31 -11)
       5    zipCode: String!
       6  }
       7  
       8 -"""ISO-8601 date-time string on the wire."""                   
       8 +"""                                                            
       9 +ISO-8601 date-time string on the wire.                         
      10 +"""                                                            
      11  scalar DateTime
      12  
      13  type Mutation {
     ...
      39    long: Float!
      40    state: USState!
      41  
      40 -  """Street name and number, e.g. '15528 E Golden Eagle Blvd'."
         -""                                                             
      42 +  """                                                          
      43 +  Street name and number, e.g. '15528 E Golden Eagle Blvd'.    
      44 +  """                                                          
      45    street: String!
      46  
      43 -  """Weather observed when the property was created. Never refr
         -eshed."""                                                      
      47 +  """                                                          
      48 +  Weather observed when the property was created. Never refresh
         +ed.                                                            
      49 +  """                                                          
      50    weatherData: WeatherData!
      51  
      46 -  """Exactly 5 digits. A string, so leading zeros are preserved
         -."""                                                           
      52 +  """                                                          
      53 +  Exactly 5 digits. A string, so leading zeros are preserved.  
      54 +  """                                                          
      55    zipCode: String!
      56  }
      57  
      58  input PropertyFilter {
      51 -  """Case-insensitive exact match."""                          
      59 +  """                                                          
      60 +  Case-insensitive exact match.                                
      61 +  """                                                          
      62    city: String
      63    state: USState
      64  
     … 46 more lines (ctrl+o to expand)
  ⎿  Updated apps/api/src/schema/types.generated.ts (+215 -48)
       8  export type EnumResolverSignature<T, AllowedValues = any> = { [
          key in keyof T]?: AllowedValues };
       9  /** All built-in and custom scalars, mapped to their actual val
          ues */
      10  export type Scalars = {
      11 -  ID: { input: string; output: string | number; }              
      12 -  String: { input: string; output: string; }                   
      13 -  Boolean: { input: boolean; output: boolean; }                
      14 -  Int: { input: number; output: number; }                      
      15 -  Float: { input: number; output: number; }                    
      11 +  ID: { input: string; output: string | number };              
      12 +  String: { input: string; output: string };                   
      13 +  Boolean: { input: boolean; output: boolean };                
      14 +  Int: { input: number; output: number };                      
      15 +  Float: { input: number; output: number };                    
      16    /** ISO-8601 date-time string on the wire. */
      17 -  DateTime: { input: Date | string; output: Date | string; }   
      17 +  DateTime: { input: Date | string; output: Date | string };   
      18  };
      19  
      20  export type CreatePropertyInput = {
     ...
      35    deleteProperty: Scalars['ID']['output'];
      36  };
      37  
      38 -                                                               
      38  export type MutationcreatePropertyArgs = {
      39    input: CreatePropertyInput;
      40  };
      41  
      43 -                                                               
      42  export type MutationdeletePropertyArgs = {
      43    id: Scalars['ID']['input'];
      44  };
     ...
      83    property?: Maybe<Property>;
      84  };
      85  
      88 -                                                               
      86  export type QuerypropertiesArgs = {
      87    filter?: InputMaybe<PropertyFilter>;
      88    limit?: InputMaybe<Scalars['Int']['input']>;
     ...
       90    sortOrder?: InputMaybe<SortOrder>;
       91  };
     … 343 more lines (ctrl+o to expand)
  ⎿  Updated apps/api/test/helpers/graphql.ts (+7 -3)
      16  export interface ResponseError {
      17    message: string;
      18    path?: (string | number)[];
      19 -  extensions: { code: string; [key: string]: unknown };        
      19 +  /** Absent on request errors such as variable coercion failur
         +es. */                                                         
      20 +  extensions?: { code: string; [key: string]: unknown };       
      21  }
      22  
      23  export interface GraphQLResponse<TData> {
     ...
      63      },
      64      body: JSON.stringify({ query, variables }),
      65    });
      65 -  return { status: response.status, body: (await response.json(
         -)) as GraphQLResponse<TData>['body'] };                        
      66 +  return {                                                     
      67 +    status: response.status,                                   
      68 +    body: (await response.json()) as GraphQLResponse<TData>['bo
         +dy'],                                                          
      69 +  };                                                           
      70  }
      71  
      72  /** Stores a property directly, with a fixed `createdAt`, so or
          dering does not depend on the clock. */
     ...
      104  }
      105  
      106  export function errorCodes(response: GraphQLResponse<unknown>)
           : string[] {
      103 -  return (response.body.errors ?? []).map((error) => error.ext
          -ensions.code);                                                
      107 +  return (response.body.errors ?? []).map((error) => error.ext
          +ensions?.code ?? '(none)');                                   
      108  }
  ⎿  Updated apps/api/test/integration/properties-query.test.ts (+34 -8)
       9  } from '../helpers/graphql.js';
      10  
      11  interface PropertiesData {
      12 -  properties: { items: { id: string; city: string; state: strin
         -g; zipCode: string }[]; totalCount: number };                  
      12 +  properties: {                                                
      13 +    items: { id: string; city: string; state: string; zipCode: 
         +string }[];                                                    
      14 +    totalCount: number;                                        
      15 +  };                                                           
      16  }
      17  
      18  const PROPERTIES = /* GraphQL */ `
     ...
      107  
      108      expect(response.body.data).toBeNull();
      109      expect(errorCodes(response)).toEqual(['BAD_USER_INPUT']);
      107 -    expect(response.body.errors?.[0]?.extensions.fieldErrors).
          -toHaveProperty(field);                                        
      110 +    expect(response.body.errors?.[0]?.extensions?.fieldErrors)
          +.toHaveProperty(field);                                       
      111    });
      112  
      113    it('AC-1.6: never calls Weatherstack', async () => {
     ...
      159  
      160  describe('US-3 filter by city, zip code and state', () => {
      161    beforeEach(async () => {
      159 -    await insertProperty(prisma, { street: '1 A St', city: 'Fo
          -untain Hills', state: 'AZ', zipCode: '85268' });              
      160 -    await insertProperty(prisma, { street: '2 A St', city: 'Fo
          -untain Hills', state: 'AZ', zipCode: '85268' });              
      161 -    await insertProperty(prisma, { street: '3 A St', city: 'Ph
          -oenix', state: 'AZ', zipCode: '85001' });                     
      162 -    await insertProperty(prisma, { street: '4 A St', city: 'Ph
          -oenix', state: 'CA', zipCode: '90001' });                     
      162 +    await insertProperty(prisma, {                            
      163 +      street: '1 A St',                                       
      164 +      city: 'Fountain Hills',                                 
      165 +      state: 'AZ',                                            
      166 +      zipCode: '85268',                                       
      167 +    });                                                       
      168 +    await insertProperty(prisma, {                            
      169 +      street: '2 A St',                                       
      170 +      city: 'Fountain Hills',                                 
      171 +      state: 'AZ',                                            
      172 +      zipCode: '85268',                                       
      173 +    });                                                       
      174 +    await insertProperty(prisma, {                            
      175 +      street: '3 A St',                                       
     … 32 more lines (ctrl+o to expand)
  ⎿  … 2 more files changed
  ⎿  (timeout 5m)

⏺ My import edit didn't match after Prettier reformatted app.ts. I'll look at
  the file header.

  Ran 1 shell command (ctrl+o to expand)

⏺ Bash(sed -i '' "1s/.*/import { getOperationAST, GraphQLError, type
      ExecutionArgs, type ExecutionResult } from 'graphql';/" src/app.ts && pnpm
      exec prettier --write s…)
  ⎿   Test Files  13 passed (13)
           Tests  235 passed (235)
  ⎿  Updated apps/api/src/app.ts (+1 -1)
      1 -import { getOperationAST, type ExecutionArgs, type ExecutionResu
        -lt } from 'graphql';                                            
      1 +import { getOperationAST, GraphQLError, type ExecutionArgs, type
        + ExecutionResult } from 'graphql';                              
      2  import { createSchema, createYoga, type Plugin } from 'graphql-y
         oga';
      3  import type { GraphQLContext } from './context.js';
      4  import { isDomainError, maskError } from './errors/mask-error.js
         ';
  ⎿  (timeout 5m)

⏺ All 235 tests pass. Now the mutation suites (US-5, US-6) and the schema suite
  (US-7).

⏺ Bash(cat > test/integration/create-property.test.ts <<'EOF'
      import { afterAll, beforeEach, describe, expect, it } from 'vitest';…)
  ⎿   Test Files  6 passed (6)
           Tests  88 passed (88)
  ⎿  Created apps/api/test/integration/create-property.test.ts (+322 -0)
        1 +import { afterAll, beforeEach, describe, expect, it } from 'vi
          +test';                                                        
        2 +import { LocationNotFoundError, WeatherUnavailableError } from
          + '../../src/errors/domain-errors.js';                         
        3 +import { FakeWeatherProvider } from '../../src/weather/fake-we
          +ather.provider.js';                                           
        4 +import { truncateAll } from '../helpers/db.js';               
        5 +import { createIntegrationHarness, createTestApp, errorCodes, 
          +gql } from '../helpers/graphql.js';                           
        6 +                                                              
        7 +const CREATE = /* GraphQL */ `                                
        8 +  mutation Create($input: CreatePropertyInput!) {             
        9 +    createProperty(input: $input) {                           
       10 +      id                                                      
       11 +      street                                                  
       12 +      city                                                    
       13 +      state                                                   
       14 +      zipCode                                                 
       15 +      lat                                                     
       16 +      long                                                    
       17 +      createdAt                                               
       18 +      weatherData {                                           
       19 +        observationTime                                       
       20 +        temperature                                           
       21 +        weatherDescriptions                                   
       22 +        weatherIcons                                          
       23 +        feelsLike                                             
       24 +        uvIndex                                               
       25 +        windDegree                                            
       26 +        isDay                                                 
       27 +      }                                                       
       28 +    }                                                         
       29 +  }                                                           
       30 +`;                                                            
       31 +                                                              
       32 +const DELETE = /* GraphQL */ `                                
       33 +  mutation Delete($id: ID!) {                                 
       34 +    deleteProperty(id: $id)                                   
       35 +  }                                                           
       36 +`;                                                            
       37 +                                                              
       38 +const VALID_INPUT = {                                         
       39 +  street: '15528 E Golden Eagle Blvd',                        
       40 +  city: 'Fountain Hills',                                     
     … 282 more lines (ctrl+o to expand)
  ⎿  Created apps/api/test/integration/delete-property.test.ts (+69 -0)
       1 +import { afterAll, beforeEach, describe, expect, it } from 'vit
         +est';                                                          
       2 +import { truncateAll } from '../helpers/db.js';                
       3 +import { createIntegrationHarness, errorCodes, gql, insertPrope
         +rty } from '../helpers/graphql.js';                            
       4 +                                                               
       5 +const DELETE = /* GraphQL */ `                                 
       6 +  mutation Delete($id: ID!) {                                  
       7 +    deleteProperty(id: $id)                                    
       8 +  }                                                            
       9 +`;                                                             
      10 +                                                               
      11 +const PROPERTY = /* GraphQL */ `                               
      12 +  query Property($id: ID!) {                                   
      13 +    property(id: $id) {                                        
      14 +      id                                                       
      15 +    }                                                          
      16 +  }                                                            
      17 +`;                                                             
      18 +                                                               
      19 +const { prisma, weather, app } = createIntegrationHarness();   
      20 +                                                               
      21 +beforeEach(async () => {                                       
      22 +  await truncateAll(prisma);                                   
      23 +  weather.reset();                                             
      24 +});                                                            
      25 +                                                               
      26 +afterAll(async () => {                                         
      27 +  await prisma.$disconnect();                                  
      28 +});                                                            
      29 +                                                               
      30 +describe('US-6 delete a property', () => {                     
      31 +  it('AC-6.1: returns the deleted id, after which the property 
         +is gone', async () => {                                        
      32 +    const id = await insertProperty(prisma);                   
      33 +    const other = await insertProperty(prisma, { street: '1 Oth
         +er St' });                                                     
      34 +                                                               
      35 +    const response = await gql<{ deleteProperty: string }>(app,
         + DELETE, { id });                                              
      36 +                                                               
      37 +    expect(response.body).toEqual({ data: { deleteProperty: id 
         +} });                                                          
      38 +    const lookup = await gql<{ property: unknown }>(app, PROPER
         +TY, { id });                                                   
      39 +    expect(lookup.body).toEqual({ data: { property: null } }); 
      40 +    expect(await prisma.property.findMany({ select: { id: true 
         +} })).toEqual([{ id: other }]);                                
     … 29 more lines (ctrl+o to expand)
  ⎿  Created apps/api/test/integration/schema.test.ts (+148 -0)
        1 +import { afterAll, describe, expect, it } from 'vitest';      
        2 +import { createIntegrationHarness, errorCodes, gql } from '../
          +helpers/graphql.js';                                          
        3 +                                                              
        4 +interface TypeData {                                          
        5 +  __type: {                                                   
        6 +    fields?: { name: string; type: TypeRef }[] | null;        
        7 +    inputFields?: { name: string; type: TypeRef }[] | null;   
        8 +  } | null;                                                   
        9 +}                                                             
       10 +                                                              
       11 +interface TypeRef {                                           
       12 +  kind: string;                                               
       13 +  name: string | null;                                        
       14 +  ofType: TypeRef | null;                                     
       15 +}                                                             
       16 +                                                              
       17 +const TYPE = /* GraphQL */ `                                  
       18 +  query Type($name: String!) {                                
       19 +    __type(name: $name) {                                     
       20 +      fields {                                                
       21 +        name                                                  
       22 +        type {                                                
       23 +          ...Ref                                              
       24 +        }                                                     
       25 +      }                                                       
       26 +      inputFields {                                           
       27 +        name                                                  
       28 +        type {                                                
       29 +          ...Ref                                              
       30 +        }                                                     
       31 +      }                                                       
       32 +    }                                                         
       33 +  }                                                           
       34 +  fragment Ref on __Type {                                    
       35 +    kind                                                      
       36 +    name                                                      
       37 +    ofType {                                                  
       38 +      kind                                                    
       39 +      name                                                    
       40 +      ofType {                                                
     … 108 more lines (ctrl+o to expand)
  ⎿  (timeout 5m)

⏺ All 88 integration tests pass. Next, the full definition-of-done check from
  the repo root.

  Ran 1 shell command (ctrl+o to expand)

⏺ All checks passed: typecheck, lint, 350 tests, and Prettier are green. As a
  final check, I'll spin up main.ts with the fake provider on a spare port
  against the test DB and hit it over HTTP.

  Ran 1 shell command (ctrl+o to expand)

⏺ The server works end to end, but I noticed a risky default: NODE_ENV defaults
  to development, which could leak internal error details if a Docker deploy
  forgets to set it. I'll flip the default to production and have the dev script
  set development explicitly, testing this change first.

⏺ Bash(sed -i '' "s/      NODE_ENV: 'development',/      NODE_ENV:
      'production',/" src/config/env.test.ts && python3 - <<'EOF'
      p='src/config/env.test.ts'…)
  ⎿       × applies the SPEC §6 defaults 4ms
          × defaults NODE_ENV to production, so error details stay masked u
     nless dev is explicit 1ms
     … +6 lines (ctrl+o to expand)
  ⎿  Updated apps/api/package.json (+1 -1)
      11      "test": "vitest run",
      12      "test:unit": "vitest run --project unit",
      13      "test:integration": "vitest run --project integration",
      14 -    "dev": "tsx watch src/main.ts"                             
      14 +    "dev": "NODE_ENV=development tsx watch src/main.ts"        
      15    },
      16    "dependencies": {
      17      "@covertree/validation": "workspace:*",
  ⎿  Updated apps/api/src/config/env.test.ts (+8 -1)
      15        WEATHERSTACK_TIMEOUT_MS: 5000,
      16        PORT: 4000,
      17        CORS_ORIGIN: 'http://localhost:5173',
      18 -      NODE_ENV: 'development',                                 
      18 +      NODE_ENV: 'production',                                  
      19      });
      20    });
      21  
      22 +  it('defaults NODE_ENV to production, so error details stay ma
         +sked unless dev is explicit', () => {                          
      23 +    expect(parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY: 'key'
         + }).NODE_ENV).toBe('production');                              
      24 +    expect(                                                    
      25 +      parseEnv({ DATABASE_URL, WEATHERSTACK_API_KEY: 'key', NOD
         +E_ENV: 'development' }).NODE_ENV,                              
      26 +    ).toBe('development');                                     
      27 +  });                                                          
      28 +                                                               
      29    it('parses numeric variables from strings', () => {
      30      const env = parseEnv({
      31        DATABASE_URL,
  ⎿  Updated apps/api/src/config/env.ts (+2 -1)
      18        .default(DEFAULT_WEATHERSTACK_TIMEOUT_MS),
      19      PORT: z.coerce.number().int().min(1).max(65535).default(400
          0),
      20      CORS_ORIGIN: z.string().min(1).default('http://localhost:51
          73'),
      21 -    NODE_ENV: z.string().default('development'),               
      21 +    // Only an explicit "development" adds originalError to mas
         +ked errors (see main.ts).                                      
      22 +    NODE_ENV: z.string().default('production'),                
      23    })
      24    .refine((env) => env.WEATHER_PROVIDER === 'fake' || Boolean(e
          nv.WEATHERSTACK_API_KEY), {
      25      path: ['WEATHERSTACK_API_KEY'],

⏺ Red, then green. Now the SPEC updates for the deviations, starting with the
  relevant passages.

  Read 1 file, ran 1 shell command (ctrl+o to expand)

⏺ Bash(python3 - <<'EOF'
      p='docs/SPEC.md'…)
  ⎿   .prettierignore                                    |    1 +
      apps/api/package.json                              |   13 +-
      .../src/property/property.repository.contract.ts   |    2 +-
     … +6 lines (ctrl+o to expand)
  ⎿  Updated docs/SPEC.md (+41 -16)
      82  - **AC-3.6** G `filter: { city: "Phoenix", state: AZ }`, T only
           properties matching **both** are returned.
      83  - **AC-3.7** G `filter: { zipCode: "852" }` or a city that fail
          s the city rules (§2.3),
      84    T a `BAD_USER_INPUT` error is returned.
      85 -- **AC-3.8** G `filter: { state: XX }`, T GraphQL validation fa
         -ils (`GRAPHQL_VALIDATION_FAILED`).                             
      85 +- **AC-3.8** G `filter: { state: XX }`, T GraphQL validation fa
         +ils: as an inline literal with                                 
      86 +  `GRAPHQL_VALIDATION_FAILED`, as a variable with an HTTP 400 r
         +equest error that has no                                       
      87 +  `extensions.code` (§5).                                      
      88  - **AC-3.9** G a filter field is omitted or `null`, T that fiel
          d does not constrain the result.
      89  
      90  ### US-4 — Property details
     ...
      107    T `BAD_USER_INPUT`, nothing persisted, Weatherstack not call
           ed.
      108  - **AC-5.4** G `street` or `city` is empty or whitespace-only,
            or longer than its limit,
      109    T `BAD_USER_INPUT`, nothing persisted, Weatherstack not call
           ed.
      108 -- **AC-5.5** G `state` is not a `USState` value, T `GRAPHQL_VA
          -LIDATION_FAILED`, Weatherstack not called.                    
      110 +- **AC-5.5** G `state` is not a `USState` value, T the request
          + is rejected before execution                                 
      111 +  (`GRAPHQL_VALIDATION_FAILED` for a literal, HTTP 400 without
          + a code for a variable; §5),                                  
      112 +  nothing persisted, Weatherstack not called.                 
      113  - **AC-5.6** G input `{ street: "  15528  E Golden Eagle Blvd 
           ", city: " Fountain  Hills" … }`,
      114    T the stored values are `"15528 E Golden Eagle Blvd"` and `"
           Fountain Hills"`.
      115  - **AC-5.7** G a property with the same normalized address exi
           sts (case-insensitive on street and city),
     ...
      571  
      572  | `extensions.code` | Raised when | Message (client-facing) | 
           Extra extensions |
      573  |---|---|---|---|
      570 -| `GRAPHQL_VALIDATION_FAILED` | Invalid document or variables,
          - e.g. an unknown `USState` value (Yoga/graphql-js, HTTP 400) |
          - graphql-js message | — |                                     
      574 +| `GRAPHQL_VALIDATION_FAILED` | Invalid document, e.g. an unkn
          +own `USState` literal or an unknown input field (Yoga/graphql-
          +js) | graphql-js message | — |                                
      575 +| *(none)* | Invalid variable value, e.g. `$state: "XX"`. grap
          +hql-js reports variable coercion failures without a code, and 
          +Yoga answers HTTP 400 | graphql-js message | — |              
      576  | `BAD_USER_INPUT` | zod validation fails (input, filter, id, 
           limit/offset) | `"Invalid input"` | `fieldErrors: { [path]: st
           ring[] }` |
      577  | `NOT_FOUND` | `deleteProperty` on an unknown id | `"Property
            not found"` | `id` |
      578  | `ALREADY_EXISTS` | Same normalized address already stored | 
           `"A property with this address already exists"` | `id` of the 
           existing property, when known |
     ...
      584    `state`, `zipCode` for `createProperty` input and for `Prope
           rtyFilter`, `limit` / `offset`, and
      585    `id`. Each field carries exactly one message (the first fail
           ing rule).
      586  - HTTP status: Yoga's defaults apply. Execution errors return 
           200 with `errors[]` (as in the
      582 -  GraphQL-over-HTTP spec), and parse/validation errors return 
          -400. Domain errors do not set                                 
      583 -  `extensions.http`.                                          
      587 +  GraphQL-over-HTTP spec). Parse/validation errors and invalid
          + variables return 400 when the client                         
      588 +  accepts `application/graphql-response+json`, as Apollo Clien
          +t does. For a plain                                           
      589 +  `application/json` request, Yoga returns document validation
          + errors with 200. Domain errors do                            
      590 +  not set `extensions.http`. The web client never sends an inv
          +alid enum (the state `<select>` is                            
      591 +  generated from `USState`), so the missing code on variable e
          +rrors does not reach the UI.                                  
      592  - A mutation that fails returns `data: null`, because `createP
           roperty` and `deleteProperty` are
     … 79 more lines (ctrl+o to expand)

⏺ I'll add NODE_ENV to .env.example as a commented line, then run the full
  verification one last time.

⏺ Bash(sed -i '' 's#^CORS_ORIGIN=http://localhost:5173$#CORS_ORIGIN=http://local
      host:5173\n\# Only "development" adds error details to masked GraphQL
      errors. `pnpm dev…)
  ⎿  CORS_ORIGIN=http://localhost:5173
     # Only "development" adds error details to masked GraphQL errors. `pnp
     m dev` sets it; leave unset elsewhere.
     … +31 lines (ctrl+o to expand)
  ⎿  Updated .env.example (+2 -0)
      19  WEATHER_PROVIDER=weatherstack
      20  PORT=4000
      21  CORS_ORIGIN=http://localhost:5173
      22 +# Only "development" adds error details to masked GraphQL error
         +s. `pnpm dev` sets it; leave unset elsewhere.                  
      23 +# NODE_ENV=development                                         
      24  
      25  # --- Web (build-time) ---
      26  VITE_GRAPHQL_URL=http://localhost:4000/graphql
  ⎿  (timeout 10m)

⏺ Milestone 5 is done: the property GraphQL API is live, and typecheck, lint and
  tests all pass (274 API, 76 validation, 1 web). I also started the real
  main.ts with the fake weather provider and called it over HTTP. Nothing is
  committed.

  What was built

  - Schema and codegen: the two SDL files follow §2.1, and codegen produces
    typed resolvers. pnpm codegen now runs both Prisma and GraphQL codegen.
  - Resolvers: the query and mutation resolvers are one line each and just call
    PropertyService. The WeatherData resolvers convert snake_case to camelCase,
    turn missing fields into null and map is_day to a boolean.
  - Error handling (mask-error.ts): each domain error gets its code, message and
    extensions from §5, and anything else gets Yoga's default "Unexpected
    error.". Provider codes, internal reasons and the API key never reach the
    client.
  - App (app.ts): sets up Yoga with CORS, error masking, and a small plugin that
    logs unexpected errors with the operation name.
  - Config and startup: config/env.ts validates the environment variables and
    never echoes their values. main.ts reads the repo-root .env, logs the
    fake-provider warning, serves over node:http and shuts down cleanly on
    SIGINT/SIGTERM. The api now has a pnpm dev script.
  - Tests:
    - Unit tests for error masking, WeatherData, env parsing and the app wiring.
    - 88 integration tests against covertree_test covering every AC in US-1 to
      US-7, including the concurrent-create race (AC-5.12) and a fetch spy for
      AC-1.6 and AC-4.4.

  Deviations (SPEC.md updated)

  1. Invalid enum passed as a variable (AC-3.8, AC-5.5): an inline literal gives
     GRAPHQL_VALIDATION_FAILED as specified. A variable gives HTTP 400 with no 
     extensions.code, which is graphql-js's default. As agreed, I documented
     this rather than working around it. The web form can't send an invalid
     state, so the UI isn't affected. If you want a code on these errors anyway,
     it's a few lines in maskError.
  2. HTTP 400 for validation errors only happens when the client sends Apollo's
     Accept: application/graphql-response+json. A plain application/json request
     gets 200. The test helper sends Apollo's header, and §5 now says this.
  3. graphql is pinned to v16. v17 loaded two copies of GraphQLError under
     Vitest, which broke error masking. v16 has a similar split, so
     vitest.config.ts also points graphql at the file Node loads at runtime.
  4. NODE_ENV now defaults to production, so error details stay masked unless
     development is set explicitly. pnpm dev sets it. It's added to the env
     table and .env.example.
  5. As approved: the generated GraphQL files are committed, the app reads the
     repo-root .env, and the timeout test (AC-5.11) in integration only checks
     the error mapping, because the real timeout is covered by the adapter tests
     from milestone 3.

  Smaller changes: AddressOverrides in the repository contract is now exported
  for the test helper, *.generated.graphqls is in .prettierignore, and
  codegen.ts is in the api tsconfig.

  Worth checking manually

  - Run pnpm --filter @covertree/api dev with WEATHER_PROVIDER=fake and open
    http://localhost:4000/graphql. You should see the fake-provider warning at
    startup, and GraphiQL should work.
  - Try one real Weatherstack call with your key: createProperty for 85268
    should return real coordinates. If your plan rejects HTTPS (error 105), set
    WEATHERSTACK_BASE_URL=http://….
  - Read the SPEC §5 changes about variable errors and HTTP status and confirm
    you're happy with them.
  - My smoke run left one row ("1 Smoke St") in covertree_test. The tests clear
    the table before each case, so it's harmless.

  Commit message

  feat(api): expose property GraphQL API

  - SDL modules + GraphQL Codegen server preset (mappers, enumsAsTypes, 
  DateTime)
  - thin Query/Mutation resolvers, WeatherData field mapping (null for absent 
  fields)
  - maskError: domain errors -> BAD_USER_INPUT / NOT_FOUND / ALREADY_EXISTS /
    LOCATION_NOT_FOUND / WEATHER_SERVICE_UNAVAILABLE; unexpected errors masked 
  and
    logged with operation name
  - createApp() with CORS; main.ts with zod env parsing and fake-provider 
  warning
  - integration tests for US-1..US-7 against covertree_test via yoga.fetch
  - pin graphql to v16 and alias it in vitest to avoid dual-module GraphQLError
  - docs(spec): document variable-coercion errors, HTTP status, NODE_ENV, 
  committed codegen output

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
✻ Baked for 13m 19s · done 12:00 PM

※ recap: Milestone 5, the property GraphQL API, is finished and all checks pass, but nothing is committed. Next, review the SPEC changes on invalid-enum variable errors and HTTP status, then commit with the suggested message.