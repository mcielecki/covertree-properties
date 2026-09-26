import type { QueryResolvers } from './../../../types.generated.js';

export const properties: NonNullable<QueryResolvers['properties']> = (_parent, args, ctx) =>
  ctx.propertyService.list(args);
