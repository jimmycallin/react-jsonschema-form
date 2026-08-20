import { render, screen, within } from '@testing-library/react';

import LazyMarkdown, { preloadMarkdown, SimpleMarkdown } from '../src/components/LazyMarkdown';

describe('SimpleMarkdown', () => {
  test('renders plain text unchanged', () => {
    const { container } = render(<SimpleMarkdown text='just plain text' />);
    expect(container).toHaveTextContent('just plain text');
    expect(container.querySelector('strong')).toBeNull();
  });
  test('renders **bold**, _italics_ and `code` as elements', () => {
    const { container } = render(<SimpleMarkdown text='a **bold** and _slanted_ bit of `code` here' />);
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('em')).toHaveTextContent('slanted');
    expect(container.querySelector('code')).toHaveTextContent('code');
    expect(container).toHaveTextContent('a bold and slanted bit of code here');
  });
  test('renders __bold__ same as **bold**', () => {
    const { container } = render(<SimpleMarkdown text='a __strong__ statement' />);
    expect(container.querySelector('strong')).toHaveTextContent('strong');
    expect(container).toHaveTextContent('a strong statement');
  });
  test('leaves intra-word underscores alone', () => {
    const { container } = render(<SimpleMarkdown text='use the snake_case_names field' />);
    expect(container.querySelector('em')).toBeNull();
    expect(container).toHaveTextContent('use the snake_case_names field');
  });
  test('renders multiple occurrences of the same construct', () => {
    const { container } = render(<SimpleMarkdown text='**one** and **two**' />);
    const bolds = container.querySelectorAll('strong');
    expect(bolds).toHaveLength(2);
    expect(bolds[1]).toHaveTextContent('two');
  });
});

describe('LazyMarkdown', () => {
  test('renders full markdown once the renderer has loaded', async () => {
    render(
      <LazyMarkdown options={{ disableParsingRawHTML: true }} data-testid='lazy-md'>
        **Rich** [link](https://example.com)
      </LazyMarkdown>,
    );
    const markdown = await screen.findByTestId('lazy-md');
    expect(within(markdown).getByRole('link')).toHaveAttribute('href', 'https://example.com');
    expect(markdown.querySelector('strong')).toHaveTextContent('Rich');
  });
  test('renders the simple constructs in the fallback and the full renderer identically', async () => {
    const text = 'pick a **file** or _drop_ one';
    const { container } = render(<LazyMarkdown data-testid='lazy-md2'>{text}</LazyMarkdown>);
    expect(container).toHaveTextContent('pick a file or drop one');
    await screen.findByTestId('lazy-md2');
    expect(container.querySelector('strong')).toHaveTextContent('file');
    expect(container.querySelector('em')).toHaveTextContent('drop');
  });
  test('renders synchronously without a fallback pass once preloaded', async () => {
    await preloadMarkdown();
    const { container } = render(<LazyMarkdown>**already** here</LazyMarkdown>);
    expect(container.querySelector('strong')).toHaveTextContent('already');
  });
});
