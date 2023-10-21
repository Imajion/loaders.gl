"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normalizeImplicitTileData = normalizeImplicitTileData;
exports.normalizeImplicitTileHeaders = normalizeImplicitTileHeaders;
exports.normalizeTileData = normalizeTileData;
exports.normalizeTileHeaders = normalizeTileHeaders;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _tile3dSubtreeLoader = require("../../tile-3d-subtree-loader");
var _core = require("@loaders.gl/core");
var _tiles = require("@loaders.gl/tiles");
var _parse3dImplicitTiles = require("./helpers/parse-3d-implicit-tiles");
var _s2CornersToObb = require("../utils/obb/s2-corners-to-obb");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function getTileType(tile) {
  var tileContentUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  if (!tileContentUrl) {
    return _tiles.TILE_TYPE.EMPTY;
  }
  var contentUrl = tileContentUrl.split('?')[0];
  var fileExtension = contentUrl.split('.').pop();
  switch (fileExtension) {
    case 'pnts':
      return _tiles.TILE_TYPE.POINTCLOUD;
    case 'i3dm':
    case 'b3dm':
    case 'glb':
    case 'gltf':
      return _tiles.TILE_TYPE.SCENEGRAPH;
    default:
      return fileExtension || _tiles.TILE_TYPE.EMPTY;
  }
}
function getRefine(refine) {
  switch (refine) {
    case 'REPLACE':
    case 'replace':
      return _tiles.TILE_REFINEMENT.REPLACE;
    case 'ADD':
    case 'add':
      return _tiles.TILE_REFINEMENT.ADD;
    default:
      return refine;
  }
}
function resolveUri() {
  var uri = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var basePath = arguments.length > 1 ? arguments[1] : undefined;
  var urlSchemeRegex = /^[a-z][0-9a-z+.-]*:/i;
  if (urlSchemeRegex.test(basePath)) {
    var url = new URL(uri, "".concat(basePath, "/"));
    return decodeURI(url.toString());
  } else if (uri.startsWith('/')) {
    return uri;
  }
  return "".concat(basePath, "/").concat(uri);
}
function normalizeTileData(tile, basePath) {
  if (!tile) {
    return null;
  }
  var tileContentUrl;
  if (tile.content) {
    var _tile$content;
    var contentUri = tile.content.uri || ((_tile$content = tile.content) === null || _tile$content === void 0 ? void 0 : _tile$content.url);
    tileContentUrl = resolveUri(contentUri, basePath);
  }
  var tilePostprocessed = _objectSpread(_objectSpread({}, tile), {}, {
    id: tileContentUrl,
    contentUrl: tileContentUrl,
    lodMetricType: _tiles.LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    lodMetricValue: tile.geometricError,
    transformMatrix: tile.transform,
    type: getTileType(tile, tileContentUrl),
    refine: getRefine(tile.refine)
  });
  return tilePostprocessed;
}
function normalizeTileHeaders(_x, _x2, _x3) {
  return _normalizeTileHeaders.apply(this, arguments);
}
function _normalizeTileHeaders() {
  _normalizeTileHeaders = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee(tileset, basePath, options) {
    var root, rootImplicitTilingExtension, stack, tile, children, childrenPostprocessed, _iterator, _step, childHeader, childImplicitTilingExtension, childHeaderPostprocessed;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          root = null;
          rootImplicitTilingExtension = getImplicitTilingExtensionData(tileset.root);
          if (!(rootImplicitTilingExtension && tileset.root)) {
            _context.next = 8;
            break;
          }
          _context.next = 5;
          return normalizeImplicitTileHeaders(tileset.root, tileset, basePath, rootImplicitTilingExtension, options);
        case 5:
          root = _context.sent;
          _context.next = 9;
          break;
        case 8:
          root = normalizeTileData(tileset.root, basePath);
        case 9:
          stack = [];
          stack.push(root);
        case 11:
          if (!(stack.length > 0)) {
            _context.next = 43;
            break;
          }
          tile = stack.pop() || {};
          children = tile.children || [];
          childrenPostprocessed = [];
          _iterator = _createForOfIteratorHelper(children);
          _context.prev = 16;
          _iterator.s();
        case 18:
          if ((_step = _iterator.n()).done) {
            _context.next = 32;
            break;
          }
          childHeader = _step.value;
          childImplicitTilingExtension = getImplicitTilingExtensionData(childHeader);
          childHeaderPostprocessed = void 0;
          if (!childImplicitTilingExtension) {
            _context.next = 28;
            break;
          }
          _context.next = 25;
          return normalizeImplicitTileHeaders(childHeader, tileset, basePath, childImplicitTilingExtension, options);
        case 25:
          childHeaderPostprocessed = _context.sent;
          _context.next = 29;
          break;
        case 28:
          childHeaderPostprocessed = normalizeTileData(childHeader, basePath);
        case 29:
          if (childHeaderPostprocessed) {
            childrenPostprocessed.push(childHeaderPostprocessed);
            stack.push(childHeaderPostprocessed);
          }
        case 30:
          _context.next = 18;
          break;
        case 32:
          _context.next = 37;
          break;
        case 34:
          _context.prev = 34;
          _context.t0 = _context["catch"](16);
          _iterator.e(_context.t0);
        case 37:
          _context.prev = 37;
          _iterator.f();
          return _context.finish(37);
        case 40:
          tile.children = childrenPostprocessed;
          _context.next = 11;
          break;
        case 43:
          return _context.abrupt("return", root);
        case 44:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[16, 34, 37, 40]]);
  }));
  return _normalizeTileHeaders.apply(this, arguments);
}
function normalizeImplicitTileHeaders(_x4, _x5, _x6, _x7, _x8) {
  return _normalizeImplicitTileHeaders.apply(this, arguments);
}
function _normalizeImplicitTileHeaders() {
  _normalizeImplicitTileHeaders = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee2(tile, tileset, basePath, implicitTilingExtension, options) {
    var _tile$content2, _tileset$root, _tile$boundingVolume$;
    var subdivisionScheme, maximumLevel, subtreeLevels, subtreesUriTemplate, replacedUrlTemplate, subtreeUrl, subtree, contentUrlTemplate, refine, rootLodMetricValue, s2VolumeInfo, box, s2VolumeBox, rootBoundingVolume, implicitOptions;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          subdivisionScheme = implicitTilingExtension.subdivisionScheme, maximumLevel = implicitTilingExtension.maximumLevel, subtreeLevels = implicitTilingExtension.subtreeLevels, subtreesUriTemplate = implicitTilingExtension.subtrees.uri;
          replacedUrlTemplate = (0, _parse3dImplicitTiles.replaceContentUrlTemplate)(subtreesUriTemplate, 0, 0, 0, 0);
          subtreeUrl = resolveUri(replacedUrlTemplate, basePath);
          _context2.next = 5;
          return (0, _core.load)(subtreeUrl, _tile3dSubtreeLoader.Tile3DSubtreeLoader, options);
        case 5:
          subtree = _context2.sent;
          contentUrlTemplate = resolveUri((_tile$content2 = tile.content) === null || _tile$content2 === void 0 ? void 0 : _tile$content2.uri, basePath);
          refine = tileset === null || tileset === void 0 ? void 0 : (_tileset$root = tileset.root) === null || _tileset$root === void 0 ? void 0 : _tileset$root.refine;
          rootLodMetricValue = tile.geometricError;
          s2VolumeInfo = (_tile$boundingVolume$ = tile.boundingVolume.extensions) === null || _tile$boundingVolume$ === void 0 ? void 0 : _tile$boundingVolume$['3DTILES_bounding_volume_S2'];
          if (s2VolumeInfo) {
            box = (0, _s2CornersToObb.convertS2BoundingVolumetoOBB)(s2VolumeInfo);
            s2VolumeBox = {
              box: box,
              s2VolumeInfo: s2VolumeInfo
            };
            tile.boundingVolume = s2VolumeBox;
          }
          rootBoundingVolume = tile.boundingVolume;
          implicitOptions = {
            contentUrlTemplate: contentUrlTemplate,
            subtreesUriTemplate: subtreesUriTemplate,
            subdivisionScheme: subdivisionScheme,
            subtreeLevels: subtreeLevels,
            maximumLevel: maximumLevel,
            refine: refine,
            basePath: basePath,
            lodMetricType: _tiles.LOD_METRIC_TYPE.GEOMETRIC_ERROR,
            rootLodMetricValue: rootLodMetricValue,
            rootBoundingVolume: rootBoundingVolume,
            getTileType: getTileType,
            getRefine: getRefine
          };
          _context2.next = 15;
          return normalizeImplicitTileData(tile, basePath, subtree, implicitOptions);
        case 15:
          return _context2.abrupt("return", _context2.sent);
        case 16:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _normalizeImplicitTileHeaders.apply(this, arguments);
}
function normalizeImplicitTileData(_x9, _x10, _x11, _x12) {
  return _normalizeImplicitTileData.apply(this, arguments);
}
function _normalizeImplicitTileData() {
  _normalizeImplicitTileData = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee3(tile, basePath, rootSubtree, options) {
    var _yield$parseImplicitT, children, contentUrl, tileContentUrl, tileContent, tilePostprocessed;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          if (tile) {
            _context3.next = 2;
            break;
          }
          return _context3.abrupt("return", null);
        case 2:
          _context3.next = 4;
          return (0, _parse3dImplicitTiles.parseImplicitTiles)({
            subtree: rootSubtree,
            options: options
          });
        case 4:
          _yield$parseImplicitT = _context3.sent;
          children = _yield$parseImplicitT.children;
          contentUrl = _yield$parseImplicitT.contentUrl;
          tileContent = null;
          if (contentUrl) {
            tileContentUrl = contentUrl;
            tileContent = {
              uri: contentUrl.replace("".concat(basePath, "/"), '')
            };
          }
          tilePostprocessed = _objectSpread(_objectSpread({}, tile), {}, {
            id: tileContentUrl,
            contentUrl: tileContentUrl,
            lodMetricType: _tiles.LOD_METRIC_TYPE.GEOMETRIC_ERROR,
            lodMetricValue: tile.geometricError,
            transformMatrix: tile.transform,
            type: getTileType(tile, tileContentUrl),
            refine: getRefine(tile.refine),
            content: tileContent || tile.content,
            children: children
          });
          return _context3.abrupt("return", tilePostprocessed);
        case 11:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _normalizeImplicitTileData.apply(this, arguments);
}
function getImplicitTilingExtensionData(tile) {
  var _tile$extensions;
  return (tile === null || tile === void 0 ? void 0 : (_tile$extensions = tile.extensions) === null || _tile$extensions === void 0 ? void 0 : _tile$extensions['3DTILES_implicit_tiling']) || (tile === null || tile === void 0 ? void 0 : tile.implicitTiling);
}
//# sourceMappingURL=parse-3d-tile-header.js.map