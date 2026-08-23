import type { FormContextType, RJSFSchema, TemplatesType } from '@rjsf/utils';

import AddButton from '../AddButton';
import ArrayFieldItemTemplate from '../ArrayFieldItemTemplate';
import ArrayFieldTemplate from '../ArrayFieldTemplate';
import BaseInputTemplate from '../BaseInputTemplate';
import CyclicSchemaExpandTemplate from '../CyclicSchemaExpandTemplate';
import DescriptionField from '../DescriptionField';
import ErrorList from '../ErrorList';
import FieldErrorTemplate from '../FieldErrorTemplate';
import FieldHelpTemplate from '../FieldHelpTemplate';
import FieldTemplate from '../FieldTemplate';
import GridTemplate from '../GridTemplate';
import { CopyButton, MoveDownButton, MoveUpButton, RemoveButton, ClearButton } from '../IconButton';
import MultiSchemaFieldTemplate from '../MultiSchemaFieldTemplate';
import ObjectFieldTemplate from '../ObjectFieldTemplate';
import OptionalDataControlsTemplate from '../OptionalDataControlsTemplate';
import SubmitButton from '../SubmitButton';
import TitleField from '../TitleField';
import WrapIfAdditionalTemplate from '../WrapIfAdditionalTemplate';

export function generateTemplates<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    BaseInputTemplate,
    CyclicSchemaExpandTemplate,
    ButtonTemplates: {
      AddButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      SubmitButton,
      ClearButton,
    },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    GridTemplate,
    MultiSchemaFieldTemplate,
    ObjectFieldTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate: TitleField,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
