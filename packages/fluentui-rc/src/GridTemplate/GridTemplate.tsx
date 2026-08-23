import type { CSSProperties } from 'react';
import { GridShim, grid } from '@fluentui/react-migration-v0-v9';
import type { GridTemplateProps } from '@rjsf/utils';

/** The extra props that the fluentui-rc `GridTemplate` reads. Every extra prop of `GridTemplateProps` is typed
 * `unknown`, since a caller can pass anything through the layout grid `uiSchema`, so this names the ones this theme
 * understands rather than narrowing them at each read site.
 */
interface FluentUIRCGridTemplateProps extends GridTemplateProps {
  /** The CSS `grid-template-columns` value for a grid row */
  columns?: string;
  /** The CSS `grid-template-rows` value for a grid row */
  rows?: string;
  /** The grid positioning styles for this grid element */
  style?: CSSProperties;
}

/** Renders a `GridTemplate` for fluentui-rc, which is expecting the column sizing information coming in via the
 * `style` by the caller, which are spread directly on the `GridShim` if `columns` or `rows` are provided. Otherwise,
 * the `style` is added to a simple grid. This was done because `fluentui-rc` uses the CSS Grid which defines all of
 * the column/row/grid information via style.
 *
 * @param props - The GridTemplateProps, including the extra props containing the fluentui-rc grid positioning details
 */
export default function GridTemplate(props: FluentUIRCGridTemplateProps) {
  const { children, column, columns, rows, style, ...rest } = props;
  if (columns || rows) {
    // Use the `grid` rows/columns functions to generate the additional grid styling
    // `grid.rows()`/`grid.columns()` are typed as full Griffel style objects, but only ever return the
    // `gridTemplateRows`/`gridTemplateColumns` declarations, which are plain CSS properties
    const styles: CSSProperties = {
      ...style,
      ...(rows ? (grid.rows(rows) as CSSProperties) : undefined),
      ...(columns ? (grid.columns(columns) as CSSProperties) : undefined),
    };
    return (
      <GridShim style={styles} {...rest}>
        {children}
      </GridShim>
    );
  }
  return (
    <div style={style} {...rest}>
      {children}
    </div>
  );
}
