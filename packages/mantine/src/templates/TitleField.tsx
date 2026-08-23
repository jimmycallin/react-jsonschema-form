import { Grid, Title } from '@mantine/core';
import type { FormContextType, TitleFieldProps, RJSFSchema } from '@rjsf/utils';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: TitleFieldProps<T, S, F>) {
  const { id, title, optionalDataControl } = props;
  let heading = title ? (
    <Title id={id} order={3} fw='normal'>
      {title}
    </Title>
  ) : null;
  if (optionalDataControl) {
    heading = (
      <Grid>
        <Grid.Col span='auto'>{heading}</Grid.Col>
        <Grid.Col span='content'>{optionalDataControl}</Grid.Col>
      </Grid>
    );
  }
  return heading;
}
