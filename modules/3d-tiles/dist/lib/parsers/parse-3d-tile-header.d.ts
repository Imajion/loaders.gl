import type { Tiles3DLoaderOptions } from '../../tiles-3d-loader';
import type { LoaderOptions } from '@loaders.gl/loader-utils';
import { ImplicitTilingExensionData, Subtree, Tiles3DTileJSON, Tiles3DTileJSONPostprocessed, Tiles3DTilesetJSON } from '../../types';
export declare function normalizeTileData(tile: Tiles3DTileJSON | null, basePath: string): Tiles3DTileJSONPostprocessed | null;
export declare function normalizeTileHeaders(tileset: Tiles3DTilesetJSON, basePath: string, options: LoaderOptions): Promise<Tiles3DTileJSONPostprocessed | null>;
/**
 * Do normalisation of implicit tile headers
 * TODO Check if Tile3D class can be a return type here.
 * @param tileset
 */
export declare function normalizeImplicitTileHeaders(tile: Tiles3DTileJSON, tileset: Tiles3DTilesetJSON, basePath: string, implicitTilingExtension: ImplicitTilingExensionData, options: Tiles3DLoaderOptions): Promise<Tiles3DTileJSONPostprocessed | null>;
/**
 * Do implicit data normalisation to create hierarchical tile structure
 * @param tile
 * @param rootSubtree
 * @param options
 * @returns
 */
export declare function normalizeImplicitTileData(tile: Tiles3DTileJSON, basePath: string, rootSubtree: Subtree, options: any): Promise<Tiles3DTileJSONPostprocessed | null>;
//# sourceMappingURL=parse-3d-tile-header.d.ts.map