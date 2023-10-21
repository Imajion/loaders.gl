"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeImplicitTileData = exports.normalizeImplicitTileHeaders = exports.normalizeTileHeaders = exports.normalizeTileData = void 0;
const tile_3d_subtree_loader_1 = require("../../tile-3d-subtree-loader");
const core_1 = require("@loaders.gl/core");
const tiles_1 = require("@loaders.gl/tiles");
const parse_3d_implicit_tiles_1 = require("./helpers/parse-3d-implicit-tiles");
const s2_corners_to_obb_1 = require("../utils/obb/s2-corners-to-obb");
function getTileType(tile, tileContentUrl = '') {
    if (!tileContentUrl) {
        return tiles_1.TILE_TYPE.EMPTY;
    }
    const contentUrl = tileContentUrl.split('?')[0]; // Discard query string
    const fileExtension = contentUrl.split('.').pop();
    switch (fileExtension) {
        case 'pnts':
            return tiles_1.TILE_TYPE.POINTCLOUD;
        case 'i3dm':
        case 'b3dm':
        case 'glb':
        case 'gltf':
            return tiles_1.TILE_TYPE.SCENEGRAPH;
        default:
            return fileExtension || tiles_1.TILE_TYPE.EMPTY;
    }
}
function getRefine(refine) {
    switch (refine) {
        case 'REPLACE':
        case 'replace':
            return tiles_1.TILE_REFINEMENT.REPLACE;
        case 'ADD':
        case 'add':
            return tiles_1.TILE_REFINEMENT.ADD;
        default:
            return refine;
    }
}
function resolveUri(uri = '', basePath) {
    // url scheme per RFC3986
    const urlSchemeRegex = /^[a-z][0-9a-z+.-]*:/i;
    if (urlSchemeRegex.test(basePath)) {
        const url = new URL(uri, `${basePath}/`);
        return decodeURI(url.toString());
    }
    else if (uri.startsWith('/')) {
        return uri;
    }
    return `${basePath}/${uri}`;
}
function normalizeTileData(tile, basePath) {
    if (!tile) {
        return null;
    }
    let tileContentUrl;
    if (tile.content) {
        const contentUri = tile.content.uri || tile.content?.url;
        tileContentUrl = resolveUri(contentUri, basePath);
    }
    const tilePostprocessed = {
        ...tile,
        id: tileContentUrl,
        contentUrl: tileContentUrl,
        lodMetricType: tiles_1.LOD_METRIC_TYPE.GEOMETRIC_ERROR,
        lodMetricValue: tile.geometricError,
        transformMatrix: tile.transform,
        type: getTileType(tile, tileContentUrl),
        refine: getRefine(tile.refine)
    };
    return tilePostprocessed;
}
exports.normalizeTileData = normalizeTileData;
// normalize tile headers
async function normalizeTileHeaders(tileset, basePath, options) {
    let root = null;
    const rootImplicitTilingExtension = getImplicitTilingExtensionData(tileset.root);
    if (rootImplicitTilingExtension && tileset.root) {
        root = await normalizeImplicitTileHeaders(tileset.root, tileset, basePath, rootImplicitTilingExtension, options);
    }
    else {
        root = normalizeTileData(tileset.root, basePath);
    }
    const stack = [];
    stack.push(root);
    while (stack.length > 0) {
        const tile = stack.pop() || {};
        const children = tile.children || [];
        const childrenPostprocessed = [];
        for (const childHeader of children) {
            const childImplicitTilingExtension = getImplicitTilingExtensionData(childHeader);
            let childHeaderPostprocessed;
            if (childImplicitTilingExtension) {
                childHeaderPostprocessed = await normalizeImplicitTileHeaders(childHeader, tileset, basePath, childImplicitTilingExtension, options);
            }
            else {
                childHeaderPostprocessed = normalizeTileData(childHeader, basePath);
            }
            if (childHeaderPostprocessed) {
                childrenPostprocessed.push(childHeaderPostprocessed);
                stack.push(childHeaderPostprocessed);
            }
        }
        tile.children = childrenPostprocessed;
    }
    return root;
}
exports.normalizeTileHeaders = normalizeTileHeaders;
/**
 * Do normalisation of implicit tile headers
 * TODO Check if Tile3D class can be a return type here.
 * @param tileset
 */
async function normalizeImplicitTileHeaders(tile, tileset, basePath, implicitTilingExtension, options) {
    const { subdivisionScheme, maximumLevel, subtreeLevels, subtrees: { uri: subtreesUriTemplate } } = implicitTilingExtension;
    const replacedUrlTemplate = (0, parse_3d_implicit_tiles_1.replaceContentUrlTemplate)(subtreesUriTemplate, 0, 0, 0, 0);
    const subtreeUrl = resolveUri(replacedUrlTemplate, basePath);
    const subtree = await (0, core_1.load)(subtreeUrl, tile_3d_subtree_loader_1.Tile3DSubtreeLoader, options);
    const contentUrlTemplate = resolveUri(tile.content?.uri, basePath);
    const refine = tileset?.root?.refine;
    // @ts-ignore
    const rootLodMetricValue = tile.geometricError;
    // Replace tile.boundingVolume with the the bounding volume specified by the extensions['3DTILES_bounding_volume_S2']
    const s2VolumeInfo = tile.boundingVolume.extensions?.['3DTILES_bounding_volume_S2'];
    if (s2VolumeInfo) {
        const box = (0, s2_corners_to_obb_1.convertS2BoundingVolumetoOBB)(s2VolumeInfo);
        const s2VolumeBox = { box, s2VolumeInfo };
        tile.boundingVolume = s2VolumeBox;
    }
    const rootBoundingVolume = tile.boundingVolume;
    const implicitOptions = {
        contentUrlTemplate,
        subtreesUriTemplate,
        subdivisionScheme,
        subtreeLevels,
        maximumLevel,
        refine,
        basePath,
        lodMetricType: tiles_1.LOD_METRIC_TYPE.GEOMETRIC_ERROR,
        rootLodMetricValue,
        rootBoundingVolume,
        getTileType,
        getRefine
    };
    return await normalizeImplicitTileData(tile, basePath, subtree, implicitOptions);
}
exports.normalizeImplicitTileHeaders = normalizeImplicitTileHeaders;
/**
 * Do implicit data normalisation to create hierarchical tile structure
 * @param tile
 * @param rootSubtree
 * @param options
 * @returns
 */
async function normalizeImplicitTileData(tile, basePath, rootSubtree, options) {
    if (!tile) {
        return null;
    }
    const { children, contentUrl } = await (0, parse_3d_implicit_tiles_1.parseImplicitTiles)({
        subtree: rootSubtree,
        options
    });
    let tileContentUrl;
    let tileContent = null;
    if (contentUrl) {
        tileContentUrl = contentUrl;
        tileContent = { uri: contentUrl.replace(`${basePath}/`, '') };
    }
    const tilePostprocessed = {
        ...tile,
        id: tileContentUrl,
        contentUrl: tileContentUrl,
        lodMetricType: tiles_1.LOD_METRIC_TYPE.GEOMETRIC_ERROR,
        lodMetricValue: tile.geometricError,
        transformMatrix: tile.transform,
        type: getTileType(tile, tileContentUrl),
        refine: getRefine(tile.refine),
        content: tileContent || tile.content,
        children
    };
    return tilePostprocessed;
}
exports.normalizeImplicitTileData = normalizeImplicitTileData;
/**
 * Implicit Tiling data can be in 3DTILES_implicit_tiling for 3DTiles v.Next or directly in implicitTiling object for 3DTiles v1.1.
 * Spec 3DTiles v.Next - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling
 * Spec 3DTiles v.1.1 - https://github.com/CesiumGS/3d-tiles/tree/draft-1.1/specification/ImplicitTiling
 * @param tile
 * @returns
 */
function getImplicitTilingExtensionData(tile) {
    return tile?.extensions?.['3DTILES_implicit_tiling'] || tile?.implicitTiling;
}
