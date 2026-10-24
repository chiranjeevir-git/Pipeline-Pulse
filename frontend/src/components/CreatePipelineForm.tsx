import { useState, type FormEvent } from 'react';
import { PRODUCTS, isProduct, type CreatePipelineInput, type Product } from '../api/types';
import { productLabel } from '../lib/status';
import { Field } from './Field';

interface CreatePipelineFormProps {
  pending: boolean;
  disabled?: boolean;
  onCreate: (input: CreatePipelineInput) => Promise<boolean>;
  onClearError: () => void;
}

export function CreatePipelineForm({ pending, disabled = false, onCreate, onClearError }: CreatePipelineFormProps) {
  const [name, setName] = useState('');
  const [product, setProduct] = useState<Product>('flasharray');
  const [localError, setLocalError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onClearError();
    if (pending || disabled) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError('Enter a pipeline name.');
      return;
    }
    if (trimmed.length > 80) {
      setLocalError('Use 80 characters or fewer.');
      return;
    }
    setLocalError(null);
    void onCreate({ name: trimmed, product }).then((ok) => {
      if (ok) setName('');
    });
  }

  return (
    <form className="stack-form" onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        <Field id="pipeline-name" label="Name">
          <input
            id="pipeline-name"
            name="name"
            value={name}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field id="pipeline-product" label="Product">
          <select
            id="pipeline-product"
            name="product"
            value={product}
            onChange={(event) => {
              if (isProduct(event.target.value)) setProduct(event.target.value);
            }}
          >
            {PRODUCTS.map((item) => (
              <option key={item} value={item}>
                {productLabel(item)}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className="button" data-testid="pipeline-create" disabled={pending || disabled}>
          {pending ? 'Creating…' : 'Create pipeline'}
        </button>
      </div>
      {localError ? (
        <p className="field-error" role="alert">
          {localError}
        </p>
      ) : null}
    </form>
  );
}
