"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tiles3DLoader = void 0;
const loader_utils_1 = require("@loaders.gl/loader-utils");
const tiles_1 = require("@loaders.gl/tiles");
const version_1 = require("./lib/utils/version");
const parse_3d_tile_1 = require("./lib/parsers/parse-3d-tile");
const parse_3d_tile_header_1 = require("./lib/parsers/parse-3d-tile-header");
/**
 * Loader for 3D Tiles
 */
exports.Tiles3DLoader = {
    id: '3d-tiles',
    name: '3D Tiles',
    module: '3d-tiles',
    version: version_1.VERSION,
    extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
    mimeTypes: ['application/octet-stream'],
    tests: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
    parse,
    options: {
        '3d-tiles': {
            loadGLTF: true,
            decodeQuantizedPositions: false,
            isTileset: 'auto',
            assetGltfUpAxis: null
        }
    }
};
/** Parses a tileset or tile */
async function parse(data, options = {}, context) {
    // auto detect file type
    const loaderOptions = options['3d-tiles'] || {};
    let isTileset;
    if (loaderOptions.isTileset === 'auto') {
        isTileset = context?.url && context.url.indexOf('.json') !== -1;
    }
    else {
        isTileset = loaderOptions.isTileset;
    }
    return isTileset ? parseTileset(data, options, context) : parseTile(data, options, context);
}
/** Parse a tileset */
async function parseTileset(data, options, context) {
    const tilesetJson = JSON.parse(new TextDecoder().decode(data));
    const tilesetUrl = context?.url || '';
    const basePath = getBaseUri(tilesetUrl);
    const normalizedRoot = await (0, parse_3d_tile_header_1.normalizeTileHeaders)(tilesetJson, basePath, options || {});
    const tilesetJsonPostprocessed = {
        ...tilesetJson,
        loader: exports.Tiles3DLoader,
        url: tilesetUrl,
        queryString: context?.queryString || '',
        basePath,
        root: normalizedRoot || tilesetJson.root,
        type: tiles_1.TILESET_TYPE.TILES3D,
        lodMetricType: tiles_1.LOD_METRIC_TYPE.GEOMETRIC_ERROR,
        lodMetricValue: tilesetJson.root?.geometricError || 0
    };
    return tilesetJsonPostprocessed;
}
/** Parse a tile */
async function parseTile(arrayBuffer, options, context) {
    const tile = {
        content: {
            featureIds: null
        }
    };
    const byteOffset = 0;
    await (0, parse_3d_tile_1.parse3DTile)(arrayBuffer, byteOffset, options, context, tile.content);
    return tile.content;
}
/** Get base name */
function getBaseUri(tilesetUrl) {
    return loader_utils_1.path.dirname(tilesetUrl);
}
