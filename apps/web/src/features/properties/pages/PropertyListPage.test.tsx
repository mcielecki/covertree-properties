import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LIST_VARIABLES,
  listItem,
  PROPERTY_ID,
  propertyPage,
} from '../../../test/fixtures';
import { renderApp } from '../../../test/render';
import { DELETE_PROPERTY } from '../api/mutations';
import { PROPERTIES_QUERY } from '../api/queries';

function listMock(variables: Record<string, unknown>, result: ReturnType<typeof propertyPage>) {
  return { request: { query: PROPERTIES_QUERY, variables }, result };
}

const manyItems = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    listItem({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      street: `${i + 1} Main St`,
    }),
  );

describe('PropertyListPage', () => {
  it('AC-W.1/W.7: shows a loading state, then the properties with their fields', async () => {
    await renderApp('/', [listMock(DEFAULT_LIST_VARIABLES, propertyPage([listItem()]))]);

    expect(screen.getByRole('status')).toHaveTextContent('Loading properties…');

    const row = (await screen.findByRole('link', { name: '15528 E Golden Eagle Blvd' })).closest(
      'tr',
    )!;
    expect(within(row).getByText('Fountain Hills')).toBeInTheDocument();
    expect(within(row).getByText('AZ')).toBeInTheDocument();
    expect(within(row).getByText('85268')).toBeInTheDocument();
    expect(within(row).getByText('95°F')).toBeInTheDocument();
    expect(within(row).getByText('Sep 26, 2026')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('AC-W.7: shows an error state with a retry', async () => {
    await renderApp('/', [
      {
        request: { query: PROPERTIES_QUERY, variables: DEFAULT_LIST_VARIABLES },
        error: new TypeError('Failed to fetch'),
      },
    ]);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not reach the server');
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('AC-W.7: shows a refresh error with a retry next to cached data', async () => {
    const user = userEvent.setup();
    await renderApp(
      '/',
      [
        {
          request: { query: PROPERTIES_QUERY, variables: DEFAULT_LIST_VARIABLES },
          error: new TypeError('Failed to fetch'),
        },
        listMock(DEFAULT_LIST_VARIABLES, propertyPage([listItem({ street: '1 Fresh St' })])),
      ],
      {
        // Data from an earlier visit; cache-and-network shows it, then revalidates.
        seed: (cache) =>
          cache.writeQuery({
            query: PROPERTIES_QUERY,
            variables: DEFAULT_LIST_VARIABLES,
            ...propertyPage([listItem()]),
          }),
      },
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not reach the server');
    expect(screen.getByRole('link', { name: '15528 E Golden Eagle Blvd' })).toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: '1 Fresh St' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('AC-W.7: shows an empty state when there are no properties', async () => {
    await renderApp('/', [listMock(DEFAULT_LIST_VARIABLES, propertyPage([]))]);

    expect(await screen.findByText('No properties yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add the first property' })).toHaveAttribute(
      'href',
      '/properties/new',
    );
  });

  it('shows a different empty state when filters match nothing', async () => {
    await renderApp('/?state=CA', [
      listMock({ ...DEFAULT_LIST_VARIABLES, filter: { state: 'CA' } }, propertyPage([])),
    ]);

    expect(await screen.findByText('No properties match these filters.')).toBeInTheDocument();
  });

  it('AC-W.2: restores filters, sort and page from the URL', async () => {
    await renderApp('/?city=Phoenix&state=AZ&zip=85001&sort=asc&page=2', [
      listMock(
        {
          filter: { city: 'Phoenix', state: 'AZ', zipCode: '85001' },
          sortOrder: 'ASC',
          limit: 20,
          offset: 20,
        },
        propertyPage([listItem({ city: 'Phoenix', zipCode: '85001' })], 21),
      ),
    ]);

    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toHaveValue('Phoenix');
    expect(screen.getByLabelText('State')).toHaveValue('AZ');
    expect(screen.getByLabelText('Zip code')).toHaveValue('85001');
    expect(screen.getByRole('button', { name: 'Sort: Oldest first' })).toBeInTheDocument();
  });

  it('AC-W.2/W.3: applying a city filter updates the URL and the query, and resets the page', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/?page=2', [
      listMock({ ...DEFAULT_LIST_VARIABLES, offset: 20 }, propertyPage(manyItems(1), 21)),
      listMock(
        { ...DEFAULT_LIST_VARIABLES, filter: { city: 'fountain hills' } },
        propertyPage([listItem()]),
      ),
    ]);
    await screen.findByText('Page 2 of 2');

    await user.type(screen.getByLabelText('City'), '  fountain   hills ');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(router.state.location.search).toBe('?city=fountain+hills');
    expect(
      await screen.findByRole('link', { name: '15528 E Golden Eagle Blvd' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('does not apply an invalid zip filter, and says why', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/', [
      listMock(DEFAULT_LIST_VARIABLES, propertyPage([listItem()])),
    ]);
    await screen.findByText('Page 1 of 1');

    await user.type(screen.getByLabelText('Zip code'), '852');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(screen.getByText('Zip code must be exactly 5 digits')).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
  });

  it('AC-W.2: choosing a state applies it immediately', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/', [
      listMock(DEFAULT_LIST_VARIABLES, propertyPage([listItem()])),
      listMock({ ...DEFAULT_LIST_VARIABLES, filter: { state: 'CA' } }, propertyPage([])),
    ]);
    await screen.findByText('Page 1 of 1');

    await user.selectOptions(screen.getByLabelText('State'), 'CA');

    expect(router.state.location.search).toBe('?state=CA');
    expect(await screen.findByText('No properties match these filters.')).toBeInTheDocument();
  });

  it('AC-W.2: the sort toggle switches to oldest first', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/', [
      listMock(DEFAULT_LIST_VARIABLES, propertyPage([listItem({ street: 'Newest' })])),
      listMock(
        { ...DEFAULT_LIST_VARIABLES, sortOrder: 'ASC' },
        propertyPage([listItem({ street: 'Oldest' })]),
      ),
    ]);
    await screen.findByRole('link', { name: 'Newest' });

    await user.click(screen.getByRole('button', { name: 'Sort: Newest first' }));

    expect(router.state.location.search).toBe('?sort=asc');
    expect(await screen.findByRole('link', { name: 'Oldest' })).toBeInTheDocument();
  });

  it('AC-W.3: pagination moves by one page of 20 and shows "Page X of Y"', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/', [
      listMock(DEFAULT_LIST_VARIABLES, propertyPage(manyItems(20), 45)),
      listMock({ ...DEFAULT_LIST_VARIABLES, offset: 20 }, propertyPage(manyItems(20), 45)),
    ]);
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(router.state.location.search).toBe('?page=2');
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('goes to the last page when the requested page is past the end', async () => {
    const { router } = await renderApp('/?page=3', [
      listMock({ ...DEFAULT_LIST_VARIABLES, offset: 40 }, propertyPage([], 21)),
      listMock({ ...DEFAULT_LIST_VARIABLES, offset: 20 }, propertyPage(manyItems(1), 21)),
    ]);

    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
  });

  describe('delete (AC-W.6)', () => {
    it('does nothing when the confirmation is cancelled', async () => {
      const user = userEvent.setup();
      const deleteResult = vi.fn(() => ({ data: { deleteProperty: PROPERTY_ID } }));
      await renderApp('/', [
        listMock(DEFAULT_LIST_VARIABLES, propertyPage([listItem()])),
        {
          request: { query: DELETE_PROPERTY, variables: { id: PROPERTY_ID } },
          result: deleteResult,
        },
      ]);

      await user.click(
        await screen.findByRole('button', { name: /^Delete 15528 E Golden Eagle Blvd/ }),
      );

      const dialog = screen.getByRole('alertdialog', { name: 'Delete this property?' });
      expect(dialog).toHaveAccessibleDescription(
        '15528 E Golden Eagle Blvd, Fountain Hills, AZ 85268 will be permanently removed.',
      );
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(deleteResult).not.toHaveBeenCalled();
      expect(screen.getByRole('link', { name: '15528 E Golden Eagle Blvd' })).toBeInTheDocument();
    });

    it('deletes after confirmation and refetches the list', async () => {
      const user = userEvent.setup();
      await renderApp('/', [
        listMock(DEFAULT_LIST_VARIABLES, propertyPage([listItem()])),
        {
          request: { query: DELETE_PROPERTY, variables: { id: PROPERTY_ID } },
          result: { data: { deleteProperty: PROPERTY_ID } },
        },
        listMock(DEFAULT_LIST_VARIABLES, propertyPage([])),
      ]);

      await user.click(await screen.findByRole('button', { name: /^Delete 15528/ }));
      await user.click(screen.getByRole('button', { name: 'Delete property' }));

      // Only the refetch can produce the empty result.
      expect(await screen.findByText('No properties yet.')).toBeInTheDocument();
    });

    it('shows the error when the delete fails', async () => {
      const user = userEvent.setup();
      await renderApp('/', [
        listMock(DEFAULT_LIST_VARIABLES, propertyPage([listItem()])),
        {
          request: { query: DELETE_PROPERTY, variables: { id: PROPERTY_ID } },
          result: {
            data: null,
            errors: [{ message: 'x', extensions: { code: 'NOT_FOUND', id: PROPERTY_ID } }],
          },
        },
      ]);

      await user.click(await screen.findByRole('button', { name: /^Delete 15528/ }));
      await user.click(screen.getByRole('button', { name: 'Delete property' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('This property no longer exists.');
    });
  });
});
