/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  '\n  mutation CreateProperty($input: CreatePropertyInput!) {\n    createProperty(input: $input) {\n      id\n    }\n  }\n': typeof types.CreatePropertyDocument;
  '\n  mutation DeleteProperty($id: ID!) {\n    deleteProperty(id: $id)\n  }\n': typeof types.DeletePropertyDocument;
  '\n  query Properties($filter: PropertyFilter, $sortOrder: SortOrder, $limit: Int, $offset: Int) {\n    properties(filter: $filter, sortOrder: $sortOrder, limit: $limit, offset: $offset) {\n      totalCount\n      items {\n        id\n        street\n        city\n        state\n        zipCode\n        createdAt\n        weatherData {\n          temperature\n        }\n      }\n    }\n  }\n': typeof types.PropertiesDocument;
  '\n  query Property($id: ID!) {\n    property(id: $id) {\n      id\n      street\n      city\n      state\n      zipCode\n      lat\n      long\n      createdAt\n      weatherData {\n        observationTime\n        temperature\n        weatherDescriptions\n        weatherIcons\n        feelsLike\n        windSpeed\n        windDir\n        humidity\n      }\n    }\n  }\n': typeof types.PropertyDocument;
};
const documents: Documents = {
  '\n  mutation CreateProperty($input: CreatePropertyInput!) {\n    createProperty(input: $input) {\n      id\n    }\n  }\n':
    types.CreatePropertyDocument,
  '\n  mutation DeleteProperty($id: ID!) {\n    deleteProperty(id: $id)\n  }\n':
    types.DeletePropertyDocument,
  '\n  query Properties($filter: PropertyFilter, $sortOrder: SortOrder, $limit: Int, $offset: Int) {\n    properties(filter: $filter, sortOrder: $sortOrder, limit: $limit, offset: $offset) {\n      totalCount\n      items {\n        id\n        street\n        city\n        state\n        zipCode\n        createdAt\n        weatherData {\n          temperature\n        }\n      }\n    }\n  }\n':
    types.PropertiesDocument,
  '\n  query Property($id: ID!) {\n    property(id: $id) {\n      id\n      street\n      city\n      state\n      zipCode\n      lat\n      long\n      createdAt\n      weatherData {\n        observationTime\n        temperature\n        weatherDescriptions\n        weatherIcons\n        feelsLike\n        windSpeed\n        windDir\n        humidity\n      }\n    }\n  }\n':
    types.PropertyDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateProperty($input: CreatePropertyInput!) {\n    createProperty(input: $input) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation CreateProperty($input: CreatePropertyInput!) {\n    createProperty(input: $input) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation DeleteProperty($id: ID!) {\n    deleteProperty(id: $id)\n  }\n',
): (typeof documents)['\n  mutation DeleteProperty($id: ID!) {\n    deleteProperty(id: $id)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query Properties($filter: PropertyFilter, $sortOrder: SortOrder, $limit: Int, $offset: Int) {\n    properties(filter: $filter, sortOrder: $sortOrder, limit: $limit, offset: $offset) {\n      totalCount\n      items {\n        id\n        street\n        city\n        state\n        zipCode\n        createdAt\n        weatherData {\n          temperature\n        }\n      }\n    }\n  }\n',
): (typeof documents)['\n  query Properties($filter: PropertyFilter, $sortOrder: SortOrder, $limit: Int, $offset: Int) {\n    properties(filter: $filter, sortOrder: $sortOrder, limit: $limit, offset: $offset) {\n      totalCount\n      items {\n        id\n        street\n        city\n        state\n        zipCode\n        createdAt\n        weatherData {\n          temperature\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query Property($id: ID!) {\n    property(id: $id) {\n      id\n      street\n      city\n      state\n      zipCode\n      lat\n      long\n      createdAt\n      weatherData {\n        observationTime\n        temperature\n        weatherDescriptions\n        weatherIcons\n        feelsLike\n        windSpeed\n        windDir\n        humidity\n      }\n    }\n  }\n',
): (typeof documents)['\n  query Property($id: ID!) {\n    property(id: $id) {\n      id\n      street\n      city\n      state\n      zipCode\n      lat\n      long\n      createdAt\n      weatherData {\n        observationTime\n        temperature\n        weatherDescriptions\n        weatherIcons\n        feelsLike\n        windSpeed\n        windDir\n        humidity\n      }\n    }\n  }\n'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
