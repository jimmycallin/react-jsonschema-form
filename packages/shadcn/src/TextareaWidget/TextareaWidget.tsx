import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, useTextareaWidgetProps } from '@rjsf/utils';

import { Textarea } from '../components/ui/textarea.tsx';
import { cn } from '../lib/utils.ts';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { className } = props;
  const textarea = useTextareaWidgetProps<T, S, F>(props);

  return (
    <div className='flex p-0.5'>
      <Textarea
        id={textarea.id}
        name={textarea.name}
        placeholder={textarea.placeholder}
        disabled={textarea.disabled}
        readOnly={textarea.readOnly}
        value={textarea.value}
        required={textarea.required}
        autoFocus={textarea.autoFocus}
        rows={textarea.rows ?? 5}
        onChange={(event) => textarea.onChange(event.target.value)}
        onBlur={textarea.onBlur}
        onFocus={textarea.onFocus}
        {...textarea.ariaProps}
        className={cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, className)}
      />
    </div>
  );
}
