"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseGltf3DTile = parseGltf3DTile;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _gltf = require("@loaders.gl/gltf");
function parseGltf3DTile(_x, _x2, _x3, _x4) {
  return _parseGltf3DTile.apply(this, arguments);
}
function _parseGltf3DTile() {
  _parseGltf3DTile = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee(tile, arrayBuffer, options, context) {
    var parse, gltfWithBuffers;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          tile.rotateYtoZ = true;
          tile.gltfUpAxis = options['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis ? options['3d-tiles'].assetGltfUpAxis : 'Y';
          parse = context.parse;
          _context.next = 5;
          return parse(arrayBuffer, _gltf.GLTFLoader, options, context);
        case 5:
          gltfWithBuffers = _context.sent;
          tile.gltf = (0, _gltf.postProcessGLTF)(gltfWithBuffers);
          tile.gpuMemoryUsageInBytes = (0, _gltf._getMemoryUsageGLTF)(tile.gltf);
        case 8:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _parseGltf3DTile.apply(this, arguments);
}
//# sourceMappingURL=parse-3d-tile-gltf.js.map