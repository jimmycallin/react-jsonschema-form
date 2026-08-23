import type { FieldErrorProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';
import type { LabelProps } from 'semantic-ui-react';
import { Label, List } from 'semantic-ui-react';

import { getSemanticErrorProps } from '../util';

const DEFAULT_OPTIONS = {
  options: {
    pointing: 'above',
    size: 'small',
  },
};

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ errors, fieldPathId, uiSchema, registry }: FieldErrorProps<T, S, F>) {
  const { formContext } = registry;
  const options = getSemanticErrorProps<T, S, F>({
    formContext,
    uiSchema,
    defaultProps: DEFAULT_OPTIONS,
  });
  // The error options are user-supplied Label props, so they are read as the Label props they are forwarded to
  const { pointing, size } = options as Pick<LabelProps, 'pointing' | 'size'>;
  if (errors && errors.length > 0) {
    const id = errorId(fieldPathId);
    return (
      <Label id={id} color='red' pointing={pointing || 'above'} size={size || 'small'} basic>
        <List bulleted>
          {errors.map((error, i: number) => (
            // oxlint-disable-next-line react/no-array-index-key
            <List.Item key={i}>{error}</List.Item>
          ))}
        </List>
      </Label>
    );
  }
  return null;
}
