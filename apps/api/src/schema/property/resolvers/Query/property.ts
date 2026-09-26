import type { QueryResolvers } from './../../../types.generated.js';

/** Returns null for an unknown id (AC-4.2). */
export const property: NonNullable<QueryResolvers['property']> = (_parent, { id }, ctx) =>
  ctx.propertyService.getById(id);
