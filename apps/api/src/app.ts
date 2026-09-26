import { getOperationAST, GraphQLError, type ExecutionArgs, type ExecutionResult } from 'graphql';
import { createSchema, createYoga, type Plugin } from 'graphql-yoga';
import type { GraphQLContext } from './context.js';
import { isDomainError, maskError } from './errors/mask-error.js';
import type { Logger } from './logger.js';
import type { PropertyService } from './property/property.service.js';
import { resolvers } from './schema/resolvers.generated.js';
import { typeDefs } from './schema/typeDefs.generated.js';

export interface AppDeps {
  propertyService: PropertyService;
  logger: Logger;
  /** Allowed browser origin (the web app). */
  corsOrigin: string;
  /** Adds `originalError` to masked errors. Never true in production. */
  isDev?: boolean;
}

export type App = ReturnType<typeof createApp>;

/** The GraphQL server, independent of HTTP hosting: main.ts serves it, tests call `app.fetch`. */
export function createApp({ propertyService, logger, corsOrigin, isDev = false }: AppDeps) {
  return createYoga({
    schema: createSchema<GraphQLContext>({ typeDefs, resolvers }),
    context: { propertyService },
    maskedErrors: { maskError, isDev },
    cors: { origin: corsOrigin, methods: ['GET', 'POST', 'OPTIONS'] },
    plugins: [useUnexpectedErrorLogging(logger)],
    logging: false,
  });
}

/** Logs errors that are about to be masked, with the operation name (SPEC §5). */
function useUnexpectedErrorLogging(logger: Logger): Plugin {
  return {
    onExecute({ args }) {
      // Envelop types these loosely. The schema has no subscriptions, so results are never streams.
      const { document, operationName } = args as ExecutionArgs;
      return {
        onExecuteDone({ result }) {
          for (const error of (result as ExecutionResult).errors ?? []) {
            const original = error.originalError;
            // A GraphQLError as the cause is a request problem (e.g. variable coercion), not a bug.
            if (
              original !== undefined &&
              !(original instanceof GraphQLError) &&
              !isDomainError(original)
            ) {
              logger.error('Unexpected error', {
                // Named in the document, or chosen by the request's `operationName`.
                operationName: getOperationAST(document, operationName)?.name?.value ?? null,
                path: error.path,
                error: original,
              });
            }
          }
        },
      };
    },
  };
}
