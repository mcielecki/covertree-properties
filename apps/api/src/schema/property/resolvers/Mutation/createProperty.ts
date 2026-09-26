import type { MutationResolvers } from './../../../types.generated.js';

export const createProperty: NonNullable<MutationResolvers['createProperty']> = (
  _parent,
  { input },
  ctx,
) => ctx.propertyService.create(input);
