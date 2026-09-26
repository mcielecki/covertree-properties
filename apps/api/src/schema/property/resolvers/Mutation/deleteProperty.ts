import type { MutationResolvers } from './../../../types.generated.js';

export const deleteProperty: NonNullable<MutationResolvers['deleteProperty']> = (
  _parent,
  { id },
  ctx,
) => ctx.propertyService.delete(id);
