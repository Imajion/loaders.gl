import { Tile3DSubtreeLoader } from '../../tile-3d-subtree-loader';
import { load } from '@loaders.gl/core';
import { LOD_METRIC_TYPE, TILE_REFINEMENT, TILE_TYPE } from '@loaders.gl/tiles';
import { parseImplicitTiles, replaceContentUrlTemplate } from './helpers/parse-3d-implicit-tiles';
import { convertS2BoundingVolumetoOBB } from '../utils/obb/s2-corners-to-obb';
function getTileType(tile) {
  let tileContentUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  if (!tileContentUrl) {
    return TILE_TYPE.EMPTY;
  }
  const contentUrl = tileContentUrl.split('?')[0];
  const fileExtension = contentUrl.split('.').pop();
  switch (fileExtension) {
    case 'pnts':
      return TILE_TYPE.POINTCLOUD;
    case 'i3dm':
    case 'b3dm':
    case 'glb':
    case 'gltf':
      return TILE_TYPE.SCENEGRAPH;
    default:
      return fileExtension || TILE_TYPE.EMPTY;
  }
}
function getRefine(refine) {
  switch (refine) {
    case 'REPLACE':
    case 'replace':
      return TILE_REFINEMENT.REPLACE;
    case 'ADD':
    case 'add':
      return TILE_REFINEMENT.ADD;
    default:
      return refine;
  }
}
function resolveUri() {
  let uri = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  let basePath = arguments.length > 1 ? arguments[1] : undefined;
  const urlSchemeRegex = /^[a-z][0-9a-z+.-]*:/i;
  if (urlSchemeRegex.test(basePath)) {
    const url = new URL(uri, "".concat(basePath, "/"));
    return decodeURI(url.toString());
  } else if (uri.startsWith('/')) {
    return uri;
  }
  return "".concat(basePath, "/").concat(uri);
}
export function normalizeTileData(tile, basePath) {
  if (!tile) {
    return null;
  }
  let tileContentUrl;
  if (tile.content) {
    var _tile$content;
    const contentUri = tile.content.uri || ((_tile$content = tile.content) === null || _tile$content === void 0 ? void 0 : _tile$content.url);
    tileContentUrl = resolveUri(contentUri, basePath);
  }
  const tilePostprocessed = {
    ...tile,
    id: tileContentUrl,
    contentUrl: tileContentUrl,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    lodMetricValue: tile.geometricError,
    transformMatrix: tile.transform,
    type: getTileType(tile, tileContentUrl),
    refine: getRefine(tile.refine)
  };
  return tilePostprocessed;
}
export async function normalizeTileHeaders(tileset, basePath, options) {
  let root = null;
  const rootImplicitTilingExtension = getImplicitTilingExtensionData(tileset.root);
  if (rootImplicitTilingExtension && tileset.root) {
    root = await normalizeImplicitTileHeaders(tileset.root, tileset, basePath, rootImplicitTilingExtension, options);
  } else {
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
      } else {
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
export async function normalizeImplicitTileHeaders(tile, tileset, basePath, implicitTilingExtension, options) {
  var _tile$content2, _tileset$root, _tile$boundingVolume$;
  const {
    subdivisionScheme,
    maximumLevel,
    subtreeLevels,
    subtrees: {
      uri: subtreesUriTemplate
    }
  } = implicitTilingExtension;
  const replacedUrlTemplate = replaceContentUrlTemplate(subtreesUriTemplate, 0, 0, 0, 0);
  const subtreeUrl = resolveUri(replacedUrlTemplate, basePath);
  const subtree = await load(subtreeUrl, Tile3DSubtreeLoader, options);
  const contentUrlTemplate = resolveUri((_tile$content2 = tile.content) === null || _tile$content2 === void 0 ? void 0 : _tile$content2.uri, basePath);
  const refine = tileset === null || tileset === void 0 ? void 0 : (_tileset$root = tileset.root) === null || _tileset$root === void 0 ? void 0 : _tileset$root.refine;
  const rootLodMetricValue = tile.geometricError;
  const s2VolumeInfo = (_tile$boundingVolume$ = tile.boundingVolume.extensions) === null || _tile$boundingVolume$ === void 0 ? void 0 : _tile$boundingVolume$['3DTILES_bounding_volume_S2'];
  if (s2VolumeInfo) {
    const box = convertS2BoundingVolumetoOBB(s2VolumeInfo);
    const s2VolumeBox = {
      box,
      s2VolumeInfo
    };
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
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue,
    rootBoundingVolume,
    getTileType,
    getRefine
  };
  return await normalizeImplicitTileData(tile, basePath, subtree, implicitOptions);
}
export async function normalizeImplicitTileData(tile, basePath, rootSubtree, options) {
  if (!tile) {
    return null;
  }
  const {
    children,
    contentUrl
  } = await parseImplicitTiles({
    subtree: rootSubtree,
    options
  });
  let tileContentUrl;
  let tileContent = null;
  if (contentUrl) {
    tileContentUrl = contentUrl;
    tileContent = {
      uri: contentUrl.replace("".concat(basePath, "/"), '')
    };
  }
  const tilePostprocessed = {
    ...tile,
    id: tileContentUrl,
    contentUrl: tileContentUrl,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    lodMetricValue: tile.geometricError,
    transformMatrix: tile.transform,
    type: getTileType(tile, tileContentUrl),
    refine: getRefine(tile.refine),
    content: tileContent || tile.content,
    children
  };
  return tilePostprocessed;
}
function getImplicitTilingExtensionData(tile) {
  var _tile$extensions;
  return (tile === null || tile === void 0 ? void 0 : (_tile$extensions = tile.extensions) === null || _tile$extensions === void 0 ? void 0 : _tile$extensions['3DTILES_implicit_tiling']) || (tile === null || tile === void 0 ? void 0 : tile.implicitTiling);
}
//# sourceMappingURL=parse-3d-tile-header.js.map