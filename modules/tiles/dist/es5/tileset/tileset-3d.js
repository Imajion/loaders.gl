"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tileset3D = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _core = require("@math.gl/core");
var _geospatial = require("@math.gl/geospatial");
var _stats = require("@probe.gl/stats");
var _loaderUtils = require("@loaders.gl/loader-utils");
var _tilesetCache = require("./tileset-cache");
var _frameState = require("./helpers/frame-state");
var _zoom = require("./helpers/zoom");
var _tile3d = require("./tile-3d");
var _constants = require("../constants");
var _tilesetTraverser = require("./tileset-traverser");
var _tileset3dTraverser = require("./format-3d-tiles/tileset-3d-traverser");
var _i3sTilesetTraverser = require("./format-i3s/i3s-tileset-traverser");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var DEFAULT_PROPS = {
  description: '',
  ellipsoid: _geospatial.Ellipsoid.WGS84,
  modelMatrix: new _core.Matrix4(),
  throttleRequests: true,
  maxRequests: 64,
  maximumMemoryUsage: 32,
  maximumTilesSelected: 0,
  debounceTime: 0,
  onTileLoad: function onTileLoad() {},
  onTileUnload: function onTileUnload() {},
  onTileError: function onTileError() {},
  onTraversalComplete: function onTraversalComplete(selectedTiles) {
    return selectedTiles;
  },
  contentLoader: undefined,
  viewDistanceScale: 1.0,
  maximumScreenSpaceError: 8,
  loadTiles: true,
  updateTransforms: true,
  viewportTraversersMap: null,
  loadOptions: {
    fetch: {}
  },
  attributions: [],
  basePath: '',
  i3s: {}
};
var TILES_TOTAL = 'Tiles In Tileset(s)';
var TILES_IN_MEMORY = 'Tiles In Memory';
var TILES_IN_VIEW = 'Tiles In View';
var TILES_RENDERABLE = 'Tiles To Render';
var TILES_LOADED = 'Tiles Loaded';
var TILES_LOADING = 'Tiles Loading';
var TILES_UNLOADED = 'Tiles Unloaded';
var TILES_LOAD_FAILED = 'Failed Tile Loads';
var POINTS_COUNT = 'Points/Vertices';
var TILES_GPU_MEMORY = 'Tile Memory Use';
var Tileset3D = function () {
  function Tileset3D(tileset, options) {
    (0, _classCallCheck2.default)(this, Tileset3D);
    (0, _defineProperty2.default)(this, "options", void 0);
    (0, _defineProperty2.default)(this, "loadOptions", void 0);
    (0, _defineProperty2.default)(this, "type", void 0);
    (0, _defineProperty2.default)(this, "tileset", void 0);
    (0, _defineProperty2.default)(this, "loader", void 0);
    (0, _defineProperty2.default)(this, "url", void 0);
    (0, _defineProperty2.default)(this, "basePath", void 0);
    (0, _defineProperty2.default)(this, "modelMatrix", void 0);
    (0, _defineProperty2.default)(this, "ellipsoid", void 0);
    (0, _defineProperty2.default)(this, "lodMetricType", void 0);
    (0, _defineProperty2.default)(this, "lodMetricValue", void 0);
    (0, _defineProperty2.default)(this, "refine", void 0);
    (0, _defineProperty2.default)(this, "root", null);
    (0, _defineProperty2.default)(this, "roots", {});
    (0, _defineProperty2.default)(this, "asset", {});
    (0, _defineProperty2.default)(this, "description", '');
    (0, _defineProperty2.default)(this, "properties", void 0);
    (0, _defineProperty2.default)(this, "extras", null);
    (0, _defineProperty2.default)(this, "attributions", {});
    (0, _defineProperty2.default)(this, "credits", {});
    (0, _defineProperty2.default)(this, "stats", void 0);
    (0, _defineProperty2.default)(this, "contentFormats", {
      draco: false,
      meshopt: false,
      dds: false,
      ktx2: false
    });
    (0, _defineProperty2.default)(this, "cartographicCenter", null);
    (0, _defineProperty2.default)(this, "cartesianCenter", null);
    (0, _defineProperty2.default)(this, "zoom", 1);
    (0, _defineProperty2.default)(this, "boundingVolume", null);
    (0, _defineProperty2.default)(this, "dynamicScreenSpaceErrorComputedDensity", 0.0);
    (0, _defineProperty2.default)(this, "maximumMemoryUsage", 32);
    (0, _defineProperty2.default)(this, "gpuMemoryUsageInBytes", 0);
    (0, _defineProperty2.default)(this, "_frameNumber", 0);
    (0, _defineProperty2.default)(this, "_queryParams", {});
    (0, _defineProperty2.default)(this, "_extensionsUsed", []);
    (0, _defineProperty2.default)(this, "_tiles", {});
    (0, _defineProperty2.default)(this, "_pendingCount", 0);
    (0, _defineProperty2.default)(this, "selectedTiles", []);
    (0, _defineProperty2.default)(this, "traverseCounter", 0);
    (0, _defineProperty2.default)(this, "geometricError", 0);
    (0, _defineProperty2.default)(this, "lastUpdatedVieports", null);
    (0, _defineProperty2.default)(this, "_requestedTiles", []);
    (0, _defineProperty2.default)(this, "_emptyTiles", []);
    (0, _defineProperty2.default)(this, "frameStateData", {});
    (0, _defineProperty2.default)(this, "_traverser", void 0);
    (0, _defineProperty2.default)(this, "_cache", new _tilesetCache.TilesetCache());
    (0, _defineProperty2.default)(this, "_requestScheduler", void 0);
    (0, _defineProperty2.default)(this, "updatePromise", null);
    (0, _defineProperty2.default)(this, "tilesetInitializationPromise", void 0);
    this.options = _objectSpread(_objectSpread({}, DEFAULT_PROPS), options);
    this.tileset = tileset;
    this.loader = tileset.loader;
    this.type = tileset.type;
    this.url = tileset.url;
    this.basePath = tileset.basePath || _loaderUtils.path.dirname(this.url);
    this.modelMatrix = this.options.modelMatrix;
    this.ellipsoid = this.options.ellipsoid;
    this.lodMetricType = tileset.lodMetricType;
    this.lodMetricValue = tileset.lodMetricValue;
    this.refine = tileset.root.refine;
    this.loadOptions = this.options.loadOptions || {};
    this._traverser = this._initializeTraverser();
    this._requestScheduler = new _loaderUtils.RequestScheduler({
      throttleRequests: this.options.throttleRequests,
      maxRequests: this.options.maxRequests
    });
    this.stats = new _stats.Stats({
      id: this.url
    });
    this._initializeStats();
    this.tilesetInitializationPromise = this._initializeTileSet(tileset);
  }
  (0, _createClass2.default)(Tileset3D, [{
    key: "destroy",
    value: function destroy() {
      this._destroy();
    }
  }, {
    key: "isLoaded",
    value: function isLoaded() {
      return this._pendingCount === 0 && this._frameNumber !== 0 && this._requestedTiles.length === 0;
    }
  }, {
    key: "tiles",
    get: function get() {
      return Object.values(this._tiles);
    }
  }, {
    key: "frameNumber",
    get: function get() {
      return this._frameNumber;
    }
  }, {
    key: "queryParams",
    get: function get() {
      return new URLSearchParams(this._queryParams).toString();
    }
  }, {
    key: "setProps",
    value: function setProps(props) {
      this.options = _objectSpread(_objectSpread({}, this.options), props);
    }
  }, {
    key: "setOptions",
    value: function setOptions(options) {
      this.options = _objectSpread(_objectSpread({}, this.options), options);
    }
  }, {
    key: "getTileUrl",
    value: function getTileUrl(tilePath) {
      var isDataUrl = tilePath.startsWith('data:');
      if (isDataUrl) {
        return tilePath;
      }
      return "".concat(tilePath).concat(tilePath.includes('?') ? '&' : '?').concat(this.queryParams);
    }
  }, {
    key: "hasExtension",
    value: function hasExtension(extensionName) {
      return Boolean(this._extensionsUsed.indexOf(extensionName) > -1);
    }
  }, {
    key: "update",
    value: function update() {
      var _this = this;
      var viewports = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      this.tilesetInitializationPromise.then(function () {
        if (!viewports && _this.lastUpdatedVieports) {
          viewports = _this.lastUpdatedVieports;
        } else {
          _this.lastUpdatedVieports = viewports;
        }
        if (viewports) {
          _this.doUpdate(viewports);
        }
      });
    }
  }, {
    key: "selectTiles",
    value: function () {
      var _selectTiles = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee() {
        var _this2 = this;
        var viewports,
          _getFrameState,
          _args = arguments;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              viewports = _args.length > 0 && _args[0] !== undefined ? _args[0] : null;
              _getFrameState = _args.length > 1 && _args[1] !== undefined ? _args[1] : null;
              _context.next = 4;
              return this.tilesetInitializationPromise;
            case 4:
              if (viewports) {
                this.lastUpdatedVieports = viewports;
              }
              if (!this.updatePromise) {
                this.updatePromise = new Promise(function (resolve) {
                  setTimeout(function () {
                    if (_this2.lastUpdatedVieports) {
                      _this2.doUpdate(_this2.lastUpdatedVieports, _getFrameState);
                    }
                    resolve(_this2._frameNumber);
                    _this2.updatePromise = null;
                  }, _this2.options.debounceTime);
                });
              }
              return _context.abrupt("return", this.updatePromise);
            case 7:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function selectTiles() {
        return _selectTiles.apply(this, arguments);
      }
      return selectTiles;
    }()
  }, {
    key: "doUpdate",
    value: function doUpdate(viewports) {
      var _getFrameState = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      if ('loadTiles' in this.options && !this.options.loadTiles) {
        return;
      }
      if (this.traverseCounter > 0) {
        return;
      }
      var preparedViewports = viewports instanceof Array ? viewports : [viewports];
      this._cache.reset();
      this._frameNumber++;
      this.traverseCounter = preparedViewports.length;
      var viewportsToTraverse = [];
      var _iterator = _createForOfIteratorHelper(preparedViewports),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _viewport = _step.value;
          var id = _viewport.id;
          if (this._needTraverse(id)) {
            viewportsToTraverse.push(id);
          } else {
            this.traverseCounter--;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var _iterator2 = _createForOfIteratorHelper(preparedViewports),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _viewport2 = _step2.value;
          var _id = _viewport2.id;
          if (!this.roots[_id]) {
            this.roots[_id] = this._initializeTileHeaders(this.tileset, null);
          }
          if (!viewportsToTraverse.includes(_id)) {
            continue;
          }
          var frameState = _getFrameState ? _getFrameState(_viewport2, this._frameNumber) : (0, _frameState.getFrameState)(_viewport2, this._frameNumber);
          this._traverser.traverse(this.roots[_id], frameState, this.options);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }, {
    key: "_needTraverse",
    value: function _needTraverse(viewportId) {
      var traverserId = viewportId;
      if (this.options.viewportTraversersMap) {
        traverserId = this.options.viewportTraversersMap[viewportId];
      }
      if (traverserId !== viewportId) {
        return false;
      }
      return true;
    }
  }, {
    key: "_onTraversalEnd",
    value: function _onTraversalEnd(frameState) {
      var id = frameState.viewport.id;
      if (!this.frameStateData[id]) {
        this.frameStateData[id] = {
          selectedTiles: [],
          _requestedTiles: [],
          _emptyTiles: []
        };
      }
      var currentFrameStateData = this.frameStateData[id];
      var selectedTiles = Object.values(this._traverser.selectedTiles);
      var _limitSelectedTiles = (0, _frameState.limitSelectedTiles)(selectedTiles, frameState, this.options.maximumTilesSelected),
        _limitSelectedTiles2 = (0, _slicedToArray2.default)(_limitSelectedTiles, 2),
        filteredSelectedTiles = _limitSelectedTiles2[0],
        unselectedTiles = _limitSelectedTiles2[1];
      currentFrameStateData.selectedTiles = filteredSelectedTiles;
      var _iterator3 = _createForOfIteratorHelper(unselectedTiles),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var _tile = _step3.value;
          _tile.unselect();
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      currentFrameStateData._requestedTiles = Object.values(this._traverser.requestedTiles);
      currentFrameStateData._emptyTiles = Object.values(this._traverser.emptyTiles);
      this.traverseCounter--;
      if (this.traverseCounter > 0) {
        return;
      }
      this._updateTiles();
    }
  }, {
    key: "_updateTiles",
    value: function _updateTiles() {
      this.selectedTiles = [];
      this._requestedTiles = [];
      this._emptyTiles = [];
      for (var frameStateKey in this.frameStateData) {
        var frameStateDataValue = this.frameStateData[frameStateKey];
        this.selectedTiles = this.selectedTiles.concat(frameStateDataValue.selectedTiles);
        this._requestedTiles = this._requestedTiles.concat(frameStateDataValue._requestedTiles);
        this._emptyTiles = this._emptyTiles.concat(frameStateDataValue._emptyTiles);
      }
      this.selectedTiles = this.options.onTraversalComplete(this.selectedTiles);
      var _iterator4 = _createForOfIteratorHelper(this.selectedTiles),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var _tile2 = _step4.value;
          this._tiles[_tile2.id] = _tile2;
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      this._loadTiles();
      this._unloadTiles();
      this._updateStats();
    }
  }, {
    key: "_tilesChanged",
    value: function _tilesChanged(oldSelectedTiles, selectedTiles) {
      if (oldSelectedTiles.length !== selectedTiles.length) {
        return true;
      }
      var set1 = new Set(oldSelectedTiles.map(function (t) {
        return t.id;
      }));
      var set2 = new Set(selectedTiles.map(function (t) {
        return t.id;
      }));
      var changed = oldSelectedTiles.filter(function (x) {
        return !set2.has(x.id);
      }).length > 0;
      changed = changed || selectedTiles.filter(function (x) {
        return !set1.has(x.id);
      }).length > 0;
      return changed;
    }
  }, {
    key: "_loadTiles",
    value: function _loadTiles() {
      var _iterator5 = _createForOfIteratorHelper(this._requestedTiles),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var _tile3 = _step5.value;
          if (_tile3.contentUnloaded) {
            this._loadTile(_tile3);
          }
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
  }, {
    key: "_unloadTiles",
    value: function _unloadTiles() {
      this._cache.unloadTiles(this, function (tileset, tile) {
        return tileset._unloadTile(tile);
      });
    }
  }, {
    key: "_updateStats",
    value: function _updateStats() {
      var tilesRenderable = 0;
      var pointsRenderable = 0;
      var _iterator6 = _createForOfIteratorHelper(this.selectedTiles),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var _tile4 = _step6.value;
          if (_tile4.contentAvailable && _tile4.content) {
            tilesRenderable++;
            if (_tile4.content.pointCount) {
              pointsRenderable += _tile4.content.pointCount;
            } else {
              pointsRenderable += _tile4.content.vertexCount;
            }
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      this.stats.get(TILES_IN_VIEW).count = this.selectedTiles.length;
      this.stats.get(TILES_RENDERABLE).count = tilesRenderable;
      this.stats.get(POINTS_COUNT).count = pointsRenderable;
    }
  }, {
    key: "_initializeTileSet",
    value: function () {
      var _initializeTileSet2 = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee2(tilesetJson) {
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              if (!(this.type === _constants.TILESET_TYPE.I3S)) {
                _context2.next = 5;
                break;
              }
              this.calculateViewPropsI3S();
              _context2.next = 4;
              return tilesetJson.root;
            case 4:
              tilesetJson.root = _context2.sent;
            case 5:
              this.root = this._initializeTileHeaders(tilesetJson, null);
              if (this.type === _constants.TILESET_TYPE.TILES3D) {
                this._initializeTiles3DTileset(tilesetJson);
                this.calculateViewPropsTiles3D();
              }
              if (this.type === _constants.TILESET_TYPE.I3S) {
                this._initializeI3STileset();
              }
            case 8:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function _initializeTileSet(_x) {
        return _initializeTileSet2.apply(this, arguments);
      }
      return _initializeTileSet;
    }()
  }, {
    key: "calculateViewPropsI3S",
    value: function calculateViewPropsI3S() {
      var _this$tileset$store;
      var fullExtent = this.tileset.fullExtent;
      if (fullExtent) {
        var xmin = fullExtent.xmin,
          xmax = fullExtent.xmax,
          ymin = fullExtent.ymin,
          ymax = fullExtent.ymax,
          zmin = fullExtent.zmin,
          zmax = fullExtent.zmax;
        this.cartographicCenter = new _core.Vector3(xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2, zmin + (zmax - zmin) / 2);
        this.cartesianCenter = _geospatial.Ellipsoid.WGS84.cartographicToCartesian(this.cartographicCenter, new _core.Vector3());
        this.zoom = (0, _zoom.getZoomFromFullExtent)(fullExtent, this.cartographicCenter, this.cartesianCenter);
        return;
      }
      var extent = (_this$tileset$store = this.tileset.store) === null || _this$tileset$store === void 0 ? void 0 : _this$tileset$store.extent;
      if (extent) {
        var _extent = (0, _slicedToArray2.default)(extent, 4),
          _xmin = _extent[0],
          _ymin = _extent[1],
          _xmax = _extent[2],
          _ymax = _extent[3];
        this.cartographicCenter = new _core.Vector3(_xmin + (_xmax - _xmin) / 2, _ymin + (_ymax - _ymin) / 2, 0);
        this.cartesianCenter = _geospatial.Ellipsoid.WGS84.cartographicToCartesian(this.cartographicCenter, new _core.Vector3());
        this.zoom = (0, _zoom.getZoomFromExtent)(extent, this.cartographicCenter, this.cartesianCenter);
        return;
      }
      console.warn('Extent is not defined in the tileset header');
      this.cartographicCenter = new _core.Vector3();
      this.zoom = 1;
      return;
    }
  }, {
    key: "calculateViewPropsTiles3D",
    value: function calculateViewPropsTiles3D() {
      var root = this.root;
      var center = root.boundingVolume.center;
      if (!center) {
        console.warn('center was not pre-calculated for the root tile');
        this.cartographicCenter = new _core.Vector3();
        this.zoom = 1;
        return;
      }
      if (center[0] !== 0 || center[1] !== 0 || center[2] !== 0) {
        this.cartographicCenter = _geospatial.Ellipsoid.WGS84.cartesianToCartographic(center, new _core.Vector3());
      } else {
        this.cartographicCenter = new _core.Vector3(0, 0, -_geospatial.Ellipsoid.WGS84.radii[0]);
      }
      this.cartesianCenter = center;
      this.zoom = (0, _zoom.getZoomFromBoundingVolume)(root.boundingVolume, this.cartographicCenter);
    }
  }, {
    key: "_initializeStats",
    value: function _initializeStats() {
      this.stats.get(TILES_TOTAL);
      this.stats.get(TILES_LOADING);
      this.stats.get(TILES_IN_MEMORY);
      this.stats.get(TILES_IN_VIEW);
      this.stats.get(TILES_RENDERABLE);
      this.stats.get(TILES_LOADED);
      this.stats.get(TILES_UNLOADED);
      this.stats.get(TILES_LOAD_FAILED);
      this.stats.get(POINTS_COUNT);
      this.stats.get(TILES_GPU_MEMORY, 'memory');
    }
  }, {
    key: "_initializeTileHeaders",
    value: function _initializeTileHeaders(tilesetJson, parentTileHeader) {
      var rootTile = new _tile3d.Tile3D(this, tilesetJson.root, parentTileHeader);
      if (parentTileHeader) {
        parentTileHeader.children.push(rootTile);
        rootTile.depth = parentTileHeader.depth + 1;
      }
      if (this.type === _constants.TILESET_TYPE.TILES3D) {
        var stack = [];
        stack.push(rootTile);
        while (stack.length > 0) {
          var _tile5 = stack.pop();
          this.stats.get(TILES_TOTAL).incrementCount();
          var children = _tile5.header.children || [];
          var _iterator7 = _createForOfIteratorHelper(children),
            _step7;
          try {
            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
              var _childTile$contentUrl;
              var childHeader = _step7.value;
              var childTile = new _tile3d.Tile3D(this, childHeader, _tile5);
              if ((_childTile$contentUrl = childTile.contentUrl) !== null && _childTile$contentUrl !== void 0 && _childTile$contentUrl.includes('?session=')) {
                var _url = new URL(childTile.contentUrl);
                var session = _url.searchParams.get('session');
                if (session) {
                  this._queryParams.session = session;
                }
              }
              _tile5.children.push(childTile);
              childTile.depth = _tile5.depth + 1;
              stack.push(childTile);
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }
        }
      }
      return rootTile;
    }
  }, {
    key: "_initializeTraverser",
    value: function _initializeTraverser() {
      var TraverserClass;
      var type = this.type;
      switch (type) {
        case _constants.TILESET_TYPE.TILES3D:
          TraverserClass = _tileset3dTraverser.Tileset3DTraverser;
          break;
        case _constants.TILESET_TYPE.I3S:
          TraverserClass = _i3sTilesetTraverser.I3STilesetTraverser;
          break;
        default:
          TraverserClass = _tilesetTraverser.TilesetTraverser;
      }
      return new TraverserClass({
        basePath: this.basePath,
        onTraversalEnd: this._onTraversalEnd.bind(this)
      });
    }
  }, {
    key: "_destroyTileHeaders",
    value: function _destroyTileHeaders(parentTile) {
      this._destroySubtree(parentTile);
    }
  }, {
    key: "_loadTile",
    value: function () {
      var _loadTile2 = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee3(tile) {
        var loaded;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              this._onStartTileLoading();
              _context3.next = 4;
              return tile.loadContent();
            case 4:
              loaded = _context3.sent;
              _context3.next = 10;
              break;
            case 7:
              _context3.prev = 7;
              _context3.t0 = _context3["catch"](0);
              this._onTileLoadError(tile, _context3.t0 instanceof Error ? _context3.t0 : new Error('load failed'));
            case 10:
              _context3.prev = 10;
              this._onEndTileLoading();
              this._onTileLoad(tile, loaded);
              return _context3.finish(10);
            case 14:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[0, 7, 10, 14]]);
      }));
      function _loadTile(_x2) {
        return _loadTile2.apply(this, arguments);
      }
      return _loadTile;
    }()
  }, {
    key: "_onTileLoadError",
    value: function _onTileLoadError(tile, error) {
      this.stats.get(TILES_LOAD_FAILED).incrementCount();
      var message = error.message || error.toString();
      var url = tile.url;
      console.error("A 3D tile failed to load: ".concat(tile.url, " ").concat(message));
      this.options.onTileError(tile, message, url);
    }
  }, {
    key: "_onTileLoad",
    value: function _onTileLoad(tile, loaded) {
      if (!loaded) {
        return;
      }
      if (this.type === _constants.TILESET_TYPE.I3S) {
        var _this$tileset, _this$tileset$nodePag;
        var nodesInNodePages = ((_this$tileset = this.tileset) === null || _this$tileset === void 0 ? void 0 : (_this$tileset$nodePag = _this$tileset.nodePagesTile) === null || _this$tileset$nodePag === void 0 ? void 0 : _this$tileset$nodePag.nodesInNodePages) || 0;
        this.stats.get(TILES_TOTAL).reset();
        this.stats.get(TILES_TOTAL).addCount(nodesInNodePages);
      }
      this.updateContentTypes(tile);
      this._addTileToCache(tile);
      this.options.onTileLoad(tile);
    }
  }, {
    key: "updateContentTypes",
    value: function updateContentTypes(tile) {
      if (this.type === _constants.TILESET_TYPE.I3S) {
        if (tile.header.isDracoGeometry) {
          this.contentFormats.draco = true;
        }
        switch (tile.header.textureFormat) {
          case 'dds':
            this.contentFormats.dds = true;
            break;
          case 'ktx2':
            this.contentFormats.ktx2 = true;
            break;
          default:
        }
      } else if (this.type === _constants.TILESET_TYPE.TILES3D) {
        var _tile$content;
        var _ref = ((_tile$content = tile.content) === null || _tile$content === void 0 ? void 0 : _tile$content.gltf) || {},
          _ref$extensionsRemove = _ref.extensionsRemoved,
          extensionsRemoved = _ref$extensionsRemove === void 0 ? [] : _ref$extensionsRemove;
        if (extensionsRemoved.includes('KHR_draco_mesh_compression')) {
          this.contentFormats.draco = true;
        }
        if (extensionsRemoved.includes('EXT_meshopt_compression')) {
          this.contentFormats.meshopt = true;
        }
        if (extensionsRemoved.includes('KHR_texture_basisu')) {
          this.contentFormats.ktx2 = true;
        }
      }
    }
  }, {
    key: "_onStartTileLoading",
    value: function _onStartTileLoading() {
      this._pendingCount++;
      this.stats.get(TILES_LOADING).incrementCount();
    }
  }, {
    key: "_onEndTileLoading",
    value: function _onEndTileLoading() {
      this._pendingCount--;
      this.stats.get(TILES_LOADING).decrementCount();
    }
  }, {
    key: "_addTileToCache",
    value: function _addTileToCache(tile) {
      this._cache.add(this, tile, function (tileset) {
        return tileset._updateCacheStats(tile);
      });
    }
  }, {
    key: "_updateCacheStats",
    value: function _updateCacheStats(tile) {
      this.stats.get(TILES_LOADED).incrementCount();
      this.stats.get(TILES_IN_MEMORY).incrementCount();
      this.gpuMemoryUsageInBytes += tile.gpuMemoryUsageInBytes || 0;
      this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;
    }
  }, {
    key: "_unloadTile",
    value: function _unloadTile(tile) {
      this.gpuMemoryUsageInBytes -= tile.gpuMemoryUsageInBytes || 0;
      this.stats.get(TILES_IN_MEMORY).decrementCount();
      this.stats.get(TILES_UNLOADED).incrementCount();
      this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;
      this.options.onTileUnload(tile);
      tile.unloadContent();
    }
  }, {
    key: "_destroy",
    value: function _destroy() {
      var stack = [];
      if (this.root) {
        stack.push(this.root);
      }
      while (stack.length > 0) {
        var _tile6 = stack.pop();
        var _iterator8 = _createForOfIteratorHelper(_tile6.children),
          _step8;
        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
            var child = _step8.value;
            stack.push(child);
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }
        this._destroyTile(_tile6);
      }
      this.root = null;
    }
  }, {
    key: "_destroySubtree",
    value: function _destroySubtree(tile) {
      var root = tile;
      var stack = [];
      stack.push(root);
      while (stack.length > 0) {
        tile = stack.pop();
        var _iterator9 = _createForOfIteratorHelper(tile.children),
          _step9;
        try {
          for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
            var child = _step9.value;
            stack.push(child);
          }
        } catch (err) {
          _iterator9.e(err);
        } finally {
          _iterator9.f();
        }
        if (tile !== root) {
          this._destroyTile(tile);
        }
      }
      root.children = [];
    }
  }, {
    key: "_destroyTile",
    value: function _destroyTile(tile) {
      this._cache.unloadTile(this, tile);
      this._unloadTile(tile);
      tile.destroy();
    }
  }, {
    key: "_initializeTiles3DTileset",
    value: function _initializeTiles3DTileset(tilesetJson) {
      if (tilesetJson.queryString) {
        var searchParams = new URLSearchParams(tilesetJson.queryString);
        var queryParams = Object.fromEntries(searchParams.entries());
        this._queryParams = _objectSpread(_objectSpread({}, this._queryParams), queryParams);
      }
      this.asset = tilesetJson.asset;
      if (!this.asset) {
        throw new Error('Tileset must have an asset property.');
      }
      if (this.asset.version !== '0.0' && this.asset.version !== '1.0' && this.asset.version !== '1.1') {
        throw new Error('The tileset must be 3D Tiles version 0.0 or 1.0.');
      }
      if ('tilesetVersion' in this.asset) {
        this._queryParams.v = this.asset.tilesetVersion;
      }
      this.credits = {
        attributions: this.options.attributions || []
      };
      this.description = this.options.description || '';
      this.properties = tilesetJson.properties;
      this.geometricError = tilesetJson.geometricError;
      this._extensionsUsed = tilesetJson.extensionsUsed || [];
      this.extras = tilesetJson.extras;
    }
  }, {
    key: "_initializeI3STileset",
    value: function _initializeI3STileset() {
      if (this.loadOptions.i3s && 'token' in this.loadOptions.i3s) {
        this._queryParams.token = this.loadOptions.i3s.token;
      }
    }
  }]);
  return Tileset3D;
}();
exports.Tileset3D = Tileset3D;
//# sourceMappingURL=tileset-3d.js.map