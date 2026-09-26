import { useMutation } from '@apollo/client/react';
import type { NormalizedPropertyInput } from '@covertree/validation';
import { useNavigate } from 'react-router';
import { ErrorAlert } from '../../../components/Feedback';
import { describeError } from '../../../lib/error-messages';
import { CREATE_PROPERTY } from '../api/mutations';
import { PROPERTIES_QUERY } from '../api/queries';
import { PropertyForm } from '../components/PropertyForm';

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const [createProperty, { loading, error }] = useMutation(CREATE_PROPERTY, {
    refetchQueries: [PROPERTIES_QUERY],
    awaitRefetchQueries: true,
  });

  async function handleSubmit(input: NormalizedPropertyInput) {
    let id: string;
    try {
      const { data } = await createProperty({ variables: { input } });
      if (!data) return;
      id = data.createProperty.id;
    } catch {
      return; // The hook's `error` renders the message below.
    }
    await navigate(`/properties/${id}`);
  }

  const described = error ? describeError(error) : undefined;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Add a property</h1>
      <p className="mt-3 text-slate">
        Enter a US address. The current weather for its zip code is looked up and saved with the
        property.
      </p>
      <div className="panel mt-8 space-y-6 p-6 sm:p-8">
        {described && <ErrorAlert error={described} />}
        <PropertyForm
          onSubmit={(input) => void handleSubmit(input)}
          submitting={loading}
          serverErrors={described?.fieldErrors}
        />
      </div>
    </div>
  );
}
