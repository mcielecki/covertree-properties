import { graphql } from '../../../gql';

export const PROPERTIES_QUERY = graphql(`
  query Properties($filter: PropertyFilter, $sortOrder: SortOrder, $limit: Int, $offset: Int) {
    properties(filter: $filter, sortOrder: $sortOrder, limit: $limit, offset: $offset) {
      totalCount
      items {
        id
        street
        city
        state
        zipCode
        createdAt
        weatherData {
          temperature
        }
      }
    }
  }
`);

export const PROPERTY_QUERY = graphql(`
  query Property($id: ID!) {
    property(id: $id) {
      id
      street
      city
      state
      zipCode
      lat
      long
      createdAt
      weatherData {
        observationTime
        temperature
        weatherDescriptions
        weatherIcons
        feelsLike
        windSpeed
        windDir
        humidity
      }
    }
  }
`);
