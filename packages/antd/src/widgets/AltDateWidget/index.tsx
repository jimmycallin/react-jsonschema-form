import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { DateElement, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';
import { Row, Col, Button } from 'antd';

import { getAntdFormContext } from '../../utils';

export default function AltDateWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ autofocus = false, disabled = false, options, readonly = false, time = false, ...props }: WidgetProps<T, S, F>) {
  const { id, name, onBlur, onFocus, registry } = props;
  const { formContext, translateString } = registry;
  const { rowGutter = 24 } = getAntdFormContext(formContext);
  // the date elements sit tighter than a normal row; a responsive/array gutter isn't halveable so it becomes NaN here
  const halfRowGutter = Math.floor(Number(rowGutter) / 2);
  const realOptions = {
    yearsRange: [1900, new Date().getFullYear() + 2],
    ...options,
  };
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps({
    ...props,
    autofocus,
    options: realOptions,
  });

  return (
    <Row gutter={[halfRowGutter, halfRowGutter]}>
      {elements.map((elemProps, i) => {
        const elemId = `${id}_${elemProps.type}`;
        return (
          <Col flex='88px' key={elemId}>
            <DateElement
              rootId={id}
              name={name}
              select={handleChange}
              {...elemProps}
              disabled={disabled}
              readonly={readonly}
              registry={registry}
              onBlur={onBlur}
              onFocus={onFocus}
              autofocus={autofocus && i === 0}
            />
          </Col>
        );
      })}
      {!options.hideNowButton && (
        <Col flex='88px'>
          <Button block className='btn-now' onClick={handleSetNow} type='primary'>
            {translateString(TranslatableString.NowLabel)}
          </Button>
        </Col>
      )}
      {!options.hideClearButton && (
        <Col flex='88px'>
          <Button block className='btn-clear' danger onClick={handleClear} type='primary'>
            {translateString(TranslatableString.ClearLabel)}
          </Button>
        </Col>
      )}
    </Row>
  );
}
