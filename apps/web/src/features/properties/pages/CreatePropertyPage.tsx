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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Add a property</h1>
      <p className="text-sm text-gray-600">
        The current weather for the zip code is looked up and saved with the property.
      </p>
      {described && <ErrorAlert error={described} />}
      <PropertyForm
        onSubmit={(input) => void handleSubmit(input)}
        submitting={loading}
        serverErrors={described?.fieldErrors}
      />
    </div>
  );
}
