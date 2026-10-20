/**
 * SVGO pass for shipping. Shapes stay shapes (a circle is clearer than its
 * path, and smaller), elements stay separate (one per letter, so they can be
 * styled or animated one at a time), and the root's stroke attributes are
 * never touched: the SDKs rebuild the root from their props anyway.
 */
import { optimize } from 'svgo';
import { parseSvg, type Node } from './source.ts';

export function optimizeGlyph(source: string, where: string): Node[] {
  const { data } = optimize(source, {
    multipass: true,
    floatPrecision: 3,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            convertShapeToPath: false,
            mergePaths: false,
            removeUselessStrokeAndFill: false,
            removeUnknownsAndDefaults: false,
          },
        },
      },
    ],
  });
  const { children } = parseSvg(data, `${where} (optimized)`);
  if (children.length === 0) throw new Error(`${where}: optimized to nothing`);
  return children;
}
