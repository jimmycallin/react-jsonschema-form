import { memo } from 'react';
import type { FormContextType, IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import type { ButtonProps } from 'primereact/button';
import { Button } from 'primereact/button';

export type PrimeIconButtonProps<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = IconButtonProps<T, S, F> & Omit<ButtonProps, 'onClick'>;

function IconButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const { icon, iconType, uiSchema, registry, ...otherProps } = props;
  return <Button icon={`pi pi-${icon}`} rounded text severity='secondary' {...otherProps} />;
}
const IconButton = memo(IconButtonFn) as typeof IconButtonFn;
export default IconButton;

function CopyButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon='copy' />;
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

function MoveDownButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon='angle-down' />;
}
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

function MoveUpButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon='angle-up' />;
}
export const MoveUpButton = memo(MoveUpButtonFn) as typeof MoveUpButtonFn;

function RemoveButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.RemoveButton)} {...props} icon='trash' />;
}
export const RemoveButton = memo(RemoveButtonFn) as typeof RemoveButtonFn;

function ClearButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: PrimeIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.ClearButton)} {...props} icon='times' />;
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
