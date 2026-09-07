import type { Field as ChakraField } from '@chakra-ui/react';
import { defaultSystem } from '@chakra-ui/react';
import shouldForwardProp from '@emotion/is-prop-valid';
import type { UiSchema } from '@rjsf/utils';

const { isValidProperty } = defaultSystem;

export interface ChakraUiSchema extends Omit<UiSchema, 'ui:options'> {
  'ui:options'?: ChakraUiOptions;
}

type ChakraUiOptions = UiSchema['ui:options'] & { chakra?: ChakraField.RootProps };

export function getChakra(uiSchema: ChakraUiSchema = {}): ChakraField.RootProps {
  const chakraProps = uiSchema['ui:options']?.chakra || {};

  /**
   * Leveraging `shouldForwardProp` to remove props
   * https://chakra-ui.com/docs/styling/chakra-factory#forwarding-props
   *
   * This builds a filtered copy rather than deleting from `chakraProps`, which is the caller's `ui:options` object.
   */
  const forwardable = Object.entries(chakraProps).filter(([key]) => isValidProperty(key) && !shouldForwardProp(key));

  return Object.fromEntries(forwardable) as ChakraField.RootProps;
}
