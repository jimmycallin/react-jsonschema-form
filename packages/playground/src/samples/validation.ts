import type { CustomValidator, ErrorTransformer, FieldValidation } from '@rjsf/utils';
import { isObject } from '@rjsf/utils';

import type { Sample } from './Sample';

const customValidate: CustomValidator = (formData, errors) => {
  if (isObject(formData) && formData.pass1 !== formData.pass2) {
    // `errors` is keyed by the form's properties; this sample's schema has a `pass2` field
    const pass2Errors = errors.pass2 as FieldValidation | undefined;
    pass2Errors?.addError("Passwords don't match.");
  }
  return errors;
};

const transformErrors: ErrorTransformer = (errors) =>
  errors.map((error) => {
    if (error.name === 'minimum' && error.schemaPath === '#/properties/age/minimum') {
      return { ...error, message: 'You need to be 18 because of some legal thing' };
    }
    if (error.name === 'required') {
      return { ...error, message: `${error.title} is a required field` };
    }
    return error;
  });

const validation: Sample = {
  schema: {
    title: 'Custom validation',
    description:
      'This form defines custom validation rules checking that the two passwords match. There is also a custom validation message when submitting an age < 18, which can only be seen if HTML5 validation is turned off.',
    type: 'object',
    required: ['firstName'],
    properties: {
      firstName: {
        title: 'First Name',
        type: 'string',
      },
      pass1: {
        title: 'Password',
        type: 'string',
        minLength: 3,
      },
      pass2: {
        title: 'Repeat password',
        type: 'string',
        minLength: 3,
      },
      age: {
        title: 'Age',
        type: 'number',
        minimum: 18,
      },
    },
  },
  uiSchema: {
    pass1: { 'ui:widget': 'password' },
    pass2: { 'ui:widget': 'password' },
  },
  formData: {},
  customValidate,
  transformErrors,
};

export default validation;
