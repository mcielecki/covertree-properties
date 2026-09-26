import type { PropertyService } from './property/property.service.js';

export interface GraphQLContext {
  propertyService: PropertyService;
}
