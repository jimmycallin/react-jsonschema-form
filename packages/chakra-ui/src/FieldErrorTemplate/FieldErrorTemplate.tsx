import { Fieldset } from '@chakra-ui/react';
import type { FieldErrorProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], fieldPathId } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldPathId);

  return errors.map((error, i: number) => (
    // oxlint-disable-next-line react/no-array-index-key
    <Fieldset.ErrorText mt={0} key={i} id={id}>
      {error}
    </Fieldset.ErrorText>
  ));
}
