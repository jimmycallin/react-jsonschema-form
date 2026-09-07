import { Box, Card } from '@chakra-ui/react';
import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector } = props;

  return (
    <Card.Root mb={2}>
      <Card.Body pb={2}>
        <Box mb={4}>{selector}</Box>
        {optionSchemaField}
      </Card.Body>
    </Card.Root>
  );
}
