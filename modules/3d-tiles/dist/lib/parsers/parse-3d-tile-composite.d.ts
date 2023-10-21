import type { LoaderContext } from '@loaders.gl/loader-utils';
import type { Tiles3DLoaderOptions } from '../../tiles-3d-loader';
/** Resolve circulate dependency by passing in parsing function as argument */
type Parse3DTile = (arrayBuffer: ArrayBuffer, byteOffset: number, options: Tiles3DLoaderOptions, context: LoaderContext, subtile: any) => Promise<number>;
export declare function parseComposite3DTile(tile: any, arrayBuffer: ArrayBuffer, byteOffset: number, options: Tiles3DLoaderOptions, context: LoaderContext, parse3DTile: Parse3DTile): Promise<number>;
export {};
//# sourceMappingURL=parse-3d-tile-composite.d.ts.map