import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { Markdown as MarkdownType } from 'markdown-to-jsx/react';

/** The shape of the lazily loaded `markdown-to-jsx/react` module */
interface MarkdownModule {
  Markdown: typeof MarkdownType;
}

/** The shared loading promise for the markdown renderer, created on first use */
let markdownPromise: Promise<MarkdownModule> | undefined;

/** The loaded markdown renderer module, set once the loading promise has resolved. When set,
 * `LazyMarkdown` renders synchronously.
 */
let markdownModule: MarkdownModule | undefined;

/** Loads the markdown renderer, memoizing the loading promise. A failed load (e.g. offline, or a
 * stale chunk after a redeploy) clears the memo so a later mount can retry instead of caching the
 * rejection forever.
 */
async function loadMarkdown(): Promise<MarkdownModule> {
  markdownPromise ??= import('markdown-to-jsx/react').catch((error: unknown) => {
    markdownPromise = undefined;
    throw error;
  });
  markdownModule = await markdownPromise;
  return markdownModule;
}

/** Starts loading the `markdown-to-jsx` renderer used by `LazyMarkdown`. Once the returned promise
 * has resolved, `LazyMarkdown` renders synchronously; calling this ahead of time (e.g. when a form
 * is known to render markdown) therefore avoids the brief `SimpleMarkdown` fallback that is
 * otherwise shown while the renderer loads on first render
 */
export async function preloadMarkdown(): Promise<void> {
  await loadMarkdown();
}

/** Matches the simple markdown constructs used by the `TranslatableString` templates: `**bold**`,
 * `__bold__`, `_italics_` and `` `code` ``. The underscore forms capture their preceding character
 * (start of text, whitespace or an opening parenthesis) so that intra-word underscores, as in
 * `snake_case_names`, are left alone
 */
const reSimpleMarkdown = /\*\*(.+?)\*\*|`(.+?)`|(^|[\s(])__(.+?)__(?![\w])|(^|[\s(])_(.+?)_(?![\w])/g;

/** Renders the simple markdown constructs `**bold**`, `__bold__`, `_italics_` and `` `code` `` in
 * `text` as React elements, leaving everything else as plain text. Used as the fallback while the
 * full markdown renderer is loading (or when it cannot be loaded at all), so the markdown used by
 * RJSF's own `TranslatableString` templates renders correctly even without it.
 *
 * @param props - The props containing the `text` to render
 */
export function SimpleMarkdown({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(reSimpleMarkdown)) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [whole, bold, code, boldPrefix, boldAlt, italicsPrefix, italics] = match;
    const prefix = boldPrefix ?? italicsPrefix;
    if (prefix) {
      parts.push(prefix);
    }
    if (bold !== undefined || boldAlt !== undefined) {
      parts.push(<strong key={match.index}>{bold ?? boldAlt}</strong>);
    } else if (italics !== undefined) {
      parts.push(<em key={match.index}>{italics}</em>);
    } else {
      parts.push(<code key={match.index}>{code}</code>);
    }
    lastIndex = match.index + whole.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

/** The props for `LazyMarkdown`, matching the `markdown-to-jsx` `Markdown` component except that the
 * content must be a string
 */
export type LazyMarkdownProps = Omit<ComponentProps<typeof MarkdownType>, 'children'> & {
  /** The markdown content to render */
  children: string;
};

/** Renders the `children` markdown using a lazily loaded `markdown-to-jsx`, keeping that sizable
 * dependency out of the eager bundle so forms that never render markdown never download it. Content
 * is shown with `SimpleMarkdown` formatting until the renderer has loaded; once loaded, rendering is
 * synchronous and identical to using `markdown-to-jsx` directly. In environments where the renderer
 * cannot be loaded at all (e.g. a runtime without dynamic import support), the `SimpleMarkdown`
 * formatting is used instead of crashing. Raw HTML parsing is disabled by default and can be
 * re-enabled explicitly via `options`.
 *
 * @param props - The `LazyMarkdownProps` for this component
 */
export default function LazyMarkdown({ children, options, ...rest }: LazyMarkdownProps) {
  const [module, setModule] = useState(markdownModule);
  useEffect(() => {
    if (!module) {
      let active = true;
      loadMarkdown().then(
        (mod) => {
          if (active) {
            setModule(mod);
          }
        },
        () => {
          // Leave the SimpleMarkdown rendering in place; a later mount will retry the load
        },
      );
      return () => {
        active = false;
      };
    }
    return undefined;
  }, [module]);
  if (!module) {
    return <SimpleMarkdown text={children} />;
  }
  const { Markdown } = module;
  return (
    <Markdown options={{ disableParsingRawHTML: true, ...options }} {...rest}>
      {children}
    </Markdown>
  );
}
