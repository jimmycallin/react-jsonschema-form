import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema } from '@rjsf/utils';

import { cn } from '../lib/utils';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <div className={cn('p-4 border rounded-md bg-background shadow-sm')}>
      <div className={cn('mb-4')}>{selector}</div>
      {optionSchemaField}
    </div>
  );
}
