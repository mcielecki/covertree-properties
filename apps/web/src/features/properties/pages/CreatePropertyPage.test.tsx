import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LIST_VARIABLES,
  listItem,
  PROPERTY_ID,
  propertyDetails,
  propertyPage,
} from '../../../test/fixtures';
import { graphQLErrorResult, renderApp } from '../../../test/render';
import { CREATE_PROPERTY } from '../api/mutations';
import { PROPERTIES_QUERY, PROPERTY_QUERY } from '../api/queries';

const VALID_INPUT = {
  street: '15528 E Golden Eagle Blvd',
  city: 'Fountain Hills',
  state: 'AZ',
  zipCode: '85268',
} as const;

async function fillForm(values: { street: string; city: string; state: string; zipCode: string }) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Street'), values.street);
  await user.type(screen.getByLabelText('City'), values.city);
  await user.selectOptions(screen.getByLabelText('State'), values.state);
  await user.type(screen.getByLabelText('Zip code'), values.zipCode);
  await user.click(screen.getByRole('button', { name: 'Create property' }));
}

function createMock(result: object) {
  return { request: { query: CREATE_PROPERTY, variables: { input: VALID_INPUT } }, result };
}

describe('CreatePropertyPage (AC-W.4)', () => {
  it('shows inline messages for invalid fields and does not send the request', async () => {
    const user = userEvent.setup();
    const createResult = vi.fn(() => ({ data: { createProperty: { id: PROPERTY_ID } } }));
    await renderApp('/properties/new', [
      { request: { query: CREATE_PROPERTY, variables: () => true }, result: createResult },
    ]);

    await user.type(screen.getByLabelText('City'), 'Phoenix1');
    await user.type(screen.getByLabelText('Zip code'), '8526');
    await user.click(screen.getByRole('button', { name: 'Create property' }));

    expect(screen.getByText('Street is required')).toBeInTheDocument();
    expect(
      screen.getByText("City must start with a letter and contain only letters, spaces, . ' and -"),
    ).toBeInTheDocument();
    expect(screen.getByText('Select a valid US state')).toBeInTheDocument();
    expect(screen.getByText('Zip code must be exactly 5 digits')).toBeInTheDocument();
    expect(screen.getByLabelText('Zip code')).toHaveAttribute('aria-invalid', 'true');
    expect(createResult).not.toHaveBeenCalled();
  });

  it('moves focus to the first invalid field and announces how many need fixing', async () => {
    const user = userEvent.setup();
    await renderApp('/properties/new');

    await user.type(screen.getByLabelText('Street'), '1 Main St');
    await user.type(screen.getByLabelText('Zip code'), '8526');
    await user.click(screen.getByRole('button', { name: 'Create property' }));

    expect(screen.getByLabelText('City')).toHaveFocus();
    expect(screen.getByLabelText('City')).toHaveAccessibleDescription('City is required');
    expect(screen.getByRole('status')).toHaveTextContent('3 fields need attention.');
  });

  it('sends the normalized input and navigates to the new property', async () => {
    const { router } = await renderApp('/properties/new', [
      createMock({ data: { createProperty: { __typename: 'Property', id: PROPERTY_ID } } }),
      {
        request: { query: PROPERTY_QUERY, variables: { id: PROPERTY_ID } },
        result: { data: { property: propertyDetails() } },
      },
    ]);

    await fillForm({
      ...VALID_INPUT,
      street: '  15528  E Golden Eagle Blvd ',
      city: ' Fountain  Hills',
    });

    expect(
      await screen.findByRole('heading', { name: '15528 E Golden Eagle Blvd' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/properties/${PROPERTY_ID}`);
  });

  it('AC-W.6: refetches the active list query after creating', async () => {
    const firstList = vi.fn(() => propertyPage([]));
    const refetchedList = vi.fn(() => propertyPage([listItem()]));
    const { client } = await renderApp('/properties/new', [
      {
        request: { query: PROPERTIES_QUERY, variables: DEFAULT_LIST_VARIABLES },
        result: firstList,
      },
      createMock({ data: { createProperty: { __typename: 'Property', id: PROPERTY_ID } } }),
      {
        request: { query: PROPERTIES_QUERY, variables: DEFAULT_LIST_VARIABLES },
        result: refetchedList,
      },
      {
        request: { query: PROPERTY_QUERY, variables: { id: PROPERTY_ID } },
        result: { data: { property: propertyDetails() } },
      },
    ]);
    // Stand-in for a list that is being watched while the property is created.
    const subscription = client
      .watchQuery({ query: PROPERTIES_QUERY, variables: DEFAULT_LIST_VARIABLES })
      .subscribe(() => {});
    await waitFor(() => expect(firstList).toHaveBeenCalledOnce());

    await fillForm(VALID_INPUT);

    await waitFor(() => expect(refetchedList).toHaveBeenCalledOnce());
    subscription.unsubscribe();
  });

  it('ALREADY_EXISTS links to the existing property', async () => {
    await renderApp('/properties/new', [
      createMock(graphQLErrorResult('ALREADY_EXISTS', { id: PROPERTY_ID })),
    ]);

    await fillForm(VALID_INPUT);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('A property with this address already exists.');
    expect(screen.getByRole('link', { name: 'View the existing property' })).toHaveAttribute(
      'href',
      `/properties/${PROPERTY_ID}`,
    );
  });

  it.each([
    [
      'LOCATION_NOT_FOUND',
      { zipCode: '85268' },
      "We couldn't find a US location for zip code 85268. Check the zip code and try again.",
    ],
    [
      'WEATHER_SERVICE_UNAVAILABLE',
      {},
      'The weather service is unavailable right now, so the property was not saved. Please try again later.',
    ],
    ['INTERNAL_SERVER_ERROR', {}, 'Something went wrong. Please try again.'],
  ])('%s renders its message', async (code, extensions, message) => {
    await renderApp('/properties/new', [createMock(graphQLErrorResult(code, extensions))]);

    await fillForm(VALID_INPUT);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(
      screen.queryByRole('link', { name: 'View the existing property' }),
    ).not.toBeInTheDocument();
  });

  it('BAD_USER_INPUT shows the API field errors next to their fields', async () => {
    await renderApp('/properties/new', [
      createMock(
        graphQLErrorResult('BAD_USER_INPUT', {
          fieldErrors: { zipCode: ['Zip code is not served'] },
        }),
      ),
    ]);

    await fillForm(VALID_INPUT);

    expect(await screen.findByText('Zip code is not served')).toBeInTheDocument();
    expect(screen.getByLabelText('Zip code')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Some fields are invalid.');
  });

  it('AC-W.7: disables the button while the property is being created', async () => {
    await renderApp('/properties/new', [
      {
        ...createMock({ data: { createProperty: { __typename: 'Property', id: PROPERTY_ID } } }),
        delay: 50,
      },
      {
        request: { query: PROPERTY_QUERY, variables: { id: PROPERTY_ID } },
        result: { data: { property: propertyDetails() } },
      },
    ]);

    await fillForm(VALID_INPUT);

    expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
    expect(
      await screen.findByRole('heading', { name: '15528 E Golden Eagle Blvd' }),
    ).toBeInTheDocument();
  });
});
