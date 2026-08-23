import { memo } from 'react';
import type { FormContextType, IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import type { ButtonProps } from 'semantic-ui-react';
import { Button } from 'semantic-ui-react';

export type SemanticIconButtonProps<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = IconButtonProps<T, S, F> & Omit<ButtonProps, 'onChange'>;

function IconButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: SemanticIconButtonProps<T, S, F>,
) {
  const { icon, iconType, color, className, uiSchema, registry, ...otherProps } = props;
  return (
    <Button
      icon={icon}
      size={iconType as ButtonProps['size']}
      color={color as ButtonProps['color']}
      className={className}
      {...otherProps}
    />
  );
}
const IconButton = memo(IconButtonFn) as typeof IconButtonFn;
export default IconButton;

function CopyButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: SemanticIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon='copy' />;
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

function MoveDownButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: SemanticIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon='angle down' />;
}
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

function MoveUpButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: SemanticIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon='angle up' />;
}
export const MoveUpButton = memo(MoveUpButtonFn) as typeof MoveUpButtonFn;

function RemoveButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: SemanticIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.RemoveButton)} {...props} icon='trash' />;
}
export const RemoveButton = memo(RemoveButtonFn) as typeof RemoveButtonFn;

function ClearButtonFn<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: SemanticIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.ClearButton)} {...props} icon='close' />;
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
