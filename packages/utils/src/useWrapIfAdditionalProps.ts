import type { FocusEvent } from 'react';

import type { AdditionalPropertyKeySelectProps } from './AdditionalPropertyKeySelect.tsx';
import { ADDITIONAL_PROPERTY_FLAG } from './constants.ts';
import { TranslatableString } from './enums.ts';
import getAdditionalKeyAttributes from './getAdditionalKeyAttributes.ts';
import hasAdditionalKeyLabel from './hasAdditionalKeyLabel.ts';
import hasSchemaMarker from './hasSchemaMarker.ts';
import { additionalKeyId, buttonId } from './idGenerators.ts';
import isAdditionalKeyDisabled from './isAdditionalKeyDisabled.ts';
import isAdditionalRemoveDisabled from './isAdditionalRemoveDisabled.ts';
import type {
  ControlAttributes,
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
  WrapIfAdditionalTemplateProps,
} from './types.ts';

/** The props of the free-text input that renames an `additionalProperties` entry's key. It is uncontrolled, renaming the
 * key on blur, so render it with `key={keyName}`, which remounts it with the new `defaultValue` once the key changes
 */
export interface AdditionalKeyInputProps {
  /** The key input's id */
  id: string;
  /** The key input's name, for a native form submission */
  name: string;
  /** The key input's type, which is always `text` */
  type: 'text';
  /** The key the entry has now */
  defaultValue: string;
  /** Whether the entry is required, so its key can't be left empty */
  required: boolean | undefined;
  /** Whether the key input is disabled, which it is for a disabled or read-only field and for one it is handed no
   * `onKeyRenameBlur`
   */
  disabled: boolean;
  /** The key's label, as the input's accessible name where nothing draws the label beside it */
  'aria-label': string | undefined;
  /** The row's errors, while they say the key is one the parent schema forbids */
  'aria-describedby'?: string;
  /** True while the row's errors say the key is one the parent schema forbids */
  'aria-invalid'?: boolean;
  /** Renames the key to the input's value. Unset for a read-only field */
  onBlur: ((event: FocusEvent<HTMLInputElement>) => void) | undefined;
}

/** The props of the button that removes an `additionalProperties` entry */
export type AdditionalRemoveButtonProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Required<Pick<IconButtonProps<T, S, F>, 'id' | 'className' | 'disabled' | 'registry'>> &
  Pick<IconButtonProps<T, S, F>, 'onClick' | 'uiSchema'>;

/** How a theme draws the key's dropdown */
export interface UseWrapIfAdditionalPropsOptions {
  /** Whether the key's dropdown draws the key's label itself, as it does in a theme whose `SelectWidget` labels its own
   * control. Otherwise the template draws the label beside the dropdown, and the dropdown draws none
   */
  keySelectDrawsLabel?: boolean;
}

export interface UseWrapIfAdditionalPropsResult<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** Whether the field is an `additionalProperties` entry, whose key and remove button the template draws. A field
   * that isn't one is drawn as its `children` alone, in a wrapper taking `classNames` and `style`
   */
  additional: boolean;
  /** The key input's id */
  keyId: string;
  /** The key's label, which names the field's own label as the key's */
  keyLabel: string;
  /** Whether the key is labelled, which it is wherever the value's label is drawn, so the key lines up with it */
  hasKeyLabel: boolean;
  /** Whether the value draws a description, whoever draws it, which a theme reserves a row for beside the key so the key
   * lines up with the value's control
   */
  hasDescription: boolean;
  /** The `aria-describedby` and `aria-invalid` of the key while the row's errors say the parent schema forbids it */
  keyErrorAttributes: Pick<ControlAttributes, 'aria-describedby' | 'aria-invalid'>;
  /** The props of the free-text key input, for an entry whose parent schema enumerates no `propertyNames` */
  keyInputProps: AdditionalKeyInputProps;
  /** The props of the `AdditionalPropertyKeySelect` that picks the key from the parent schema's `propertyNames.enum`,
   * drawn in place of the key input. Undefined where the parent schema enumerates none
   */
  keySelectProps: AdditionalPropertyKeySelectProps<T, S, F> | undefined;
  /** The props of the `RemoveButton` that removes the entry */
  removeButtonProps: AdditionalRemoveButtonProps<T, S, F>;
}

/** Hook which holds what every `WrapIfAdditionalTemplate` does whatever its UI library: it says whether the field is an
 * `additionalProperties` entry, labels its key and names that label, says whether the value draws a description, and
 * supplies the props of the key input, of the key's dropdown and of the remove button, each disabled for a disabled
 * or read-only field. To be used by theme specific `WrapIfAdditionalTemplate` implementations, and by an app's own.
 *
 * @param props - The `WrapIfAdditionalTemplateProps` for the `WrapIfAdditionalTemplate`
 * @param [options={}] - How the theme draws the key's dropdown
 * @returns - The `UseWrapIfAdditionalPropsResult` to be used within a `WrapIfAdditionalTemplate` implementation
 */
export default function useWrapIfAdditionalProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: WrapIfAdditionalTemplateProps<T, S, F>,
  options: UseWrapIfAdditionalPropsOptions = {},
): UseWrapIfAdditionalPropsResult<T, S, F> {
  const {
    id,
    label,
    keyName,
    required,
    disabled,
    readonly,
    schema,
    uiSchema,
    registry,
    rawDescription,
    presentation,
    propertyNamesEnum,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
  } = props;
  const { keySelectDrawsLabel = false } = options;
  const hasKeyLabel = hasAdditionalKeyLabel<T, S, F>(props);
  const keyErrorAttributes = getAdditionalKeyAttributes<T, S, F>(props);
  const keyLabel = registry.translateString(TranslatableString.KeyLabel, [label]);
  const keyId = additionalKeyId(id);

  return {
    additional: hasSchemaMarker(schema, ADDITIONAL_PROPERTY_FLAG),
    keyId,
    keyLabel,
    hasKeyLabel,
    // `rawDescription` is only the description the template draws, so a widget drawing its own leaves it empty
    hasDescription: presentation ? presentation.description.by !== 'none' : !!rawDescription,
    keyErrorAttributes,
    keyInputProps: {
      id: keyId,
      name: keyId,
      type: 'text',
      defaultValue: keyName,
      required,
      disabled: isAdditionalKeyDisabled(props),
      'aria-label': hasKeyLabel ? undefined : keyLabel,
      ...keyErrorAttributes,
      onBlur: readonly ? undefined : onKeyRenameBlur,
    },
    keySelectProps: propertyNamesEnum && {
      id: keyId,
      label: keyLabel,
      hideLabel: keySelectDrawsLabel ? !hasKeyLabel : true,
      labelledByTemplate: !keySelectDrawsLabel && hasKeyLabel,
      value: keyName,
      propertyNamesEnum,
      onKeyRename,
      errorAttributes: keyErrorAttributes,
      disabled,
      readonly,
      required,
      registry,
    },
    removeButtonProps: {
      id: buttonId(id, 'remove'),
      className: 'rjsf-object-property-remove',
      disabled: isAdditionalRemoveDisabled(props),
      onClick: onRemoveProperty,
      uiSchema,
      registry,
    },
  };
}
