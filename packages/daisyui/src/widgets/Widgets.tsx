import type { FormContextType, RegistryWidgetsType, RJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from './AltDateTimeWidget/AltDateTimeWidget.tsx';
import AltDateWidget from './AltDateWidget/AltDateWidget.tsx';
import CheckboxesWidget from './CheckboxesWidget/CheckboxesWidget.tsx';
import CheckboxWidget from './CheckboxWidget/CheckboxWidget.tsx';
import DateTimeWidget from './DateTimeWidget/DateTimeWidget.tsx';
import DateWidget from './DateWidget/DateWidget.tsx';
import RadioWidget from './RadioWidget/RadioWidget.tsx';
import RangeWidget from './RangeWidget/RangeWidget.tsx';
import RatingWidget from './RatingWidget/RatingWidget.tsx';
import SelectWidget from './SelectWidget/SelectWidget.tsx';
import TextareaWidget from './TextareaWidget/TextareaWidget.tsx';
import TimeWidget from './TimeWidget/TimeWidget.tsx';
import ToggleWidget from './ToggleWidget/ToggleWidget.tsx';

export {
  AltDateTimeWidget,
  AltDateWidget,
  CheckboxesWidget,
  CheckboxWidget,
  DateTimeWidget,
  DateWidget,
  RadioWidget,
  RangeWidget,
  RatingWidget,
  SelectWidget,
  TextareaWidget,
  TimeWidget,
  ToggleWidget,
};

export function generateWidgets<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): RegistryWidgetsType<T, S, F> {
  return {
    AltDateTimeWidget,
    AltDateWidget,
    CheckboxesWidget,
    CheckboxWidget,
    DateTimeWidget,
    DateWidget,
    RadioWidget,
    RangeWidget,
    RatingWidget,
    SelectWidget,
    TextareaWidget,
    TimeWidget,
    toggle: ToggleWidget,
  };
}

export default generateWidgets;
