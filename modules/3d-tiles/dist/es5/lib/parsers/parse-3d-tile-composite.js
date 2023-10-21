"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseComposite3DTile = parseComposite3DTile;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _parse3dTileHeader = require("./helpers/parse-3d-tile-header");
function parseComposite3DTile(_x, _x2, _x3, _x4, _x5, _x6) {
  return _parseComposite3DTile.apply(this, arguments);
}
function _parseComposite3DTile() {
  _parseComposite3DTile = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee(tile, arrayBuffer, byteOffset, options, context, parse3DTile) {
    var view, _subtile;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          byteOffset = (0, _parse3dTileHeader.parse3DTileHeaderSync)(tile, arrayBuffer, byteOffset);
          view = new DataView(arrayBuffer);
          tile.tilesLength = view.getUint32(byteOffset, true);
          byteOffset += 4;
          tile.tiles = [];
        case 5:
          if (!(tile.tiles.length < tile.tilesLength && tile.byteLength - byteOffset > 12)) {
            _context.next = 13;
            break;
          }
          _subtile = {};
          tile.tiles.push(_subtile);
          _context.next = 10;
          return parse3DTile(arrayBuffer, byteOffset, options, context, _subtile);
        case 10:
          byteOffset = _context.sent;
          _context.next = 5;
          break;
        case 13:
          return _context.abrupt("return", byteOffset);
        case 14:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _parseComposite3DTile.apply(this, arguments);
}
//# sourceMappingURL=parse-3d-tile-composite.js.map