import { generateWidgets as generateCoreWidgets } from '@rjsf/core';
import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget.tsx';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget.tsx';
import RadioWidget from '../RadioWidget/RadioWidget.tsx';
import RangeWidget from '../RangeWidget/RangeWidget.tsx';
import SelectWidget from '../SelectWidget/SelectWidget.tsx';
import TextareaWidget from '../TextareaWidget/TextareaWidget.tsx';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): RegistryWidgetsType<T, S, F> {
  return {
    ...generateCoreWidgets<T, S, F>(),
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
  };
}

export default generateWidgets();
