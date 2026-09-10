import type { MarkdownTemplateProps } from '@rjsf/utils';
import { getTestIds } from '@rjsf/utils';
import { Markdown } from 'markdown-to-jsx/react';

const TEST_IDS = getTestIds();

/** Renders markdown with raw HTML parsing disabled. Only exported from `@rjsf/core/markdown`, never the root, so that
 * `markdown-to-jsx` can be an optional peer dependency: a consumer that never imports this subpath never has to
 * install or resolve it.
 */
export default function MarkdownTemplate({ children }: MarkdownTemplateProps) {
  return (
    <Markdown options={{ disableParsingRawHTML: true }} data-testid={TEST_IDS.markdown}>
      {children}
    </Markdown>
  );
}

MarkdownTemplate.TEST_IDS = TEST_IDS;
