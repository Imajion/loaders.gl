import type { LoaderWithParser, LoaderOptions } from '@loaders.gl/loader-utils';
import type { DracoLoaderOptions } from '@loaders.gl/draco';
import type { ImageLoaderOptions } from '@loaders.gl/images';
export type Tiles3DLoaderOptions = LoaderOptions & DracoLoaderOptions & ImageLoaderOptions & {
    '3d-tiles'?: {
        /** Whether to parse any embedded glTF binaries (or extract memory for independent glTF parsing) */
        loadGLTF?: boolean;
        /** If renderer doesn't support quantized positions, loader can decode them on CPU */
        decodeQuantizedPositions?: boolean;
        /** Whether this is a tileset or a tile */
        isTileset?: boolean | 'auto';
        /** Controls which axis is "up" in glTF files */
        assetGltfUpAxis?: 'x' | 'y' | 'z' | null;
    };
};
/**
 * Loader for 3D Tiles
 */
export declare const Tiles3DLoader: LoaderWithParser;
//# sourceMappingURL=tiles-3d-loader.d.ts.map