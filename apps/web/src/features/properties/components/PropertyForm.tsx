import {
  createPropertyInputSchema,
  US_STATES,
  type NormalizedPropertyInput,
} from '@covertree/validation';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';

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
const FIELD_ORDER: readonly Field[] = ['street', 'city', 'state', 'zipCode'];

/** Validates with the shared zod schema, so the rules match the API exactly (AC-W.4). */
export function PropertyForm({ onSubmit, submitting, serverErrors }: PropertyFormProps) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [summary, setSummary] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

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
      const invalid = FIELD_ORDER.filter((field) => next[field]);
      setSummary(
        invalid.length === 1
          ? '1 field needs attention.'
          : `${invalid.length} fields need attention.`,
      );
      // Focus lands on the first problem; its message is read as the field's description.
      formRef.current?.querySelector<HTMLElement>(`[name="${invalid[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    setSummary('');
    onSubmit(result.data);
  }

  const errorFor = (field: Field) => errors[field] ?? serverErrors?.[field];

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      <p role="status" className="sr-only">
        {summary}
      </p>
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
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="State" name="state" error={errorFor('state')}>
          {(props) => (
            <select
              {...props}
              value={values.state}
              onChange={(event) => update('state', event.target.value)}
              autoComplete="address-level1"
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
              className={`${props.className} tabular-nums`}
            />
          )}
        </FormField>
      </div>
      <div className="flex flex-col gap-3 border-t border-mist pt-6 sm:flex-row sm:items-center">
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Creating…' : 'Create property'}
        </button>
        {submitting && (
          <p className="text-sm text-slate">Looking up the current weather for this zip code…</p>
        )}
      </div>
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children({
        id,
        name,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `${id}-error` : undefined,
        className: 'field-control',
      })}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
