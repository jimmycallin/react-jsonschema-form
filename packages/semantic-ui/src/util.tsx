import type { ElementType, ReactNode } from 'react';
import type { UiSchema, GenericObjectType, FormContextType, RJSFSchema, UIOptionsType } from '@rjsf/utils';
import { getUiOptions, isObject } from '@rjsf/utils';

/** The props the semantic-ui theme forwards to its Semantic UI components. These arrive from the `formContext`, the
 * `uiSchema` or the `ui:options`, all of which are arbitrarily-keyed, so they are read through `asSemanticOptions()`.
 */
export interface SemanticOptions extends GenericObjectType {
  /** The props to forward to the component that renders a field's errors */
  errorOptions?: GenericObjectType;
}

/** Narrows a `semantic` entry read out of a `formContext`, `uiSchema` or `ui:options` to the theme's options shape.
 * Those containers are arbitrarily keyed so the lookup yields `unknown`; anything that is not an object cannot be a
 * set of component props, so it is treated as absent. This is the theme's single narrowing point for those reads.
 *
 * @param value - The `semantic` value read out of one of those containers
 * @returns - The value as `SemanticOptions`, or undefined when it is not an object
 */
export function asSemanticOptions(value: unknown): SemanticOptions | undefined {
  return isObject(value) ? (value as SemanticOptions) : undefined;
}

export interface SemanticPropsTypes<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  formContext?: F;
  uiSchema?: UiSchema<T, S, F>;
  options?: UIOptionsType<T, S, F>;
  defaultSchemaProps?: GenericObjectType;
  defaultContextProps?: GenericObjectType;
}

export interface SemanticErrorPropsType<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  formContext?: F;
  uiSchema?: UiSchema<T, S, F>;
  options?: UIOptionsType<T, S, F>;
  defaultProps?: GenericObjectType;
}

export type WrapProps = GenericObjectType & {
  wrap: boolean;
  component?: ElementType;
  children?: ReactNode;
};

/**
 * Extract props meant for semantic UI components from props that are
 * passed to Widgets, Templates and Fields.
 * @param {Object} params
 * @param {Object?} params.formContext
 * @param {Object?} params.uiSchema
 * @param {Object?} params.options
 * @param {Object?} params.defaultSchemaProps
 * @param {Object?} params.defaultContextProps
 * @returns {any}
 */
export function getSemanticProps<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  formContext = {} as F,
  uiSchema = {},
  options = {},
  defaultSchemaProps = { fluid: true, inverted: false },
  defaultContextProps = {},
}: SemanticPropsTypes<T, S, F>) {
  const formContextProps = asSemanticOptions(formContext.semantic);
  const schemaProps = asSemanticOptions(getUiOptions<T, S, F>(uiSchema).semantic);
  const optionProps = asSemanticOptions(options.semantic);
  // formContext props should overide other props
  return {
    ...defaultSchemaProps,
    ...defaultContextProps,
    ...schemaProps,
    ...optionProps,
    ...formContextProps,
  };
}

/**
 * Extract error props meant for semantic UI components from props that are
 * passed to Widgets, Templates and Fields.
 * @param {Object} params
 * @param {Object?} params.formContext
 * @param {Object?} params.uiSchema
 * @param {Object?} params.defaultProps
 * @returns {any}
 */
export function getSemanticErrorProps<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  formContext = {} as F,
  uiSchema = {},
  options = {},
  defaultProps = { size: 'small', pointing: 'above' },
}: SemanticErrorPropsType<T, S, F>) {
  const formContextProps = asSemanticOptions(formContext.semantic)?.errorOptions;
  const schemaProps = asSemanticOptions(getUiOptions<T, S, F>(uiSchema).semantic)?.errorOptions;
  const optionProps = asSemanticOptions(options.semantic)?.errorOptions;

  return { ...defaultProps, ...schemaProps, ...optionProps, ...formContextProps };
}

/**
 * Combine multiple strings containing class names into a single string,
 * removing duplicates. E.g.
 * cleanClassNames('bar', 'baz bar', 'x y ', undefined)
 * // 'bar baz x y'
 * @param {Array} classNameArr
 * @param {Array} omit
 * @returns {string}
 */
export function cleanClassNames(classNameArr: (string | undefined)[], omit: string[] = []) {
  // Split each arg on whitespace, and add it to an array. Skip false-y args
  // like "" and undefined.
  const classList = classNameArr
    .filter(Boolean)
    .reduce<string[]>((previous, current) => previous.concat(current!.trim().split(/\s+/)), []);

  // Remove any class names from omit, and make the rest unique before
  // returning them as a string
  return [...new Set(classList.filter((cn) => !omit.includes(cn)))].join(' ');
}

/**
 *
 * @param {boolean} wrap
 * @param Component
 * @param {Object} props
 * @returns {*}
 * @constructor
 */
export function MaybeWrap({ wrap, component: Component = 'div', ...props }: WrapProps) {
  return wrap ? <Component {...props} /> : props.children;
}
