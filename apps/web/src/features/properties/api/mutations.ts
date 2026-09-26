import { graphql } from '../../../gql';

export const CREATE_PROPERTY = graphql(`
  mutation CreateProperty($input: CreatePropertyInput!) {
    createProperty(input: $input) {
      id
    }
  }
`);

export const DELETE_PROPERTY = graphql(`
  mutation DeleteProperty($id: ID!) {
    deleteProperty(id: $id)
  }
`);
