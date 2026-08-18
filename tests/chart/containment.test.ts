import { describe, expect, it } from 'vitest';

import { NORTH_INDIAN, southIndianGeometry } from '@/lib/chart-render/geometry';
import { inscribedBox, layoutGrahas, pointInPolygon } from '@/lib/chart-render/layout';

/*
  The property that was silently false.

  Every cell used to carry an anchor point and a capacity number, and labels were
  stacked around that point with no reference to the cell's shape. In a corner
  triangle a four-graha stack ran out through the diagonal into the neighbouring
  house — visible in a real chart where Moon, Jupiter, Mars and Sun share the 9th.

  A single example fix would not have been enough, because the same thing waits
  for any other crowded house. So the assertion here is the general one: for every
  cell of every style, and for one graha up to nine in it, every corner of every
  label's box lies inside that cell's own polygon.
*/

/*
  South Indian geometry depends on the ascendant, because in that style the signs
  are fixed and the houses move around them. Two ascendants are checked so the
  assertion covers cells in different positions rather than one arrangement.
*/
const STYLES = [NORTH_INDIAN, southIndianGeometry(0), southIndianGeometry(7)];

/** The rectangle a label actually paints, given its centre and the type size. */
function labelBox(centre: { x: number; y: number }, fontSize: number, withDegrees: boolean) {
  const halfWidth = (fontSize * (withDegrees ? 3.3 : 1.5)) / 2;
  // Cap height above the baseline plus a little descender room below; the labels
  // are drawn with dominant-baseline central, so the glyph straddles the centre.
  const halfHeight = fontSize * 0.62;
  return [
    { x: centre.x - halfWidth, y: centre.y - halfHeight },
    { x: centre.x + halfWidth, y: centre.y - halfHeight },
    { x: centre.x + halfWidth, y: centre.y + halfHeight },
    { x: centre.x - halfWidth, y: centre.y + halfHeight },
  ];
}

describe('graha labels stay inside their own house', () => {
  for (const style of STYLES) {
    describe(style.id, () => {
      it('finds a usable box inside every cell', () => {
        for (const cell of style.cells) {
          const box = inscribedBox(cell.polygon);
          expect(box.width, `house ${cell.house} width`).toBeGreaterThan(3);
          expect(box.height, `house ${cell.house} height`).toBeGreaterThan(2);
          expect(pointInPolygon({ x: box.x, y: box.y }, cell.polygon)).toBe(true);
        }
      });

      for (const count of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        it(`keeps ${count} graha${count === 1 ? '' : 's'} inside every cell`, () => {
          for (const cell of style.cells) {
            const box = inscribedBox(cell.polygon);
            const layout = layoutGrahas(box, count, { wantDegrees: count <= 3 });

            expect(layout.positions).toHaveLength(count);

            for (const [i, position] of layout.positions.entries()) {
              for (const corner of labelBox(position, layout.fontSize, layout.withDegrees)) {
                expect(
                  pointInPolygon(corner, cell.polygon),
                  `${style.id} house ${cell.house}: label ${i + 1} of ${count} ` +
                    `corner (${corner.x.toFixed(2)}, ${corner.y.toFixed(2)}) left the cell`,
                ).toBe(true);
              }
            }
          }
        });
      }
    });
  }
});

describe('the case from the reported chart', () => {
  it('fits Moon, Jupiter, Mars and Sun inside the 9th house triangle', () => {
    const ninth = NORTH_INDIAN.cells.find((c) => c.house === 9);
    expect(ninth).toBeDefined();

    const box = inscribedBox(ninth!.polygon);
    const layout = layoutGrahas(box, 4, { wantDegrees: false });

    for (const position of layout.positions) {
      for (const corner of labelBox(position, layout.fontSize, layout.withDegrees)) {
        expect(pointInPolygon(corner, ninth!.polygon)).toBe(true);
      }
    }
  });
});
