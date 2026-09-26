import {
  createPropertyInputSchema,
  US_STATES,
  type NormalizedPropertyInput,
} from '@covertree/validation';
import { useState, type FormEvent, type ReactNode } from 'react';

type Field = 'street' | 'city' | 'state' | 'zipCode';
type Values = Record<Field, string>;
export type FieldErrors = Partial<Record<Field, string>>;

interface PropertyFormProps {
  onSubmit: (input: NormalizedPropertyInput) => void;
  submitting: boolean;
  /** BAD_USER_INPUT `fieldErrors` from the API, shown next to their fields. */
  serverErrors?: Record<string, string> | undefined;
}

const EMPTY: Values = { street: '', city: '', state: '', zipCode: '' };

/** Validates with the shared zod schema, so the rules match the API exactly (AC-W.4). */
export function PropertyForm({ onSubmit, submitting, serverErrors }: PropertyFormProps) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = createPropertyInputSchema.safeParse(values);
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as Field;
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  const errorFor = (field: Field) => errors[field] ?? serverErrors?.[field];

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-4">
      <FormField label="Street" name="street" error={errorFor('street')}>
        {(props) => (
          <input
            {...props}
            value={values.street}
            onChange={(event) => update('street', event.target.value)}
            placeholder="15528 E Golden Eagle Blvd"
            autoComplete="address-line1"
          />
        )}
      </FormField>
      <FormField label="City" name="city" error={errorFor('city')}>
        {(props) => (
          <input
            {...props}
            value={values.city}
            onChange={(event) => update('city', event.target.value)}
            placeholder="Fountain Hills"
            autoComplete="address-level2"
          />
        )}
      </FormField>
      <FormField label="State" name="state" error={errorFor('state')}>
        {(props) => (
          <select
            {...props}
            value={values.state}
            onChange={(event) => update('state', event.target.value)}
          >
            <option value="">Select a state</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <FormField label="Zip code" name="zipCode" error={errorFor('zipCode')}>
        {(props) => (
          <input
            {...props}
            value={values.zipCode}
            onChange={(event) => update('zipCode', event.target.value)}
            placeholder="85268"
            inputMode="numeric"
            autoComplete="postal-code"
          />
        )}
      </FormField>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create property'}
      </button>
    </form>
  );
}

interface ControlProps {
  id: string;
  name: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
  className: string;
}

interface FormFieldProps {
  label: string;
  name: Field;
  error: string | undefined;
  children: (props: ControlProps) => ReactNode;
}

function FormField({ label, name, error, children }: FormFieldProps) {
  const id = `property-${name}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        name,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `${id}-error` : undefined,
        className: 'rounded border border-gray-300 bg-white px-2 py-1.5',
      })}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
