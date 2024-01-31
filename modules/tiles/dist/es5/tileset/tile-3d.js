"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tile3D = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _core = require("@math.gl/core");
var _culling = require("@math.gl/culling");
var _core2 = require("@loaders.gl/core");
var _constants = require("../constants");
var _boundingVolume = require("./helpers/bounding-volume");
var _tiles3dLod = require("./helpers/tiles-3d-lod");
var _i3sLod = require("./helpers/i3s-lod");
var _dTilesOptions = require("./helpers/3d-tiles-options");
var _tilesetTraverser = require("./tileset-traverser");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var scratchVector = new _core.Vector3();
function defined(x) {
  return x !== undefined && x !== null;
}
var Tile3D = function () {
  function Tile3D(tileset, header, parentHeader) {
    var extendedId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    (0, _classCallCheck2.default)(this, Tile3D);
    (0, _defineProperty2.default)(this, "tileset", void 0);
    (0, _defineProperty2.default)(this, "header", void 0);
    (0, _defineProperty2.default)(this, "id", void 0);
    (0, _defineProperty2.default)(this, "url", void 0);
    (0, _defineProperty2.default)(this, "parent", void 0);
    (0, _defineProperty2.default)(this, "refine", void 0);
    (0, _defineProperty2.default)(this, "type", void 0);
    (0, _defineProperty2.default)(this, "contentUrl", void 0);
    (0, _defineProperty2.default)(this, "lodMetricType", 'geometricError');
    (0, _defineProperty2.default)(this, "lodMetricValue", 0);
    (0, _defineProperty2.default)(this, "boundingVolume", null);
    (0, _defineProperty2.default)(this, "content", null);
    (0, _defineProperty2.default)(this, "contentState", _constants.TILE_CONTENT_STATE.UNLOADED);
    (0, _defineProperty2.default)(this, "gpuMemoryUsageInBytes", 0);
    (0, _defineProperty2.default)(this, "children", []);
    (0, _defineProperty2.default)(this, "depth", 0);
    (0, _defineProperty2.default)(this, "viewportIds", []);
    (0, _defineProperty2.default)(this, "transform", new _core.Matrix4());
    (0, _defineProperty2.default)(this, "extensions", null);
    (0, _defineProperty2.default)(this, "implicitTiling", null);
    (0, _defineProperty2.default)(this, "userData", {});
    (0, _defineProperty2.default)(this, "computedTransform", void 0);
    (0, _defineProperty2.default)(this, "hasEmptyContent", false);
    (0, _defineProperty2.default)(this, "hasTilesetContent", false);
    (0, _defineProperty2.default)(this, "traverser", new _tilesetTraverser.TilesetTraverser({}));
    (0, _defineProperty2.default)(this, "_cacheNode", null);
    (0, _defineProperty2.default)(this, "_frameNumber", null);
    (0, _defineProperty2.default)(this, "_expireDate", null);
    (0, _defineProperty2.default)(this, "_expiredContent", null);
    (0, _defineProperty2.default)(this, "_boundingBox", void 0);
    (0, _defineProperty2.default)(this, "_distanceToCamera", 0);
    (0, _defineProperty2.default)(this, "_screenSpaceError", 0);
    (0, _defineProperty2.default)(this, "_visibilityPlaneMask", void 0);
    (0, _defineProperty2.default)(this, "_visible", undefined);
    (0, _defineProperty2.default)(this, "_contentBoundingVolume", void 0);
    (0, _defineProperty2.default)(this, "_viewerRequestVolume", void 0);
    (0, _defineProperty2.default)(this, "_initialTransform", new _core.Matrix4());
    (0, _defineProperty2.default)(this, "_priority", 0);
    (0, _defineProperty2.default)(this, "_selectedFrame", 0);
    (0, _defineProperty2.default)(this, "_requestedFrame", 0);
    (0, _defineProperty2.default)(this, "_selectionDepth", 0);
    (0, _defineProperty2.default)(this, "_touchedFrame", 0);
    (0, _defineProperty2.default)(this, "_centerZDepth", 0);
    (0, _defineProperty2.default)(this, "_shouldRefine", false);
    (0, _defineProperty2.default)(this, "_stackLength", 0);
    (0, _defineProperty2.default)(this, "_visitedFrame", 0);
    (0, _defineProperty2.default)(this, "_inRequestVolume", false);
    (0, _defineProperty2.default)(this, "_lodJudge", null);
    this.header = header;
    this.tileset = tileset;
    this.id = extendedId || header.id;
    this.url = header.url;
    this.parent = parentHeader;
    this.refine = this._getRefine(header.refine);
    this.type = header.type;
    this.contentUrl = header.contentUrl;
    this._initializeLodMetric(header);
    this._initializeTransforms(header);
    this._initializeBoundingVolumes(header);
    this._initializeContent(header);
    this._initializeRenderingState(header);
    Object.seal(this);
  }
  (0, _createClass2.default)(Tile3D, [{
    key: "destroy",
    value: function destroy() {
      this.header = null;
    }
  }, {
    key: "isDestroyed",
    value: function isDestroyed() {
      return this.header === null;
    }
  }, {
    key: "selected",
    get: function get() {
      return this._selectedFrame === this.tileset._frameNumber;
    }
  }, {
    key: "isVisible",
    get: function get() {
      return this._visible;
    }
  }, {
    key: "isVisibleAndInRequestVolume",
    get: function get() {
      return this._visible && this._inRequestVolume;
    }
  }, {
    key: "hasRenderContent",
    get: function get() {
      return !this.hasEmptyContent && !this.hasTilesetContent;
    }
  }, {
    key: "hasChildren",
    get: function get() {
      return this.children.length > 0 || this.header.children && this.header.children.length > 0;
    }
  }, {
    key: "contentReady",
    get: function get() {
      return this.contentState === _constants.TILE_CONTENT_STATE.READY || this.hasEmptyContent;
    }
  }, {
    key: "contentAvailable",
    get: function get() {
      return Boolean(this.contentReady && this.hasRenderContent || this._expiredContent && !this.contentFailed);
    }
  }, {
    key: "hasUnloadedContent",
    get: function get() {
      return this.hasRenderContent && this.contentUnloaded;
    }
  }, {
    key: "contentUnloaded",
    get: function get() {
      return this.contentState === _constants.TILE_CONTENT_STATE.UNLOADED;
    }
  }, {
    key: "contentExpired",
    get: function get() {
      return this.contentState === _constants.TILE_CONTENT_STATE.EXPIRED;
    }
  }, {
    key: "contentFailed",
    get: function get() {
      return this.contentState === _constants.TILE_CONTENT_STATE.FAILED;
    }
  }, {
    key: "distanceToCamera",
    get: function get() {
      return this._distanceToCamera;
    }
  }, {
    key: "screenSpaceError",
    get: function get() {
      return this._screenSpaceError;
    }
  }, {
    key: "boundingBox",
    get: function get() {
      if (!this._boundingBox) {
        this._boundingBox = (0, _boundingVolume.getCartographicBounds)(this.header.boundingVolume, this.boundingVolume);
      }
      return this._boundingBox;
    }
  }, {
    key: "getScreenSpaceError",
    value: function getScreenSpaceError(frameState, useParentLodMetric) {
      switch (this.tileset.type) {
        case _constants.TILESET_TYPE.I3S:
          return (0, _i3sLod.getProjectedRadius)(this, frameState);
        case _constants.TILESET_TYPE.TILES3D:
          return (0, _tiles3dLod.getTiles3DScreenSpaceError)(this, frameState, useParentLodMetric);
        default:
          throw new Error('Unsupported tileset type');
      }
    }
  }, {
    key: "unselect",
    value: function unselect() {
      this._selectedFrame = 0;
    }
  }, {
    key: "_getGpuMemoryUsageInBytes",
    value: function _getGpuMemoryUsageInBytes() {
      return this.content.gpuMemoryUsageInBytes || this.content.byteLength || 0;
    }
  }, {
    key: "_getPriority",
    value: function _getPriority() {
      var traverser = this.tileset._traverser;
      var skipLevelOfDetail = traverser.options.skipLevelOfDetail;
      var maySkipTile = this.refine === _constants.TILE_REFINEMENT.ADD || skipLevelOfDetail;
      if (maySkipTile && !this.isVisible && this._visible !== undefined) {
        return -1;
      }
      if (this.tileset._frameNumber - this._touchedFrame >= 1) {
        return -1;
      }
      if (this.contentState === _constants.TILE_CONTENT_STATE.UNLOADED) {
        return -1;
      }
      var parent = this.parent;
      var useParentScreenSpaceError = parent && (!maySkipTile || this._screenSpaceError === 0.0 || parent.hasTilesetContent);
      var screenSpaceError = useParentScreenSpaceError ? parent._screenSpaceError : this._screenSpaceError;
      var rootScreenSpaceError = traverser.root ? traverser.root._screenSpaceError : 0.0;
      return Math.max(rootScreenSpaceError - screenSpaceError, 0);
    }
  }, {
    key: "loadContent",
    value: function () {
      var _loadContent = (0, _asyncToGenerator2.default)(_regenerator.default.mark(function _callee() {
        var expired, requestToken, contentUrl, loader, options;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (!this.hasEmptyContent) {
                _context.next = 2;
                break;
              }
              return _context.abrupt("return", false);
            case 2:
              if (!this.content) {
                _context.next = 4;
                break;
              }
              return _context.abrupt("return", true);
            case 4:
              expired = this.contentExpired;
              if (expired) {
                this._expireDate = null;
              }
              this.contentState = _constants.TILE_CONTENT_STATE.LOADING;
              _context.next = 9;
              return this.tileset._requestScheduler.scheduleRequest(this.id, this._getPriority.bind(this));
            case 9:
              requestToken = _context.sent;
              if (requestToken) {
                _context.next = 13;
                break;
              }
              this.contentState = _constants.TILE_CONTENT_STATE.UNLOADED;
              return _context.abrupt("return", false);
            case 13:
              _context.prev = 13;
              contentUrl = this.tileset.getTileUrl(this.contentUrl);
              loader = this.tileset.loader;
              options = _objectSpread(_objectSpread({}, this.tileset.loadOptions), {}, (0, _defineProperty2.default)({}, loader.id, _objectSpread(_objectSpread({}, this.tileset.loadOptions[loader.id]), {}, {
                isTileset: this.type === 'json'
              }, this._getLoaderSpecificOptions(loader.id))));
              if (!this.tileset.options.contentLoader) {
                _context.next = 23;
                break;
              }
              _context.next = 20;
              return this.tileset.options.contentLoader(this);
            case 20:
              this.content = _context.sent;
              _context.next = 26;
              break;
            case 23:
              _context.next = 25;
              return (0, _core2.load)(contentUrl, loader, options);
            case 25:
              this.content = _context.sent;
            case 26:
              if (this._isTileset()) {
                this.tileset._initializeTileHeaders(this.content, this);
              }
              this.contentState = _constants.TILE_CONTENT_STATE.READY;
              this._onContentLoaded();
              return _context.abrupt("return", true);
            case 32:
              _context.prev = 32;
              _context.t0 = _context["catch"](13);
              this.contentState = _constants.TILE_CONTENT_STATE.FAILED;
              throw _context.t0;
            case 36:
              _context.prev = 36;
              requestToken.done();
              return _context.finish(36);
            case 39:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[13, 32, 36, 39]]);
      }));
      function loadContent() {
        return _loadContent.apply(this, arguments);
      }
      return loadContent;
    }()
  }, {
    key: "unloadContent",
    value: function unloadContent() {
      if (this.content && this.content.destroy) {
        this.content.destroy();
      }
      this.content = null;
      if (this.header.content && this.header.content.destroy) {
        this.header.content.destroy();
      }
      this.header.content = null;
      this.contentState = _constants.TILE_CONTENT_STATE.UNLOADED;
      return true;
    }
  }, {
    key: "updateVisibility",
    value: function updateVisibility(frameState, viewportIds) {
      if (this._frameNumber === frameState.frameNumber) {
        return;
      }
      var parent = this.parent;
      var parentVisibilityPlaneMask = parent ? parent._visibilityPlaneMask : _culling.CullingVolume.MASK_INDETERMINATE;
      if (this.tileset._traverser.options.updateTransforms) {
        var parentTransform = parent ? parent.computedTransform : this.tileset.modelMatrix;
        this._updateTransform(parentTransform);
      }
      this._distanceToCamera = this.distanceToTile(frameState);
      this._screenSpaceError = this.getScreenSpaceError(frameState, false);
      this._visibilityPlaneMask = this.visibility(frameState, parentVisibilityPlaneMask);
      this._visible = this._visibilityPlaneMask !== _culling.CullingVolume.MASK_OUTSIDE;
      this._inRequestVolume = this.insideViewerRequestVolume(frameState);
      this._frameNumber = frameState.frameNumber;
      this.viewportIds = viewportIds;
    }
  }, {
    key: "visibility",
    value: function visibility(frameState, parentVisibilityPlaneMask) {
      var cullingVolume = frameState.cullingVolume;
      var boundingVolume = this.boundingVolume;
      return cullingVolume.computeVisibilityWithPlaneMask(boundingVolume, parentVisibilityPlaneMask);
    }
  }, {
    key: "contentVisibility",
    value: function contentVisibility() {
      return true;
    }
  }, {
    key: "distanceToTile",
    value: function distanceToTile(frameState) {
      var boundingVolume = this.boundingVolume;
      return Math.sqrt(Math.max(boundingVolume.distanceSquaredTo(frameState.camera.position), 0));
    }
  }, {
    key: "cameraSpaceZDepth",
    value: function cameraSpaceZDepth(_ref) {
      var camera = _ref.camera;
      var boundingVolume = this.boundingVolume;
      scratchVector.subVectors(boundingVolume.center, camera.position);
      return camera.direction.dot(scratchVector);
    }
  }, {
    key: "insideViewerRequestVolume",
    value: function insideViewerRequestVolume(frameState) {
      var viewerRequestVolume = this._viewerRequestVolume;
      return !viewerRequestVolume || viewerRequestVolume.distanceSquaredTo(frameState.camera.position) <= 0;
    }
  }, {
    key: "updateExpiration",
    value: function updateExpiration() {
      if (defined(this._expireDate) && this.contentReady && !this.hasEmptyContent) {
        var now = Date.now();
        if (Date.lessThan(this._expireDate, now)) {
          this.contentState = _constants.TILE_CONTENT_STATE.EXPIRED;
          this._expiredContent = this.content;
        }
      }
    }
  }, {
    key: "extras",
    get: function get() {
      return this.header.extras;
    }
  }, {
    key: "_initializeLodMetric",
    value: function _initializeLodMetric(header) {
      if ('lodMetricType' in header) {
        this.lodMetricType = header.lodMetricType;
      } else {
        this.lodMetricType = this.parent && this.parent.lodMetricType || this.tileset.lodMetricType;
        console.warn("3D Tile: Required prop lodMetricType is undefined. Using parent lodMetricType");
      }
      if ('lodMetricValue' in header) {
        this.lodMetricValue = header.lodMetricValue;
      } else {
        this.lodMetricValue = this.parent && this.parent.lodMetricValue || this.tileset.lodMetricValue;
        console.warn('3D Tile: Required prop lodMetricValue is undefined. Using parent lodMetricValue');
      }
    }
  }, {
    key: "_initializeTransforms",
    value: function _initializeTransforms(tileHeader) {
      this.transform = tileHeader.transform ? new _core.Matrix4(tileHeader.transform) : new _core.Matrix4();
      var parent = this.parent;
      var tileset = this.tileset;
      var parentTransform = parent && parent.computedTransform ? parent.computedTransform.clone() : tileset.modelMatrix.clone();
      this.computedTransform = new _core.Matrix4(parentTransform).multiplyRight(this.transform);
      var parentInitialTransform = parent && parent._initialTransform ? parent._initialTransform.clone() : new _core.Matrix4();
      this._initialTransform = new _core.Matrix4(parentInitialTransform).multiplyRight(this.transform);
    }
  }, {
    key: "_initializeBoundingVolumes",
    value: function _initializeBoundingVolumes(tileHeader) {
      this._contentBoundingVolume = null;
      this._viewerRequestVolume = null;
      this._updateBoundingVolume(tileHeader);
    }
  }, {
    key: "_initializeContent",
    value: function _initializeContent(tileHeader) {
      this.content = {
        _tileset: this.tileset,
        _tile: this
      };
      this.hasEmptyContent = true;
      this.contentState = _constants.TILE_CONTENT_STATE.UNLOADED;
      this.hasTilesetContent = false;
      if (tileHeader.contentUrl) {
        this.content = null;
        this.hasEmptyContent = false;
      }
    }
  }, {
    key: "_initializeRenderingState",
    value: function _initializeRenderingState(header) {
      this.depth = header.level || (this.parent ? this.parent.depth + 1 : 0);
      this._shouldRefine = false;
      this._distanceToCamera = 0;
      this._centerZDepth = 0;
      this._screenSpaceError = 0;
      this._visibilityPlaneMask = _culling.CullingVolume.MASK_INDETERMINATE;
      this._visible = undefined;
      this._inRequestVolume = false;
      this._stackLength = 0;
      this._selectionDepth = 0;
      this._frameNumber = 0;
      this._touchedFrame = 0;
      this._visitedFrame = 0;
      this._selectedFrame = 0;
      this._requestedFrame = 0;
      this._priority = 0.0;
    }
  }, {
    key: "_getRefine",
    value: function _getRefine(refine) {
      return refine || this.parent && this.parent.refine || _constants.TILE_REFINEMENT.REPLACE;
    }
  }, {
    key: "_isTileset",
    value: function _isTileset() {
      return this.contentUrl.indexOf('.json') !== -1;
    }
  }, {
    key: "_onContentLoaded",
    value: function _onContentLoaded() {
      switch (this.content && this.content.type) {
        case 'vctr':
        case 'geom':
          this.tileset._traverser.disableSkipLevelOfDetail = true;
          break;
        default:
      }
      if (this._isTileset()) {
        this.hasTilesetContent = true;
      } else {
        this.gpuMemoryUsageInBytes = this._getGpuMemoryUsageInBytes();
      }
    }
  }, {
    key: "_updateBoundingVolume",
    value: function _updateBoundingVolume(header) {
      this.boundingVolume = (0, _boundingVolume.createBoundingVolume)(header.boundingVolume, this.computedTransform, this.boundingVolume);
      var content = header.content;
      if (!content) {
        return;
      }
      if (content.boundingVolume) {
        this._contentBoundingVolume = (0, _boundingVolume.createBoundingVolume)(content.boundingVolume, this.computedTransform, this._contentBoundingVolume);
      }
      if (header.viewerRequestVolume) {
        this._viewerRequestVolume = (0, _boundingVolume.createBoundingVolume)(header.viewerRequestVolume, this.computedTransform, this._viewerRequestVolume);
      }
    }
  }, {
    key: "_updateTransform",
    value: function _updateTransform() {
      var parentTransform = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new _core.Matrix4();
      var computedTransform = parentTransform.clone().multiplyRight(this.transform);
      var didTransformChange = !computedTransform.equals(this.computedTransform);
      if (!didTransformChange) {
        return;
      }
      this.computedTransform = computedTransform;
      this._updateBoundingVolume(this.header);
    }
  }, {
    key: "_getLoaderSpecificOptions",
    value: function _getLoaderSpecificOptions(loaderId) {
      switch (loaderId) {
        case 'i3s':
          return _objectSpread(_objectSpread({}, this.tileset.options.i3s), {}, {
            _tileOptions: {
              attributeUrls: this.header.attributeUrls,
              textureUrl: this.header.textureUrl,
              textureFormat: this.header.textureFormat,
              textureLoaderOptions: this.header.textureLoaderOptions,
              materialDefinition: this.header.materialDefinition,
              isDracoGeometry: this.header.isDracoGeometry,
              mbs: this.header.mbs
            },
            _tilesetOptions: {
              store: this.tileset.tileset.store,
              attributeStorageInfo: this.tileset.tileset.attributeStorageInfo,
              fields: this.tileset.tileset.fields
            },
            isTileHeader: false
          });
        case '3d-tiles':
        case 'cesium-ion':
        default:
          return (0, _dTilesOptions.get3dTilesOptions)(this.tileset.tileset);
      }
    }
  }]);
  return Tile3D;
}();
exports.Tile3D = Tile3D;
//# sourceMappingURL=tile-3d.js.map