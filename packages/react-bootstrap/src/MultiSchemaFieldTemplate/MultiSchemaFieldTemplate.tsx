import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import Card from 'react-bootstrap/Card';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <Card style={{ marginBottom: '1rem' }}>
      <Card.Body>{selector}</Card.Body>
      <Card.Body>{optionSchemaField}</Card.Body>
    </Card>
  );
}
