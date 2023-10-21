"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tiles3DLoader = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _loaderUtils = require("@loaders.gl/loader-utils");
var _tiles = require("@loaders.gl/tiles");
var _version = require("./lib/utils/version");
var _parse3dTile = require("./lib/parsers/parse-3d-tile");
var _parse3dTileHeader = require("./lib/parsers/parse-3d-tile-header");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var Tiles3DLoader = {
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  version: _version.VERSION,
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeTypes: ['application/octet-stream'],
  tests: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  parse: parse,
  options: {
    '3d-tiles': {
      loadGLTF: true,
      decodeQuantizedPositions: false,
      isTileset: 'auto',
      assetGltfUpAxis: null
    }
  }
};
exports.Tiles3DLoader = Tiles3DLoader;
function parse(_x) {
  return _parse.apply(this, arguments);
}
function _parse() {
  _parse = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee(data) {
    var options,
      context,
      loaderOptions,
      isTileset,
      _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
          context = _args.length > 2 ? _args[2] : undefined;
          loaderOptions = options['3d-tiles'] || {};
          if (loaderOptions.isTileset === 'auto') {
            isTileset = (context === null || context === void 0 ? void 0 : context.url) && context.url.indexOf('.json') !== -1;
          } else {
            isTileset = loaderOptions.isTileset;
          }
          return _context.abrupt("return", isTileset ? parseTileset(data, options, context) : parseTile(data, options, context));
        case 5:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _parse.apply(this, arguments);
}
function parseTileset(_x2, _x3, _x4) {
  return _parseTileset.apply(this, arguments);
}
function _parseTileset() {
  _parseTileset = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee2(data, options, context) {
    var _tilesetJson$root;
    var tilesetJson, tilesetUrl, basePath, normalizedRoot, tilesetJsonPostprocessed;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          tilesetJson = JSON.parse(new TextDecoder().decode(data));
          tilesetUrl = (context === null || context === void 0 ? void 0 : context.url) || '';
          basePath = getBaseUri(tilesetUrl);
          _context2.next = 5;
          return (0, _parse3dTileHeader.normalizeTileHeaders)(tilesetJson, basePath, options || {});
        case 5:
          normalizedRoot = _context2.sent;
          tilesetJsonPostprocessed = _objectSpread(_objectSpread({}, tilesetJson), {}, {
            loader: Tiles3DLoader,
            url: tilesetUrl,
            queryString: (context === null || context === void 0 ? void 0 : context.queryString) || '',
            basePath: basePath,
            root: normalizedRoot || tilesetJson.root,
            type: _tiles.TILESET_TYPE.TILES3D,
            lodMetricType: _tiles.LOD_METRIC_TYPE.GEOMETRIC_ERROR,
            lodMetricValue: ((_tilesetJson$root = tilesetJson.root) === null || _tilesetJson$root === void 0 ? void 0 : _tilesetJson$root.geometricError) || 0
          });
          return _context2.abrupt("return", tilesetJsonPostprocessed);
        case 8:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _parseTileset.apply(this, arguments);
}
function parseTile(_x5, _x6, _x7) {
  return _parseTile.apply(this, arguments);
}
function _parseTile() {
  _parseTile = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee3(arrayBuffer, options, context) {
    var tile, byteOffset;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          tile = {
            content: {
              featureIds: null
            }
          };
          byteOffset = 0;
          _context3.next = 4;
          return (0, _parse3dTile.parse3DTile)(arrayBuffer, byteOffset, options, context, tile.content);
        case 4:
          return _context3.abrupt("return", tile.content);
        case 5:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _parseTile.apply(this, arguments);
}
function getBaseUri(tilesetUrl) {
  return _loaderUtils.path.dirname(tilesetUrl);
}
//# sourceMappingURL=tiles-3d-loader.js.map