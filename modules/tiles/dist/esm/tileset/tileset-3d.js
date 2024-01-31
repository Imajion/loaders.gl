import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import { Matrix4, Vector3 } from '@math.gl/core';
import { Ellipsoid } from '@math.gl/geospatial';
import { Stats } from '@probe.gl/stats';
import { RequestScheduler, path } from '@loaders.gl/loader-utils';
import { TilesetCache } from './tileset-cache';
import { getFrameState, limitSelectedTiles } from './helpers/frame-state';
import { getZoomFromBoundingVolume, getZoomFromExtent, getZoomFromFullExtent } from './helpers/zoom';
import { Tile3D } from './tile-3d';
import { TILESET_TYPE } from '../constants';
import { TilesetTraverser } from './tileset-traverser';
import { Tileset3DTraverser } from './format-3d-tiles/tileset-3d-traverser';
import { I3STilesetTraverser } from './format-i3s/i3s-tileset-traverser';
const DEFAULT_PROPS = {
  description: '',
  ellipsoid: Ellipsoid.WGS84,
  modelMatrix: new Matrix4(),
  throttleRequests: true,
  maxRequests: 64,
  maximumMemoryUsage: 32,
  maximumTilesSelected: 0,
  debounceTime: 0,
  onTileLoad: () => {},
  onTileUnload: () => {},
  onTileError: () => {},
  onTraversalComplete: selectedTiles => selectedTiles,
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
const TILES_TOTAL = 'Tiles In Tileset(s)';
const TILES_IN_MEMORY = 'Tiles In Memory';
const TILES_IN_VIEW = 'Tiles In View';
const TILES_RENDERABLE = 'Tiles To Render';
const TILES_LOADED = 'Tiles Loaded';
const TILES_LOADING = 'Tiles Loading';
const TILES_UNLOADED = 'Tiles Unloaded';
const TILES_LOAD_FAILED = 'Failed Tile Loads';
const POINTS_COUNT = 'Points/Vertices';
const TILES_GPU_MEMORY = 'Tile Memory Use';
export class Tileset3D {
  constructor(tileset, options) {
    _defineProperty(this, "options", void 0);
    _defineProperty(this, "loadOptions", void 0);
    _defineProperty(this, "type", void 0);
    _defineProperty(this, "tileset", void 0);
    _defineProperty(this, "loader", void 0);
    _defineProperty(this, "url", void 0);
    _defineProperty(this, "basePath", void 0);
    _defineProperty(this, "modelMatrix", void 0);
    _defineProperty(this, "ellipsoid", void 0);
    _defineProperty(this, "lodMetricType", void 0);
    _defineProperty(this, "lodMetricValue", void 0);
    _defineProperty(this, "refine", void 0);
    _defineProperty(this, "root", null);
    _defineProperty(this, "roots", {});
    _defineProperty(this, "asset", {});
    _defineProperty(this, "description", '');
    _defineProperty(this, "properties", void 0);
    _defineProperty(this, "extras", null);
    _defineProperty(this, "attributions", {});
    _defineProperty(this, "credits", {});
    _defineProperty(this, "stats", void 0);
    _defineProperty(this, "contentFormats", {
      draco: false,
      meshopt: false,
      dds: false,
      ktx2: false
    });
    _defineProperty(this, "cartographicCenter", null);
    _defineProperty(this, "cartesianCenter", null);
    _defineProperty(this, "zoom", 1);
    _defineProperty(this, "boundingVolume", null);
    _defineProperty(this, "dynamicScreenSpaceErrorComputedDensity", 0.0);
    _defineProperty(this, "maximumMemoryUsage", 32);
    _defineProperty(this, "gpuMemoryUsageInBytes", 0);
    _defineProperty(this, "_frameNumber", 0);
    _defineProperty(this, "_queryParams", {});
    _defineProperty(this, "_extensionsUsed", []);
    _defineProperty(this, "_tiles", {});
    _defineProperty(this, "_pendingCount", 0);
    _defineProperty(this, "selectedTiles", []);
    _defineProperty(this, "traverseCounter", 0);
    _defineProperty(this, "geometricError", 0);
    _defineProperty(this, "lastUpdatedVieports", null);
    _defineProperty(this, "_requestedTiles", []);
    _defineProperty(this, "_emptyTiles", []);
    _defineProperty(this, "frameStateData", {});
    _defineProperty(this, "_traverser", void 0);
    _defineProperty(this, "_cache", new TilesetCache());
    _defineProperty(this, "_requestScheduler", void 0);
    _defineProperty(this, "updatePromise", null);
    _defineProperty(this, "tilesetInitializationPromise", void 0);
    this.options = {
      ...DEFAULT_PROPS,
      ...options
    };
    this.tileset = tileset;
    this.loader = tileset.loader;
    this.type = tileset.type;
    this.url = tileset.url;
    this.basePath = tileset.basePath || path.dirname(this.url);
    this.modelMatrix = this.options.modelMatrix;
    this.ellipsoid = this.options.ellipsoid;
    this.lodMetricType = tileset.lodMetricType;
    this.lodMetricValue = tileset.lodMetricValue;
    this.refine = tileset.root.refine;
    this.loadOptions = this.options.loadOptions || {};
    this._traverser = this._initializeTraverser();
    this._requestScheduler = new RequestScheduler({
      throttleRequests: this.options.throttleRequests,
      maxRequests: this.options.maxRequests
    });
    this.stats = new Stats({
      id: this.url
    });
    this._initializeStats();
    this.tilesetInitializationPromise = this._initializeTileSet(tileset);
  }
  destroy() {
    this._destroy();
  }
  isLoaded() {
    return this._pendingCount === 0 && this._frameNumber !== 0 && this._requestedTiles.length === 0;
  }
  get tiles() {
    return Object.values(this._tiles);
  }
  get frameNumber() {
    return this._frameNumber;
  }
  get queryParams() {
    return new URLSearchParams(this._queryParams).toString();
  }
  setProps(props) {
    this.options = {
      ...this.options,
      ...props
    };
  }
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options
    };
  }
  getTileUrl(tilePath) {
    const isDataUrl = tilePath.startsWith('data:');
    if (isDataUrl) {
      return tilePath;
    }
    return "".concat(tilePath).concat(tilePath.includes('?') ? '&' : '?').concat(this.queryParams);
  }
  hasExtension(extensionName) {
    return Boolean(this._extensionsUsed.indexOf(extensionName) > -1);
  }
  update() {
    let viewports = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    this.tilesetInitializationPromise.then(() => {
      if (!viewports && this.lastUpdatedVieports) {
        viewports = this.lastUpdatedVieports;
      } else {
        this.lastUpdatedVieports = viewports;
      }
      if (viewports) {
        this.doUpdate(viewports);
      }
    });
  }
  async selectTiles() {
    let viewports = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    let _getFrameState = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    await this.tilesetInitializationPromise;
    if (viewports) {
      this.lastUpdatedVieports = viewports;
    }
    if (!this.updatePromise) {
      this.updatePromise = new Promise(resolve => {
        setTimeout(() => {
          if (this.lastUpdatedVieports) {
            this.doUpdate(this.lastUpdatedVieports, _getFrameState);
          }
          resolve(this._frameNumber);
          this.updatePromise = null;
        }, this.options.debounceTime);
      });
    }
    return this.updatePromise;
  }
  doUpdate(viewports) {
    let _getFrameState = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    if ('loadTiles' in this.options && !this.options.loadTiles) {
      return;
    }
    if (this.traverseCounter > 0) {
      return;
    }
    const preparedViewports = viewports instanceof Array ? viewports : [viewports];
    this._cache.reset();
    this._frameNumber++;
    this.traverseCounter = preparedViewports.length;
    const viewportsToTraverse = [];
    for (const viewport of preparedViewports) {
      const id = viewport.id;
      if (this._needTraverse(id)) {
        viewportsToTraverse.push(id);
      } else {
        this.traverseCounter--;
      }
    }
    for (const viewport of preparedViewports) {
      const id = viewport.id;
      if (!this.roots[id]) {
        this.roots[id] = this._initializeTileHeaders(this.tileset, null);
      }
      if (!viewportsToTraverse.includes(id)) {
        continue;
      }
      const frameState = _getFrameState ? _getFrameState(viewport, this._frameNumber) : getFrameState(viewport, this._frameNumber);
      this._traverser.traverse(this.roots[id], frameState, this.options);
    }
  }
  _needTraverse(viewportId) {
    let traverserId = viewportId;
    if (this.options.viewportTraversersMap) {
      traverserId = this.options.viewportTraversersMap[viewportId];
    }
    if (traverserId !== viewportId) {
      return false;
    }
    return true;
  }
  _onTraversalEnd(frameState) {
    const id = frameState.viewport.id;
    if (!this.frameStateData[id]) {
      this.frameStateData[id] = {
        selectedTiles: [],
        _requestedTiles: [],
        _emptyTiles: []
      };
    }
    const currentFrameStateData = this.frameStateData[id];
    const selectedTiles = Object.values(this._traverser.selectedTiles);
    const [filteredSelectedTiles, unselectedTiles] = limitSelectedTiles(selectedTiles, frameState, this.options.maximumTilesSelected);
    currentFrameStateData.selectedTiles = filteredSelectedTiles;
    for (const tile of unselectedTiles) {
      tile.unselect();
    }
    currentFrameStateData._requestedTiles = Object.values(this._traverser.requestedTiles);
    currentFrameStateData._emptyTiles = Object.values(this._traverser.emptyTiles);
    this.traverseCounter--;
    if (this.traverseCounter > 0) {
      return;
    }
    this._updateTiles();
  }
  _updateTiles() {
    this.selectedTiles = [];
    this._requestedTiles = [];
    this._emptyTiles = [];
    for (const frameStateKey in this.frameStateData) {
      const frameStateDataValue = this.frameStateData[frameStateKey];
      this.selectedTiles = this.selectedTiles.concat(frameStateDataValue.selectedTiles);
      this._requestedTiles = this._requestedTiles.concat(frameStateDataValue._requestedTiles);
      this._emptyTiles = this._emptyTiles.concat(frameStateDataValue._emptyTiles);
    }
    this.selectedTiles = this.options.onTraversalComplete(this.selectedTiles);
    for (const tile of this.selectedTiles) {
      this._tiles[tile.id] = tile;
    }
    this._loadTiles();
    this._unloadTiles();
    this._updateStats();
  }
  _tilesChanged(oldSelectedTiles, selectedTiles) {
    if (oldSelectedTiles.length !== selectedTiles.length) {
      return true;
    }
    const set1 = new Set(oldSelectedTiles.map(t => t.id));
    const set2 = new Set(selectedTiles.map(t => t.id));
    let changed = oldSelectedTiles.filter(x => !set2.has(x.id)).length > 0;
    changed = changed || selectedTiles.filter(x => !set1.has(x.id)).length > 0;
    return changed;
  }
  _loadTiles() {
    for (const tile of this._requestedTiles) {
      if (tile.contentUnloaded) {
        this._loadTile(tile);
      }
    }
  }
  _unloadTiles() {
    this._cache.unloadTiles(this, (tileset, tile) => tileset._unloadTile(tile));
  }
  _updateStats() {
    let tilesRenderable = 0;
    let pointsRenderable = 0;
    for (const tile of this.selectedTiles) {
      if (tile.contentAvailable && tile.content) {
        tilesRenderable++;
        if (tile.content.pointCount) {
          pointsRenderable += tile.content.pointCount;
        } else {
          pointsRenderable += tile.content.vertexCount;
        }
      }
    }
    this.stats.get(TILES_IN_VIEW).count = this.selectedTiles.length;
    this.stats.get(TILES_RENDERABLE).count = tilesRenderable;
    this.stats.get(POINTS_COUNT).count = pointsRenderable;
  }
  async _initializeTileSet(tilesetJson) {
    if (this.type === TILESET_TYPE.I3S) {
      this.calculateViewPropsI3S();
      tilesetJson.root = await tilesetJson.root;
    }
    this.root = this._initializeTileHeaders(tilesetJson, null);
    if (this.type === TILESET_TYPE.TILES3D) {
      this._initializeTiles3DTileset(tilesetJson);
      this.calculateViewPropsTiles3D();
    }
    if (this.type === TILESET_TYPE.I3S) {
      this._initializeI3STileset();
    }
  }
  calculateViewPropsI3S() {
    var _this$tileset$store;
    const fullExtent = this.tileset.fullExtent;
    if (fullExtent) {
      const {
        xmin,
        xmax,
        ymin,
        ymax,
        zmin,
        zmax
      } = fullExtent;
      this.cartographicCenter = new Vector3(xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2, zmin + (zmax - zmin) / 2);
      this.cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(this.cartographicCenter, new Vector3());
      this.zoom = getZoomFromFullExtent(fullExtent, this.cartographicCenter, this.cartesianCenter);
      return;
    }
    const extent = (_this$tileset$store = this.tileset.store) === null || _this$tileset$store === void 0 ? void 0 : _this$tileset$store.extent;
    if (extent) {
      const [xmin, ymin, xmax, ymax] = extent;
      this.cartographicCenter = new Vector3(xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2, 0);
      this.cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(this.cartographicCenter, new Vector3());
      this.zoom = getZoomFromExtent(extent, this.cartographicCenter, this.cartesianCenter);
      return;
    }
    console.warn('Extent is not defined in the tileset header');
    this.cartographicCenter = new Vector3();
    this.zoom = 1;
    return;
  }
  calculateViewPropsTiles3D() {
    const root = this.root;
    const {
      center
    } = root.boundingVolume;
    if (!center) {
      console.warn('center was not pre-calculated for the root tile');
      this.cartographicCenter = new Vector3();
      this.zoom = 1;
      return;
    }
    if (center[0] !== 0 || center[1] !== 0 || center[2] !== 0) {
      this.cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(center, new Vector3());
    } else {
      this.cartographicCenter = new Vector3(0, 0, -Ellipsoid.WGS84.radii[0]);
    }
    this.cartesianCenter = center;
    this.zoom = getZoomFromBoundingVolume(root.boundingVolume, this.cartographicCenter);
  }
  _initializeStats() {
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
  _initializeTileHeaders(tilesetJson, parentTileHeader) {
    const rootTile = new Tile3D(this, tilesetJson.root, parentTileHeader);
    if (parentTileHeader) {
      parentTileHeader.children.push(rootTile);
      rootTile.depth = parentTileHeader.depth + 1;
    }
    if (this.type === TILESET_TYPE.TILES3D) {
      const stack = [];
      stack.push(rootTile);
      while (stack.length > 0) {
        const tile = stack.pop();
        this.stats.get(TILES_TOTAL).incrementCount();
        const children = tile.header.children || [];
        for (const childHeader of children) {
          var _childTile$contentUrl;
          const childTile = new Tile3D(this, childHeader, tile);
          if ((_childTile$contentUrl = childTile.contentUrl) !== null && _childTile$contentUrl !== void 0 && _childTile$contentUrl.includes('?session=')) {
            const url = new URL(childTile.contentUrl);
            const session = url.searchParams.get('session');
            if (session) {
              this._queryParams.session = session;
            }
          }
          tile.children.push(childTile);
          childTile.depth = tile.depth + 1;
          stack.push(childTile);
        }
      }
    }
    return rootTile;
  }
  _initializeTraverser() {
    let TraverserClass;
    const type = this.type;
    switch (type) {
      case TILESET_TYPE.TILES3D:
        TraverserClass = Tileset3DTraverser;
        break;
      case TILESET_TYPE.I3S:
        TraverserClass = I3STilesetTraverser;
        break;
      default:
        TraverserClass = TilesetTraverser;
    }
    return new TraverserClass({
      basePath: this.basePath,
      onTraversalEnd: this._onTraversalEnd.bind(this)
    });
  }
  _destroyTileHeaders(parentTile) {
    this._destroySubtree(parentTile);
  }
  async _loadTile(tile) {
    let loaded;
    try {
      this._onStartTileLoading();
      loaded = await tile.loadContent();
    } catch (error) {
      this._onTileLoadError(tile, error instanceof Error ? error : new Error('load failed'));
    } finally {
      this._onEndTileLoading();
      this._onTileLoad(tile, loaded);
    }
  }
  _onTileLoadError(tile, error) {
    this.stats.get(TILES_LOAD_FAILED).incrementCount();
    const message = error.message || error.toString();
    const url = tile.url;
    console.error("A 3D tile failed to load: ".concat(tile.url, " ").concat(message));
    this.options.onTileError(tile, message, url);
  }
  _onTileLoad(tile, loaded) {
    if (!loaded) {
      return;
    }
    if (this.type === TILESET_TYPE.I3S) {
      var _this$tileset, _this$tileset$nodePag;
      const nodesInNodePages = ((_this$tileset = this.tileset) === null || _this$tileset === void 0 ? void 0 : (_this$tileset$nodePag = _this$tileset.nodePagesTile) === null || _this$tileset$nodePag === void 0 ? void 0 : _this$tileset$nodePag.nodesInNodePages) || 0;
      this.stats.get(TILES_TOTAL).reset();
      this.stats.get(TILES_TOTAL).addCount(nodesInNodePages);
    }
    this.updateContentTypes(tile);
    this._addTileToCache(tile);
    this.options.onTileLoad(tile);
  }
  updateContentTypes(tile) {
    if (this.type === TILESET_TYPE.I3S) {
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
    } else if (this.type === TILESET_TYPE.TILES3D) {
      var _tile$content;
      const {
        extensionsRemoved = []
      } = ((_tile$content = tile.content) === null || _tile$content === void 0 ? void 0 : _tile$content.gltf) || {};
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
  _onStartTileLoading() {
    this._pendingCount++;
    this.stats.get(TILES_LOADING).incrementCount();
  }
  _onEndTileLoading() {
    this._pendingCount--;
    this.stats.get(TILES_LOADING).decrementCount();
  }
  _addTileToCache(tile) {
    this._cache.add(this, tile, tileset => tileset._updateCacheStats(tile));
  }
  _updateCacheStats(tile) {
    this.stats.get(TILES_LOADED).incrementCount();
    this.stats.get(TILES_IN_MEMORY).incrementCount();
    this.gpuMemoryUsageInBytes += tile.gpuMemoryUsageInBytes || 0;
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;
  }
  _unloadTile(tile) {
    this.gpuMemoryUsageInBytes -= tile.gpuMemoryUsageInBytes || 0;
    this.stats.get(TILES_IN_MEMORY).decrementCount();
    this.stats.get(TILES_UNLOADED).incrementCount();
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;
    this.options.onTileUnload(tile);
    tile.unloadContent();
  }
  _destroy() {
    const stack = [];
    if (this.root) {
      stack.push(this.root);
    }
    while (stack.length > 0) {
      const tile = stack.pop();
      for (const child of tile.children) {
        stack.push(child);
      }
      this._destroyTile(tile);
    }
    this.root = null;
  }
  _destroySubtree(tile) {
    const root = tile;
    const stack = [];
    stack.push(root);
    while (stack.length > 0) {
      tile = stack.pop();
      for (const child of tile.children) {
        stack.push(child);
      }
      if (tile !== root) {
        this._destroyTile(tile);
      }
    }
    root.children = [];
  }
  _destroyTile(tile) {
    this._cache.unloadTile(this, tile);
    this._unloadTile(tile);
    tile.destroy();
  }
  _initializeTiles3DTileset(tilesetJson) {
    if (tilesetJson.queryString) {
      const searchParams = new URLSearchParams(tilesetJson.queryString);
      const queryParams = Object.fromEntries(searchParams.entries());
      this._queryParams = {
        ...this._queryParams,
        ...queryParams
      };
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
  _initializeI3STileset() {
    if (this.loadOptions.i3s && 'token' in this.loadOptions.i3s) {
      this._queryParams.token = this.loadOptions.i3s.token;
    }
  }
}
//# sourceMappingURL=tileset-3d.js.map