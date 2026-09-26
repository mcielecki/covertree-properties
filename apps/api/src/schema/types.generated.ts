import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { PropertyMapper, WeatherDataMapper } from './property/schema.mappers.js';
import type { GraphQLContext } from '../context.js';
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
export type EnumResolverSignature<T, AllowedValues = any> = { [key in keyof T]?: AllowedValues };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string | number };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** ISO-8601 date-time string on the wire. */
  DateTime: { input: Date | string; output: Date | string };
};

export type CreatePropertyInput = {
  city: Scalars['String']['input'];
  state: USState;
  street: Scalars['String']['input'];
  zipCode: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Creates a property. Calls Weatherstack once to fetch current weather and coordinates.
   * Fails without persisting anything if the weather lookup fails.
   */
  createProperty: Property;
  /** Hard-deletes a property. Returns its id. Fails with NOT_FOUND if it does not exist. */
  deleteProperty: Scalars['ID']['output'];
};

export type MutationcreatePropertyArgs = {
  input: CreatePropertyInput;
};

export type MutationdeletePropertyArgs = {
  id: Scalars['ID']['input'];
};

export type Property = {
  __typename?: 'Property';
  city: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** Latitude of the location Weatherstack resolved for the zip code (not the exact street address). */
  lat: Scalars['Float']['output'];
  /** Longitude of the location Weatherstack resolved for the zip code (not the exact street address). */
  long: Scalars['Float']['output'];
  state: USState;
  /** Street name and number, e.g. '15528 E Golden Eagle Blvd'. */
  street: Scalars['String']['output'];
  /** Weather observed when the property was created. Never refreshed. */
  weatherData: WeatherData;
  /** Exactly 5 digits. A string, so leading zeros are preserved. */
  zipCode: Scalars['String']['output'];
};

export type PropertyFilter = {
  /** Case-insensitive exact match. */
  city?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<USState>;
  /** Exactly 5 digits. */
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type PropertyPage = {
  __typename?: 'PropertyPage';
  items: Array<Property>;
  /** Total number of properties matching the filter, ignoring limit/offset. */
  totalCount: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  properties: PropertyPage;
  /** Returns null if no property has this id. */
  property?: Maybe<Property>;
};

export type QuerypropertiesArgs = {
  filter?: InputMaybe<PropertyFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};

export type QuerypropertyArgs = {
  id: Scalars['ID']['input'];
};

export type SortOrder = 'ASC' | 'DESC';

/** Two-letter USPS abbreviations: the 50 states and the District of Columbia. */
export type USState =
  | 'AK'
  | 'AL'
  | 'AR'
  | 'AZ'
  | 'CA'
  | 'CO'
  | 'CT'
  | 'DC'
  | 'DE'
  | 'FL'
  | 'GA'
  | 'HI'
  | 'IA'
  | 'ID'
  | 'IL'
  | 'IN'
  | 'KS'
  | 'KY'
  | 'LA'
  | 'MA'
  | 'MD'
  | 'ME'
  | 'MI'
  | 'MN'
  | 'MO'
  | 'MS'
  | 'MT'
  | 'NC'
  | 'ND'
  | 'NE'
  | 'NH'
  | 'NJ'
  | 'NM'
  | 'NV'
  | 'NY'
  | 'OH'
  | 'OK'
  | 'OR'
  | 'PA'
  | 'RI'
  | 'SC'
  | 'SD'
  | 'TN'
  | 'TX'
  | 'UT'
  | 'VA'
  | 'VT'
  | 'WA'
  | 'WI'
  | 'WV'
  | 'WY';

/**
 * Weatherstack `current` object, units = Fahrenheit ('f'):
 * temperature/feelsLike in °F, windSpeed in mph, pressure in mb,
 * precip in inches, visibility in miles.
 * Only the first four fields are guaranteed; the rest are null when Weatherstack omits them.
 */
export type WeatherData = {
  __typename?: 'WeatherData';
  cloudCover?: Maybe<Scalars['Int']['output']>;
  feelsLike?: Maybe<Scalars['Float']['output']>;
  humidity?: Maybe<Scalars['Int']['output']>;
  isDay?: Maybe<Scalars['Boolean']['output']>;
  /** Time of observation in UTC, as returned by Weatherstack, e.g. '12:14 PM'. */
  observationTime: Scalars['String']['output'];
  precip?: Maybe<Scalars['Float']['output']>;
  pressure?: Maybe<Scalars['Float']['output']>;
  temperature: Scalars['Float']['output'];
  uvIndex?: Maybe<Scalars['Float']['output']>;
  visibility?: Maybe<Scalars['Float']['output']>;
  weatherCode?: Maybe<Scalars['Int']['output']>;
  weatherDescriptions: Array<Scalars['String']['output']>;
  weatherIcons: Array<Scalars['String']['output']>;
  windDegree?: Maybe<Scalars['Int']['output']>;
  windDir?: Maybe<Scalars['String']['output']>;
  windSpeed?: Maybe<Scalars['Float']['output']>;
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<
  TResult,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<
  TTypes,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<
  T = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = Record<PropertyKey, never>,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  CreatePropertyInput: CreatePropertyInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Property: ResolverTypeWrapper<PropertyMapper>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  PropertyFilter: PropertyFilter;
  PropertyPage: ResolverTypeWrapper<
    Omit<PropertyPage, 'items'> & { items: Array<ResolversTypes['Property']> }
  >;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SortOrder: ResolverTypeWrapper<'ASC' | 'DESC'>;
  USState: ResolverTypeWrapper<
    | 'AL'
    | 'AK'
    | 'AZ'
    | 'AR'
    | 'CA'
    | 'CO'
    | 'CT'
    | 'DE'
    | 'DC'
    | 'FL'
    | 'GA'
    | 'HI'
    | 'ID'
    | 'IL'
    | 'IN'
    | 'IA'
    | 'KS'
    | 'KY'
    | 'LA'
    | 'ME'
    | 'MD'
    | 'MA'
    | 'MI'
    | 'MN'
    | 'MS'
    | 'MO'
    | 'MT'
    | 'NE'
    | 'NV'
    | 'NH'
    | 'NJ'
    | 'NM'
    | 'NY'
    | 'NC'
    | 'ND'
    | 'OH'
    | 'OK'
    | 'OR'
    | 'PA'
    | 'RI'
    | 'SC'
    | 'SD'
    | 'TN'
    | 'TX'
    | 'UT'
    | 'VT'
    | 'VA'
    | 'WA'
    | 'WV'
    | 'WI'
    | 'WY'
  >;
  WeatherData: ResolverTypeWrapper<WeatherDataMapper>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  CreatePropertyInput: CreatePropertyInput;
  String: Scalars['String']['output'];
  DateTime: Scalars['DateTime']['output'];
  Mutation: Record<PropertyKey, never>;
  ID: Scalars['ID']['output'];
  Property: PropertyMapper;
  Float: Scalars['Float']['output'];
  PropertyFilter: PropertyFilter;
  PropertyPage: Omit<PropertyPage, 'items'> & { items: Array<ResolversParentTypes['Property']> };
  Int: Scalars['Int']['output'];
  Query: Record<PropertyKey, never>;
  WeatherData: WeatherDataMapper;
  Boolean: Scalars['Boolean']['output'];
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<
  ResolversTypes['DateTime'],
  any
> {
  name: 'DateTime';
}

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation'],
> = {
  createProperty?: Resolver<
    ResolversTypes['Property'],
    ParentType,
    ContextType,
    RequireFields<MutationcreatePropertyArgs, 'input'>
  >;
  deleteProperty?: Resolver<
    ResolversTypes['ID'],
    ParentType,
    ContextType,
    RequireFields<MutationdeletePropertyArgs, 'id'>
  >;
};

export type PropertyResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Property'] = ResolversParentTypes['Property'],
> = {
  city?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lat?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  long?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['USState'], ParentType, ContextType>;
  street?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  weatherData?: Resolver<ResolversTypes['WeatherData'], ParentType, ContextType>;
  zipCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PropertyPageResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['PropertyPage'] = ResolversParentTypes['PropertyPage'],
> = {
  items?: Resolver<Array<ResolversTypes['Property']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = {
  properties?: Resolver<
    ResolversTypes['PropertyPage'],
    ParentType,
    ContextType,
    RequireFields<QuerypropertiesArgs, 'limit' | 'offset' | 'sortOrder'>
  >;
  property?: Resolver<
    Maybe<ResolversTypes['Property']>,
    ParentType,
    ContextType,
    RequireFields<QuerypropertyArgs, 'id'>
  >;
};

export type SortOrderResolvers = EnumResolverSignature<
  { ASC?: any; DESC?: any },
  ResolversTypes['SortOrder']
>;

export type USStateResolvers = EnumResolverSignature<
  {
    AK?: any;
    AL?: any;
    AR?: any;
    AZ?: any;
    CA?: any;
    CO?: any;
    CT?: any;
    DC?: any;
    DE?: any;
    FL?: any;
    GA?: any;
    HI?: any;
    IA?: any;
    ID?: any;
    IL?: any;
    IN?: any;
    KS?: any;
    KY?: any;
    LA?: any;
    MA?: any;
    MD?: any;
    ME?: any;
    MI?: any;
    MN?: any;
    MO?: any;
    MS?: any;
    MT?: any;
    NC?: any;
    ND?: any;
    NE?: any;
    NH?: any;
    NJ?: any;
    NM?: any;
    NV?: any;
    NY?: any;
    OH?: any;
    OK?: any;
    OR?: any;
    PA?: any;
    RI?: any;
    SC?: any;
    SD?: any;
    TN?: any;
    TX?: any;
    UT?: any;
    VA?: any;
    VT?: any;
    WA?: any;
    WI?: any;
    WV?: any;
    WY?: any;
  },
  ResolversTypes['USState']
>;

export type WeatherDataResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes['WeatherData'] = ResolversParentTypes['WeatherData'],
> = {
  cloudCover?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  feelsLike?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  humidity?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  isDay?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  observationTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  precip?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  pressure?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  temperature?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  uvIndex?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  visibility?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  weatherCode?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  weatherDescriptions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  weatherIcons?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  windDegree?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  windDir?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  windSpeed?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  DateTime?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Property?: PropertyResolvers<ContextType>;
  PropertyPage?: PropertyPageResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SortOrder?: SortOrderResolvers;
  USState?: USStateResolvers;
  WeatherData?: WeatherDataResolvers<ContextType>;
};
