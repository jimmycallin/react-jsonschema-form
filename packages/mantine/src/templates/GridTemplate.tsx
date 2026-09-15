import type { MantineSpacing, StyleProp } from '@mantine/core';
import { Container, Grid } from '@mantine/core';
import type { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for mantine, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid`/`Grid.Col`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the Mantine grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, fluid = true, gutter, gap = gutter, ...rest } = props;
  // `gutter`/`gap` come out of the arbitrarily-keyed `ui:row`/`ui:col` options, so they arrive as `unknown`; Mantine
  // validates the spacing value itself, so whatever the caller set is passed straight through
  const gridGap = gap as StyleProp<MantineSpacing> | undefined;

  if (column) {
    return <Grid.Col {...rest}>{children}</Grid.Col>;
  }

  // Grid with fluid container
  if (fluid) {
    return (
      <Container fluid p='4' mx={0} w='100%'>
        <Grid gap={gridGap} {...rest}>
          {children}
        </Grid>
      </Container>
    );
  }
  // Grid without container
  return (
    <Grid grow gap={gridGap} {...rest}>
      {children}
    </Grid>
  );
}
