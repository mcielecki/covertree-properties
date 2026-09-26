import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LIST_VARIABLES,
  PROPERTY_ID,
  propertyDetails,
  propertyPage,
} from '../../../test/fixtures';
import { renderApp } from '../../../test/render';
import { DELETE_PROPERTY } from '../api/mutations';
import { PROPERTIES_QUERY, PROPERTY_QUERY } from '../api/queries';

const detailsMock = (result: object) => ({
  request: { query: PROPERTY_QUERY, variables: { id: PROPERTY_ID } },
  result,
});

describe('PropertyDetailsPage', () => {
  it('AC-W.5: shows every field and the weather card', async () => {
    renderApp(`/properties/${PROPERTY_ID}`, [
      detailsMock({ data: { property: propertyDetails() } }),
    ]);

    expect(screen.getByRole('status')).toHaveTextContent('Loading property…');
    expect(
      await screen.findByRole('heading', { name: '15528 E Golden Eagle Blvd' }),
    ).toBeInTheDocument();

    const details = screen.getByRole('region', { name: 'Details' });
    for (const text of ['Fountain Hills', 'AZ', '85268', '33.609', '-111.729']) {
      expect(within(details).getByText(text)).toBeInTheDocument();
    }
    expect(within(details).getByText(/^Sep 26, 2026, 12:14\sPM$/)).toBeInTheDocument();

    const weather = screen.getByRole('region', { name: 'Weather at creation' });
    expect(within(weather).getByText('95°F')).toBeInTheDocument();
    expect(within(weather).getByText('Partly cloudy')).toBeInTheDocument();
    expect(within(weather).getByText('Observed 12:14 PM UTC')).toBeInTheDocument();
  });

  it('AC-W.5: an unknown id shows "Property not found"', async () => {
    renderApp(`/properties/${PROPERTY_ID}`, [detailsMock({ data: { property: null } })]);

    expect(await screen.findByRole('heading', { name: 'Property not found' })).toBeInTheDocument();
  });

  it('a malformed id shows "Property not found" without asking the API', () => {
    const result = vi.fn(() => ({ data: { property: null } }));
    renderApp('/properties/not-a-uuid', [
      { request: { query: PROPERTY_QUERY, variables: () => true }, result },
    ]);

    expect(screen.getByRole('heading', { name: 'Property not found' })).toBeInTheDocument();
    expect(result).not.toHaveBeenCalled();
  });

  it('AC-W.7: shows an error state', async () => {
    renderApp(`/properties/${PROPERTY_ID}`, [
      {
        request: { query: PROPERTY_QUERY, variables: { id: PROPERTY_ID } },
        error: new TypeError('Failed to fetch'),
      },
    ]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');
  });

  it('AC-W.6: delete asks for confirmation, evicts the property from the cache and redirects to /', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const detailsResult = vi.fn(() => ({ data: { property: propertyDetails() } }));
    const { client, router } = renderApp(`/properties/${PROPERTY_ID}`, [
      {
        request: { query: PROPERTY_QUERY, variables: { id: PROPERTY_ID } },
        result: detailsResult,
        // Would answer a refetch, so the assertion at the end can catch one.
        maxUsageCount: 2,
      },
      {
        request: { query: DELETE_PROPERTY, variables: { id: PROPERTY_ID } },
        result: { data: { deleteProperty: PROPERTY_ID } },
      },
      {
        request: { query: PROPERTIES_QUERY, variables: DEFAULT_LIST_VARIABLES },
        result: propertyPage([]),
      },
    ]);
    await screen.findByRole('heading', { name: '15528 E Golden Eagle Blvd' });
    expect(client.cache.extract()).toHaveProperty(`Property:${PROPERTY_ID}`);

    await user.click(screen.getByRole('button', { name: /^Delete 15528/ }));

    expect(confirm).toHaveBeenCalledOnce();
    expect(await screen.findByText('No properties yet.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(client.cache.extract()).not.toHaveProperty(`Property:${PROPERTY_ID}`);
    // The eviction must not make the (still mounted) details query fetch the deleted property.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(detailsResult).toHaveBeenCalledOnce();
  });
});
