import { citySchema, US_STATES, zipCodeSchema, type USState } from '@covertree/validation';
import { useState, type FormEvent } from 'react';
import type { FilterParams } from '../hooks/usePropertyListParams';

interface PropertyFiltersProps {
  /** Filters currently applied (from the URL). */
  value: FilterParams;
  onApply: (filters: FilterParams) => void;
}

type FilterErrors = Partial<Record<'city' | 'zip', string>>;

/**
 * City and zip apply on submit, so a half-typed zip never reaches the API; the state select
 * applies at once. Remount it (via `key`) when the URL changes to reset the text inputs.
 */
export function PropertyFilters({ value, onApply }: PropertyFiltersProps) {
  const [city, setCity] = useState(value.city ?? '');
  const [zip, setZip] = useState(value.zip ?? '');
  const [errors, setErrors] = useState<FilterErrors>({});

  function apply(state: USState | undefined) {
    const filters: FilterParams = {};
    const nextErrors: FilterErrors = {};
    // Empty inputs mean "no constraint"; the API rejects empty strings (SPEC §2.3).
    if (city.trim()) {
      const result = citySchema.safeParse(city);
      if (result.success) filters.city = result.data;
      else nextErrors.city = result.error.issues[0]?.message;
    }
    if (zip.trim()) {
      const result = zipCodeSchema.safeParse(zip.trim());
      if (result.success) filters.zip = result.data;
      else nextErrors.zip = result.error.issues[0]?.message;
    }
    setErrors(nextErrors);
    if (nextErrors.city ?? nextErrors.zip) {
      // Focus the first problem; its message is read as the input's description.
      document.getElementById(nextErrors.city ? 'filter-city' : 'filter-zip')?.focus();
      return;
    }
    if (state) filters.state = state;
    onApply(filters);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    apply(value.state);
  }

  const hasFilters = Boolean(value.city || value.state || value.zip);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Filter properties"
      className="panel grid gap-4 p-4 sm:grid-cols-[1fr_10rem_9rem_auto] sm:items-start sm:p-5"
    >
      <TextFilter
        id="filter-city"
        label="City"
        value={city}
        onChange={setCity}
        error={errors.city}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-state" className="field-label">
          State
        </label>
        <select
          id="filter-state"
          value={value.state ?? ''}
          onChange={(event) => apply((event.target.value || undefined) as USState | undefined)}
          className="field-control"
        >
          <option value="">All states</option>
          {US_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>
      <TextFilter
        id="filter-zip"
        label="Zip code"
        value={zip}
        onChange={setZip}
        error={errors.zip}
        inputMode="numeric"
      />
      <div className="flex gap-2 sm:mt-[1.625rem]">
        <button type="submit" className="btn btn-primary flex-1 sm:flex-none">
          Apply filters
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => onApply({})}
            className="btn btn-secondary flex-1 sm:flex-none"
          >
            Clear filters
          </button>
        )}
      </div>
    </form>
  );
}

interface TextFilterProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | undefined;
  inputMode?: 'numeric';
}

function TextFilter({ id, label, value, onChange, error, inputMode }: TextFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`field-control ${inputMode ? 'tabular-nums' : ''}`}
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
