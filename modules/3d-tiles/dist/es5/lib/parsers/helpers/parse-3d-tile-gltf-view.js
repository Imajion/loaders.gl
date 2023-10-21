"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GLTF_FORMAT = void 0;
exports.extractGLTF = extractGLTF;
exports.parse3DTileGLTFViewSync = parse3DTileGLTFViewSync;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _gltf = require("@loaders.gl/gltf");
var _loaderUtils = require("@loaders.gl/loader-utils");
var GLTF_FORMAT = {
  URI: 0,
  EMBEDDED: 1
};
exports.GLTF_FORMAT = GLTF_FORMAT;
function parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset, options) {
  tile.rotateYtoZ = true;
  var gltfByteLength = tile.byteOffset + tile.byteLength - byteOffset;
  if (gltfByteLength === 0) {
    throw new Error('glTF byte length must be greater than 0.');
  }
  tile.gltfUpAxis = options['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis ? options['3d-tiles'].assetGltfUpAxis : 'Y';
  tile.gltfArrayBuffer = (0, _loaderUtils.sliceArrayBuffer)(arrayBuffer, byteOffset, gltfByteLength);
  tile.gltfByteOffset = 0;
  tile.gltfByteLength = gltfByteLength;
  if (byteOffset % 4 === 0) {} else {
    console.warn("".concat(tile.type, ": embedded glb is not aligned to a 4-byte boundary."));
  }
  return tile.byteOffset + tile.byteLength;
}
function extractGLTF(_x, _x2, _x3, _x4) {
  return _extractGLTF.apply(this, arguments);
}
function _extractGLTF() {
  _extractGLTF = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee(tile, gltfFormat, options, context) {
    var tile3DOptions, parse, fetch, gltfWithBuffers;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          tile3DOptions = options['3d-tiles'] || {};
          extractGLTFBufferOrURL(tile, gltfFormat, options);
          if (!tile3DOptions.loadGLTF) {
            _context.next = 18;
            break;
          }
          parse = context.parse, fetch = context.fetch;
          if (!tile.gltfUrl) {
            _context.next = 9;
            break;
          }
          _context.next = 7;
          return fetch(tile.gltfUrl, options);
        case 7:
          tile.gltfArrayBuffer = _context.sent;
          tile.gltfByteOffset = 0;
        case 9:
          if (!tile.gltfArrayBuffer) {
            _context.next = 18;
            break;
          }
          _context.next = 12;
          return parse(tile.gltfArrayBuffer, _gltf.GLTFLoader, options, context);
        case 12:
          gltfWithBuffers = _context.sent;
          tile.gltf = (0, _gltf.postProcessGLTF)(gltfWithBuffers);
          tile.gpuMemoryUsageInBytes = (0, _gltf._getMemoryUsageGLTF)(tile.gltf);
          delete tile.gltfArrayBuffer;
          delete tile.gltfByteOffset;
          delete tile.gltfByteLength;
        case 18:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _extractGLTF.apply(this, arguments);
}
function extractGLTFBufferOrURL(tile, gltfFormat, options) {
  switch (gltfFormat) {
    case GLTF_FORMAT.URI:
      var gltfUrlBytes = new Uint8Array(tile.gltfArrayBuffer, tile.gltfByteOffset);
      var textDecoder = new TextDecoder();
      var gltfUrl = textDecoder.decode(gltfUrlBytes);
      tile.gltfUrl = gltfUrl.replace(/[\s\0]+$/, '');
      delete tile.gltfArrayBuffer;
      delete tile.gltfByteOffset;
      delete tile.gltfByteLength;
      break;
    case GLTF_FORMAT.EMBEDDED:
      break;
    default:
      throw new Error('b3dm: Illegal glTF format field');
  }
}
//# sourceMappingURL=parse-3d-tile-gltf-view.js.map