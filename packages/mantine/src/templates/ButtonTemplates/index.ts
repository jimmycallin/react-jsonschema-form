import type { FormContextType, RJSFSchema, TemplatesType } from '@rjsf/utils';

import AddButton from './AddButton.tsx';
import { CopyButton, MoveDownButton, MoveUpButton, RemoveButton, ClearButton } from './IconButton.tsx';
import SubmitButton from './SubmitButton.tsx';

function buttonTemplates<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): TemplatesType<T, S, F>['ButtonTemplates'] {
  return {
    SubmitButton,
    AddButton,
    CopyButton,
    MoveDownButton,
    MoveUpButton,
    RemoveButton,
    ClearButton,
  };
}

export default buttonTemplates;
