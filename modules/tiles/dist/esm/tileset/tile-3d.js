import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import { Vector3, Matrix4 } from '@math.gl/core';
import { CullingVolume } from '@math.gl/culling';
import { load } from '@loaders.gl/core';
import { TILE_REFINEMENT, TILE_CONTENT_STATE, TILESET_TYPE } from '../constants';
import { createBoundingVolume, getCartographicBounds } from './helpers/bounding-volume';
import { getTiles3DScreenSpaceError } from './helpers/tiles-3d-lod';
import { getProjectedRadius } from './helpers/i3s-lod';
import { get3dTilesOptions } from './helpers/3d-tiles-options';
import { TilesetTraverser } from './tileset-traverser';
const scratchVector = new Vector3();
function defined(x) {
  return x !== undefined && x !== null;
}
export class Tile3D {
  constructor(tileset, header, parentHeader) {
    let extendedId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    _defineProperty(this, "tileset", void 0);
    _defineProperty(this, "header", void 0);
    _defineProperty(this, "id", void 0);
    _defineProperty(this, "url", void 0);
    _defineProperty(this, "parent", void 0);
    _defineProperty(this, "refine", void 0);
    _defineProperty(this, "type", void 0);
    _defineProperty(this, "contentUrl", void 0);
    _defineProperty(this, "lodMetricType", 'geometricError');
    _defineProperty(this, "lodMetricValue", 0);
    _defineProperty(this, "boundingVolume", null);
    _defineProperty(this, "content", null);
    _defineProperty(this, "contentState", TILE_CONTENT_STATE.UNLOADED);
    _defineProperty(this, "gpuMemoryUsageInBytes", 0);
    _defineProperty(this, "children", []);
    _defineProperty(this, "depth", 0);
    _defineProperty(this, "viewportIds", []);
    _defineProperty(this, "transform", new Matrix4());
    _defineProperty(this, "extensions", null);
    _defineProperty(this, "implicitTiling", null);
    _defineProperty(this, "userData", {});
    _defineProperty(this, "computedTransform", void 0);
    _defineProperty(this, "hasEmptyContent", false);
    _defineProperty(this, "hasTilesetContent", false);
    _defineProperty(this, "traverser", new TilesetTraverser({}));
    _defineProperty(this, "_cacheNode", null);
    _defineProperty(this, "_frameNumber", null);
    _defineProperty(this, "_expireDate", null);
    _defineProperty(this, "_expiredContent", null);
    _defineProperty(this, "_boundingBox", void 0);
    _defineProperty(this, "_distanceToCamera", 0);
    _defineProperty(this, "_screenSpaceError", 0);
    _defineProperty(this, "_visibilityPlaneMask", void 0);
    _defineProperty(this, "_visible", undefined);
    _defineProperty(this, "_contentBoundingVolume", void 0);
    _defineProperty(this, "_viewerRequestVolume", void 0);
    _defineProperty(this, "_initialTransform", new Matrix4());
    _defineProperty(this, "_priority", 0);
    _defineProperty(this, "_selectedFrame", 0);
    _defineProperty(this, "_requestedFrame", 0);
    _defineProperty(this, "_selectionDepth", 0);
    _defineProperty(this, "_touchedFrame", 0);
    _defineProperty(this, "_centerZDepth", 0);
    _defineProperty(this, "_shouldRefine", false);
    _defineProperty(this, "_stackLength", 0);
    _defineProperty(this, "_visitedFrame", 0);
    _defineProperty(this, "_inRequestVolume", false);
    _defineProperty(this, "_lodJudge", null);
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
  destroy() {
    this.header = null;
  }
  isDestroyed() {
    return this.header === null;
  }
  get selected() {
    return this._selectedFrame === this.tileset._frameNumber;
  }
  get isVisible() {
    return this._visible;
  }
  get isVisibleAndInRequestVolume() {
    return this._visible && this._inRequestVolume;
  }
  get hasRenderContent() {
    return !this.hasEmptyContent && !this.hasTilesetContent;
  }
  get hasChildren() {
    return this.children.length > 0 || this.header.children && this.header.children.length > 0;
  }
  get contentReady() {
    return this.contentState === TILE_CONTENT_STATE.READY || this.hasEmptyContent;
  }
  get contentAvailable() {
    return Boolean(this.contentReady && this.hasRenderContent || this._expiredContent && !this.contentFailed);
  }
  get hasUnloadedContent() {
    return this.hasRenderContent && this.contentUnloaded;
  }
  get contentUnloaded() {
    return this.contentState === TILE_CONTENT_STATE.UNLOADED;
  }
  get contentExpired() {
    return this.contentState === TILE_CONTENT_STATE.EXPIRED;
  }
  get contentFailed() {
    return this.contentState === TILE_CONTENT_STATE.FAILED;
  }
  get distanceToCamera() {
    return this._distanceToCamera;
  }
  get screenSpaceError() {
    return this._screenSpaceError;
  }
  get boundingBox() {
    if (!this._boundingBox) {
      this._boundingBox = getCartographicBounds(this.header.boundingVolume, this.boundingVolume);
    }
    return this._boundingBox;
  }
  getScreenSpaceError(frameState, useParentLodMetric) {
    switch (this.tileset.type) {
      case TILESET_TYPE.I3S:
        return getProjectedRadius(this, frameState);
      case TILESET_TYPE.TILES3D:
        return getTiles3DScreenSpaceError(this, frameState, useParentLodMetric);
      default:
        throw new Error('Unsupported tileset type');
    }
  }
  unselect() {
    this._selectedFrame = 0;
  }
  _getGpuMemoryUsageInBytes() {
    return this.content.gpuMemoryUsageInBytes || this.content.byteLength || 0;
  }
  _getPriority() {
    const traverser = this.tileset._traverser;
    const {
      skipLevelOfDetail
    } = traverser.options;
    const maySkipTile = this.refine === TILE_REFINEMENT.ADD || skipLevelOfDetail;
    if (maySkipTile && !this.isVisible && this._visible !== undefined) {
      return -1;
    }
    if (this.tileset._frameNumber - this._touchedFrame >= 1) {
      return -1;
    }
    if (this.contentState === TILE_CONTENT_STATE.UNLOADED) {
      return -1;
    }
    const parent = this.parent;
    const useParentScreenSpaceError = parent && (!maySkipTile || this._screenSpaceError === 0.0 || parent.hasTilesetContent);
    const screenSpaceError = useParentScreenSpaceError ? parent._screenSpaceError : this._screenSpaceError;
    const rootScreenSpaceError = traverser.root ? traverser.root._screenSpaceError : 0.0;
    return Math.max(rootScreenSpaceError - screenSpaceError, 0);
  }
  async loadContent() {
    if (this.hasEmptyContent) {
      return false;
    }
    if (this.content) {
      return true;
    }
    const expired = this.contentExpired;
    if (expired) {
      this._expireDate = null;
    }
    this.contentState = TILE_CONTENT_STATE.LOADING;
    const requestToken = await this.tileset._requestScheduler.scheduleRequest(this.id, this._getPriority.bind(this));
    if (!requestToken) {
      this.contentState = TILE_CONTENT_STATE.UNLOADED;
      return false;
    }
    try {
      const contentUrl = this.tileset.getTileUrl(this.contentUrl);
      const loader = this.tileset.loader;
      const options = {
        ...this.tileset.loadOptions,
        [loader.id]: {
          ...this.tileset.loadOptions[loader.id],
          isTileset: this.type === 'json',
          ...this._getLoaderSpecificOptions(loader.id)
        }
      };
      if (this.tileset.options.contentLoader) {
        this.content = await this.tileset.options.contentLoader(this);
      } else {
        this.content = await load(contentUrl, loader, options);
      }
      if (this._isTileset()) {
        this.tileset._initializeTileHeaders(this.content, this);
      }
      this.contentState = TILE_CONTENT_STATE.READY;
      this._onContentLoaded();
      return true;
    } catch (error) {
      this.contentState = TILE_CONTENT_STATE.FAILED;
      throw error;
    } finally {
      requestToken.done();
    }
  }
  unloadContent() {
    if (this.content && this.content.destroy) {
      this.content.destroy();
    }
    this.content = null;
    if (this.header.content && this.header.content.destroy) {
      this.header.content.destroy();
    }
    this.header.content = null;
    this.contentState = TILE_CONTENT_STATE.UNLOADED;
    return true;
  }
  updateVisibility(frameState, viewportIds) {
    if (this._frameNumber === frameState.frameNumber) {
      return;
    }
    const parent = this.parent;
    const parentVisibilityPlaneMask = parent ? parent._visibilityPlaneMask : CullingVolume.MASK_INDETERMINATE;
    if (this.tileset._traverser.options.updateTransforms) {
      const parentTransform = parent ? parent.computedTransform : this.tileset.modelMatrix;
      this._updateTransform(parentTransform);
    }
    this._distanceToCamera = this.distanceToTile(frameState);
    this._screenSpaceError = this.getScreenSpaceError(frameState, false);
    this._visibilityPlaneMask = this.visibility(frameState, parentVisibilityPlaneMask);
    this._visible = this._visibilityPlaneMask !== CullingVolume.MASK_OUTSIDE;
    this._inRequestVolume = this.insideViewerRequestVolume(frameState);
    this._frameNumber = frameState.frameNumber;
    this.viewportIds = viewportIds;
  }
  visibility(frameState, parentVisibilityPlaneMask) {
    const {
      cullingVolume
    } = frameState;
    const {
      boundingVolume
    } = this;
    return cullingVolume.computeVisibilityWithPlaneMask(boundingVolume, parentVisibilityPlaneMask);
  }
  contentVisibility() {
    return true;
  }
  distanceToTile(frameState) {
    const boundingVolume = this.boundingVolume;
    return Math.sqrt(Math.max(boundingVolume.distanceSquaredTo(frameState.camera.position), 0));
  }
  cameraSpaceZDepth(_ref) {
    let {
      camera
    } = _ref;
    const boundingVolume = this.boundingVolume;
    scratchVector.subVectors(boundingVolume.center, camera.position);
    return camera.direction.dot(scratchVector);
  }
  insideViewerRequestVolume(frameState) {
    const viewerRequestVolume = this._viewerRequestVolume;
    return !viewerRequestVolume || viewerRequestVolume.distanceSquaredTo(frameState.camera.position) <= 0;
  }
  updateExpiration() {
    if (defined(this._expireDate) && this.contentReady && !this.hasEmptyContent) {
      const now = Date.now();
      if (Date.lessThan(this._expireDate, now)) {
        this.contentState = TILE_CONTENT_STATE.EXPIRED;
        this._expiredContent = this.content;
      }
    }
  }
  get extras() {
    return this.header.extras;
  }
  _initializeLodMetric(header) {
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
  _initializeTransforms(tileHeader) {
    this.transform = tileHeader.transform ? new Matrix4(tileHeader.transform) : new Matrix4();
    const parent = this.parent;
    const tileset = this.tileset;
    const parentTransform = parent && parent.computedTransform ? parent.computedTransform.clone() : tileset.modelMatrix.clone();
    this.computedTransform = new Matrix4(parentTransform).multiplyRight(this.transform);
    const parentInitialTransform = parent && parent._initialTransform ? parent._initialTransform.clone() : new Matrix4();
    this._initialTransform = new Matrix4(parentInitialTransform).multiplyRight(this.transform);
  }
  _initializeBoundingVolumes(tileHeader) {
    this._contentBoundingVolume = null;
    this._viewerRequestVolume = null;
    this._updateBoundingVolume(tileHeader);
  }
  _initializeContent(tileHeader) {
    this.content = {
      _tileset: this.tileset,
      _tile: this
    };
    this.hasEmptyContent = true;
    this.contentState = TILE_CONTENT_STATE.UNLOADED;
    this.hasTilesetContent = false;
    if (tileHeader.contentUrl) {
      this.content = null;
      this.hasEmptyContent = false;
    }
  }
  _initializeRenderingState(header) {
    this.depth = header.level || (this.parent ? this.parent.depth + 1 : 0);
    this._shouldRefine = false;
    this._distanceToCamera = 0;
    this._centerZDepth = 0;
    this._screenSpaceError = 0;
    this._visibilityPlaneMask = CullingVolume.MASK_INDETERMINATE;
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
  _getRefine(refine) {
    return refine || this.parent && this.parent.refine || TILE_REFINEMENT.REPLACE;
  }
  _isTileset() {
    return this.contentUrl.indexOf('.json') !== -1;
  }
  _onContentLoaded() {
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
  _updateBoundingVolume(header) {
    this.boundingVolume = createBoundingVolume(header.boundingVolume, this.computedTransform, this.boundingVolume);
    const content = header.content;
    if (!content) {
      return;
    }
    if (content.boundingVolume) {
      this._contentBoundingVolume = createBoundingVolume(content.boundingVolume, this.computedTransform, this._contentBoundingVolume);
    }
    if (header.viewerRequestVolume) {
      this._viewerRequestVolume = createBoundingVolume(header.viewerRequestVolume, this.computedTransform, this._viewerRequestVolume);
    }
  }
  _updateTransform() {
    let parentTransform = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Matrix4();
    const computedTransform = parentTransform.clone().multiplyRight(this.transform);
    const didTransformChange = !computedTransform.equals(this.computedTransform);
    if (!didTransformChange) {
      return;
    }
    this.computedTransform = computedTransform;
    this._updateBoundingVolume(this.header);
  }
  _getLoaderSpecificOptions(loaderId) {
    switch (loaderId) {
      case 'i3s':
        return {
          ...this.tileset.options.i3s,
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
        };
      case '3d-tiles':
      case 'cesium-ion':
      default:
        return get3dTilesOptions(this.tileset.tileset);
    }
  }
}
//# sourceMappingURL=tile-3d.js.map