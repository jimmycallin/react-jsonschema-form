import type { ErrorListProps, ErrorSchemaValidationError, FormContextType, RJSFSchema } from '@rjsf/utils';
import type { AjvValidationError } from '@rjsf/validator-ajv8';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import { submitForm } from './testUtils.tsx';

const user = userEvent.setup();

describe('Form: errors typed by the validator', () => {
  const validator = customizeValidator<RJSFSchema, FormContextType, AjvValidationError>();
  const schema: RJSFSchema = {
    type: 'object',
    properties: { code: { type: 'string', minLength: 3 } },
  };

  const describeError = (error: AjvValidationError | ErrorSchemaValidationError) =>
    error.name === 'minLength' ? `needs ${error.params.limit + 0} characters` : error.stack;

  function ErrorListTemplate<T>({
    errors,
  }: Omit<ErrorListProps<T>, 'errors'> & { errors: (AjvValidationError | ErrorSchemaValidationError)[] }) {
    return (
      <ul>
        {errors.map((error) => (
          <li key={error.stack}>{describeError(error)}</li>
        ))}
      </ul>
    );
  }

  it('types the errors of transformErrors, onError and the error list without annotations', async () => {
    const limits: number[] = [];
    const { container } = render(
      <Form
        schema={schema}
        validator={validator}
        initialFormData={{ code: 'ab' }}
        noHtml5Validate
        transformErrors={(errors) =>
          errors.map((error) =>
            error.name === 'minLength' ? { ...error, stack: `code ${error.params.limit}` } : error,
          )
        }
        onError={(errors) =>
          errors.forEach((error) => {
            if (error.name === 'minLength') {
              limits.push(error.params.limit);
            }
          })
        }
        templates={{ ErrorListTemplate }}
      />,
    );

    await submitForm(container, user);

    expect(limits).toEqual([3]);
    expect(screen.getByText('needs 3 characters')).toBeInTheDocument();
  });
});
