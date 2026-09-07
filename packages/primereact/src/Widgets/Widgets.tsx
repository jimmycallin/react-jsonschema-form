import type { FormContextType, RegistryWidgetsType, RJSFSchema } from '@rjsf/utils';

import AutoCompleteWidget from '../AutoCompleteWidget/AutoCompleteWidget.tsx';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget.tsx';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget.tsx';
import ColorWidget from '../ColorWidget/ColorWidget.tsx';
import PasswordWidget from '../PasswordWidget/PasswordWidget.tsx';
import RadioWidget from '../RadioWidget/RadioWidget.tsx';
import RangeWidget from '../RangeWidget/RangeWidget.tsx';
import SelectWidget from '../SelectWidget/SelectWidget.tsx';
import TextareaWidget from '../TextareaWidget/TextareaWidget.tsx';
import UpDownWidget from '../UpDownWidget/UpDownWidget.tsx';

export function generateWidgets<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): RegistryWidgetsType<T, S, F> {
  return {
    AutoCompleteWidget,
    CheckboxWidget,
    CheckboxesWidget,
    ColorWidget,
    PasswordWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
    UpDownWidget,
  };
}

export default generateWidgets();
