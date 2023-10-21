import { path } from '@loaders.gl/loader-utils';
import { TILESET_TYPE, LOD_METRIC_TYPE } from '@loaders.gl/tiles';
import { VERSION } from './lib/utils/version';
import { parse3DTile } from './lib/parsers/parse-3d-tile';
import { normalizeTileHeaders } from './lib/parsers/parse-3d-tile-header';
export const Tiles3DLoader = {
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  version: VERSION,
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
async function parse(data) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  let context = arguments.length > 2 ? arguments[2] : undefined;
  const loaderOptions = options['3d-tiles'] || {};
  let isTileset;
  if (loaderOptions.isTileset === 'auto') {
    isTileset = (context === null || context === void 0 ? void 0 : context.url) && context.url.indexOf('.json') !== -1;
  } else {
    isTileset = loaderOptions.isTileset;
  }
  return isTileset ? parseTileset(data, options, context) : parseTile(data, options, context);
}
async function parseTileset(data, options, context) {
  var _tilesetJson$root;
  const tilesetJson = JSON.parse(new TextDecoder().decode(data));
  const tilesetUrl = (context === null || context === void 0 ? void 0 : context.url) || '';
  const basePath = getBaseUri(tilesetUrl);
  const normalizedRoot = await normalizeTileHeaders(tilesetJson, basePath, options || {});
  const tilesetJsonPostprocessed = {
    ...tilesetJson,
    loader: Tiles3DLoader,
    url: tilesetUrl,
    queryString: (context === null || context === void 0 ? void 0 : context.queryString) || '',
    basePath,
    root: normalizedRoot || tilesetJson.root,
    type: TILESET_TYPE.TILES3D,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    lodMetricValue: ((_tilesetJson$root = tilesetJson.root) === null || _tilesetJson$root === void 0 ? void 0 : _tilesetJson$root.geometricError) || 0
  };
  return tilesetJsonPostprocessed;
}
async function parseTile(arrayBuffer, options, context) {
  const tile = {
    content: {
      featureIds: null
    }
  };
  const byteOffset = 0;
  await parse3DTile(arrayBuffer, byteOffset, options, context, tile.content);
  return tile.content;
}
function getBaseUri(tilesetUrl) {
  return path.dirname(tilesetUrl);
}
//# sourceMappingURL=tiles-3d-loader.js.map