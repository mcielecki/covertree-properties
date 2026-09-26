/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import type { Resolvers } from './types.generated.js';
import { properties as Query_properties } from './property/resolvers/Query/properties.js';
import { property as Query_property } from './property/resolvers/Query/property.js';
import { createProperty as Mutation_createProperty } from './property/resolvers/Mutation/createProperty.js';
import { deleteProperty as Mutation_deleteProperty } from './property/resolvers/Mutation/deleteProperty.js';
import { Property } from './property/resolvers/Property.js';
import { PropertyPage } from './property/resolvers/PropertyPage.js';
import { WeatherData } from './property/resolvers/WeatherData.js';
import { DateTimeResolver } from 'graphql-scalars';
export const resolvers: Resolvers = {
  Query: { properties: Query_properties, property: Query_property },
  Mutation: { createProperty: Mutation_createProperty, deleteProperty: Mutation_deleteProperty },

  Property: Property,
  PropertyPage: PropertyPage,
  WeatherData: WeatherData,
  DateTime: DateTimeResolver,
};
