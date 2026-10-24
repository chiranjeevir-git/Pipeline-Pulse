import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  children: ReactNode;
}

export function Field({ id, label, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
