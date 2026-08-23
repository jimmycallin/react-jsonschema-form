import type { FormContextType, RegistryWidgetsType, RJSFSchema } from '@rjsf/utils';

import AutoCompleteWidget from '../AutoCompleteWidget/AutoCompleteWidget';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget';
import ColorWidget from '../ColorWidget/ColorWidget';
import PasswordWidget from '../PasswordWidget/PasswordWidget';
import RadioWidget from '../RadioWidget/RadioWidget';
import RangeWidget from '../RangeWidget/RangeWidget';
import SelectWidget from '../SelectWidget/SelectWidget';
import TextareaWidget from '../TextareaWidget/TextareaWidget';
import UpDownWidget from '../UpDownWidget/UpDownWidget';

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
