import { describe, expect, it } from 'vitest';

import { NORTH_INDIAN, southIndianGeometry } from '@/lib/chart-render/geometry';
import { inscribedBox } from '@/lib/chart-render/layout';

/*
  A guard, not a benchmark for its own sake.

  Finding each cell's box samples a 25x25 grid of point-in-polygon tests and then
  bisects, which is roughly 7,500 tests for a twelve-cell chart. The geometry is
  static, so that cost belongs to the first chart only. This asserts the cache is
  actually doing its job: if someone later changes the key, or moves the call
  somewhere it cannot be reused, a warm pass will stop being effectively free and
  this fails rather than the chart quietly getting slow again.
*/
describe('cell boxes are computed once', () => {
  it('is far cheaper warm than cold', () => {
    const styles = [NORTH_INDIAN, southIndianGeometry(0), southIndianGeometry(5)];
    const all = styles.flatMap((s) => s.cells.map((c) => c.polygon));

    const cold0 = performance.now();
    for (const polygon of all) inscribedBox(polygon);
    const cold = performance.now() - cold0;

    const runs = 200;
    const warm0 = performance.now();
    for (let i = 0; i < runs; i++) for (const polygon of all) inscribedBox(polygon);
    const warm = (performance.now() - warm0) / runs;

    // Cold work is real; warm work should be a lookup.
    expect(warm).toBeLessThan(cold / 10);
    expect(warm).toBeLessThan(1);
  });

  it('returns the identical object for the same polygon', () => {
    const polygon = NORTH_INDIAN.cells[8].polygon;
    expect(inscribedBox(polygon)).toBe(inscribedBox(polygon));
  });
});
