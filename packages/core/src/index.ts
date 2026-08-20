import type { FormProps, FormState, IChangeEvent } from './components/Form';
import Form from './components/Form';
import type { LazyMarkdownProps } from './components/LazyMarkdown';
import LazyMarkdown, { preloadMarkdown } from './components/LazyMarkdown';
import type { RichDescriptionProps } from './components/RichDescription';
import RichDescription from './components/RichDescription';
import type { RichHelpProps } from './components/RichHelp';
import RichHelp from './components/RichHelp';
import type { SchemaExamplesProps } from './components/SchemaExamples';
import SchemaExamples from './components/SchemaExamples';
import getDefaultRegistry from './getDefaultRegistry';
import getTestRegistry from './getTestRegistry';
import type { ThemeProps } from './withTheme';
import withTheme from './withTheme';

export type {
  FormProps,
  FormState,
  IChangeEvent,
  LazyMarkdownProps,
  ThemeProps,
  RichDescriptionProps,
  RichHelpProps,
  SchemaExamplesProps,
};

export {
  withTheme,
  getDefaultRegistry,
  getTestRegistry,
  LazyMarkdown,
  preloadMarkdown,
  RichDescription,
  RichHelp,
  SchemaExamples,
};
export default Form;
