"use strict";
// loaders.gl, MIT license
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tileset3D = void 0;
// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md
const core_1 = require("@math.gl/core");
const geospatial_1 = require("@math.gl/geospatial");
const stats_1 = require("@probe.gl/stats");
const loader_utils_1 = require("@loaders.gl/loader-utils");
const tileset_cache_1 = require("./tileset-cache");
const transform_utils_1 = require("./helpers/transform-utils");
const frame_state_1 = require("./helpers/frame-state");
const zoom_1 = require("./helpers/zoom");
const tile_3d_1 = require("./tile-3d");
const constants_1 = require("../constants");
const tileset_traverser_1 = require("./tileset-traverser");
// TODO - these should be moved into their respective modules
const tileset_3d_traverser_1 = require("./format-3d-tiles/tileset-3d-traverser");
const i3s_tileset_traverser_1 = require("./format-i3s/i3s-tileset-traverser");
const DEFAULT_PROPS = {
    description: '',
    ellipsoid: geospatial_1.Ellipsoid.WGS84,
    modelMatrix: new core_1.Matrix4(),
    throttleRequests: true,
    maxRequests: 64,
    maximumMemoryUsage: 32,
    maximumTilesSelected: 0,
    debounceTime: 0,
    onTileLoad: () => { },
    onTileUnload: () => { },
    onTileError: () => { },
    onTraversalComplete: (selectedTiles) => selectedTiles,
    contentLoader: undefined,
    viewDistanceScale: 1.0,
    maximumScreenSpaceError: 8,
    loadTiles: true,
    updateTransforms: true,
    viewportTraversersMap: null,
    loadOptions: { fetch: {} },
    attributions: [],
    basePath: '',
    i3s: {}
};
// Tracked Stats
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
/**
 * The Tileset loading and rendering flow is as below,
 * A rendered (i.e. deck.gl `Tile3DLayer`) triggers `tileset.update()` after a `tileset` is loaded
 * `tileset` starts traversing the tile tree and update `requestTiles` (tiles of which content need
 * to be fetched) and `selectedTiles` (tiles ready for rendering under the current viewport).
 * `Tile3DLayer` will update rendering based on `selectedTiles`.
 * `Tile3DLayer` also listens to `onTileLoad` callback and trigger another round of `update and then traversal`
 * when new tiles are loaded.

 * As I3S tileset have stored `tileHeader` file (metadata) and tile content files (geometry, texture, ...) separately.
 * During each traversal, it issues `tilHeader` requests if that `tileHeader` is not yet fetched,
 * after the tile header is fulfilled, it will resume the traversal starting from the tile just fetched (not root).

 * Tile3DLayer
 *      |
 *  await load(tileset)
 *      |
 *  tileset.update()
 *      |                async load tileHeader
 *  tileset.traverse() -------------------------- Queued
 *      |        resume traversal after fetched  |
 *      |----------------------------------------|
 *      |
 *      |                     async load tile content
 * tilset.requestedTiles  ----------------------------- RequestScheduler
 *                                                             |
 * tilset.selectedTiles (ready for rendering)                  |
 *      |         Listen to                                    |
 *   Tile3DLayer ----------- onTileLoad  ----------------------|
 *      |                         |   notify new tile is available
 *   updateLayers                 |
 *                       tileset.update // trigger another round of update
*/
class Tileset3D {
    /**
     * Create a new Tileset3D
     * @param json
     * @param props
     */
    // eslint-disable-next-line max-statements
    constructor(tileset, options) {
        this.root = null;
        this.roots = {};
        /** @todo any->unknown */
        this.asset = {};
        // Metadata for the entire tileset
        this.description = '';
        this.extras = null;
        this.attributions = {};
        this.credits = {};
        /** flags that contain information about data types in nested tiles */
        this.contentFormats = { draco: false, meshopt: false, dds: false, ktx2: false };
        // view props
        this.cartographicCenter = null;
        this.cartesianCenter = null;
        this.zoom = 1;
        this.boundingVolume = null;
        /** Updated based on the camera position and direction */
        this.dynamicScreenSpaceErrorComputedDensity = 0.0;
        // METRICS
        /**
         * The maximum amount of GPU memory (in MB) that may be used to cache tiles
         * Tiles not in view are unloaded to enforce private
         */
        this.maximumMemoryUsage = 32;
        /** The total amount of GPU memory in bytes used by the tileset. */
        this.gpuMemoryUsageInBytes = 0;
        /** Update tracker. increase in each update cycle. */
        this._frameNumber = 0;
        this._queryParams = {};
        this._extensionsUsed = [];
        this._tiles = {};
        /** counter for tracking tiles requests */
        this._pendingCount = 0;
        /** Hold traversal results */
        this.selectedTiles = [];
        // TRAVERSAL
        this.traverseCounter = 0;
        this.geometricError = 0;
        this.lastUpdatedVieports = null;
        this._requestedTiles = [];
        this._emptyTiles = [];
        this.frameStateData = {};
        this._cache = new tileset_cache_1.TilesetCache();
        // Promise tracking
        this.updatePromise = null;
        // PUBLIC MEMBERS
        this.options = { ...DEFAULT_PROPS, ...options };
        // raw data
        this.tileset = tileset;
        this.loader = tileset.loader;
        // could be  3d tiles, i3s
        this.type = tileset.type;
        // The url to a tileset JSON file.
        this.url = tileset.url;
        this.basePath = tileset.basePath || loader_utils_1.path.dirname(this.url);
        this.modelMatrix = this.options.modelMatrix;
        this.ellipsoid = this.options.ellipsoid;
        // Geometric error when the tree is not rendered at all
        this.lodMetricType = tileset.lodMetricType;
        this.lodMetricValue = tileset.lodMetricValue;
        this.refine = tileset.root.refine;
        this.loadOptions = this.options.loadOptions || {};
        // TRAVERSAL
        this._traverser = this._initializeTraverser();
        this._requestScheduler = new loader_utils_1.RequestScheduler({
            throttleRequests: this.options.throttleRequests,
            maxRequests: this.options.maxRequests
        });
        // METRICS
        // The total amount of GPU memory in bytes used by the tileset.
        this.stats = new stats_1.Stats({ id: this.url });
        this._initializeStats();
        this.tilesetInitializationPromise = this._initializeTileSet(tileset);
    }
    /** Release resources */
    destroy() {
        this._destroy();
    }
    /** Is the tileset loaded (update needs to have been called at least once) */
    isLoaded() {
        // Check that `_frameNumber !== 0` which means that update was called at least once
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
        this.options = { ...this.options, ...props };
    }
    /** @deprecated */
    setOptions(options) {
        this.options = { ...this.options, ...options };
    }
    /**
     * Return a loadable tile url for a specific tile subpath
     * @param tilePath a tile subpath
     */
    getTileUrl(tilePath) {
        const isDataUrl = tilePath.startsWith('data:');
        if (isDataUrl) {
            return tilePath;
        }
        return `${tilePath}${tilePath.includes('?') ? '&' : '?'}${this.queryParams}`;
    }
    // TODO CESIUM specific
    hasExtension(extensionName) {
        return Boolean(this._extensionsUsed.indexOf(extensionName) > -1);
    }
    /**
     * Update visible tiles relying on a list of viewports
     * @param viewports - list of viewports
     * @deprecated
     */
    update(viewports = null) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.tilesetInitializationPromise.then(() => {
            if (!viewports && this.lastUpdatedVieports) {
                viewports = this.lastUpdatedVieports;
            }
            else {
                this.lastUpdatedVieports = viewports;
            }
            if (viewports) {
                this.doUpdate(viewports);
            }
        });
    }
    /**
     * Update visible tiles relying on a list of viewports.
     * Do it with debounce delay to prevent update spam
     * @param viewports viewports
     * @returns Promise of new frameNumber
     */
    async selectTiles(viewports = null, _getFrameState = null) {
        await this.tilesetInitializationPromise;
        if (viewports) {
            this.lastUpdatedVieports = viewports;
        }
        if (!this.updatePromise) {
            this.updatePromise = new Promise((resolve) => {
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
    /**
     * Update visible tiles relying on a list of viewports
     * @param viewports viewports
     */
    // eslint-disable-next-line max-statements, complexity
    doUpdate(viewports, _getFrameState = null) {
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
        // First loop to decrement traverseCounter
        for (const viewport of preparedViewports) {
            const id = viewport.id;
            if (this._needTraverse(id)) {
                viewportsToTraverse.push(id);
            }
            else {
                this.traverseCounter--;
            }
        }
        // Second loop to traverse
        for (const viewport of preparedViewports) {
            const id = viewport.id;
            if (!this.roots[id]) {
                this.roots[id] = this._initializeTileHeaders(this.tileset, null);
            }
            if (!viewportsToTraverse.includes(id)) {
                continue; // eslint-disable-line no-continue
            }
            const frameState = _getFrameState ? _getFrameState(viewport, this._frameNumber) : (0, frame_state_1.getFrameState)(viewport, this._frameNumber);
            this._traverser.traverse(this.roots[id], frameState, this.options);
        }
    }
    /**
     * Check if traversal is needed for particular viewport
     * @param {string} viewportId - id of a viewport
     * @return {boolean}
     */
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
    /**
     * The callback to post-process tiles after traversal procedure
     * @param frameState - frame state for tile culling
     */
    _onTraversalEnd(frameState) {
        const id = frameState.viewport.id;
        if (!this.frameStateData[id]) {
            this.frameStateData[id] = { selectedTiles: [], _requestedTiles: [], _emptyTiles: [] };
        }
        const currentFrameStateData = this.frameStateData[id];
        const selectedTiles = Object.values(this._traverser.selectedTiles);
        const [filteredSelectedTiles, unselectedTiles] = (0, frame_state_1.limitSelectedTiles)(selectedTiles, frameState, this.options.maximumTilesSelected);
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
    /**
     * Update tiles relying on data from all traversers
     */
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
        const set1 = new Set(oldSelectedTiles.map((t) => t.id));
        const set2 = new Set(selectedTiles.map((t) => t.id));
        let changed = oldSelectedTiles.filter((x) => !set2.has(x.id)).length > 0;
        changed = changed || selectedTiles.filter((x) => !set1.has(x.id)).length > 0;
        return changed;
    }
    _loadTiles() {
        // Sort requests by priority before making any requests.
        // This makes it less likely this requests will be cancelled after being issued.
        // requestedTiles.sort((a, b) => a._priority - b._priority);
        for (const tile of this._requestedTiles) {
            if (tile.contentUnloaded) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this._loadTile(tile);
            }
        }
    }
    _unloadTiles() {
        // unload tiles from cache when hit maximumMemoryUsage
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
                }
                else {
                    // Calculate vertices for non point cloud tiles.
                    pointsRenderable += tile.content.vertexCount;
                }
            }
        }
        this.stats.get(TILES_IN_VIEW).count = this.selectedTiles.length;
        this.stats.get(TILES_RENDERABLE).count = tilesRenderable;
        this.stats.get(POINTS_COUNT).count = pointsRenderable;
    }
    async _initializeTileSet(tilesetJson) {
        if (this.type === constants_1.TILESET_TYPE.I3S) {
            this.calculateViewPropsI3S();
            tilesetJson.root = await tilesetJson.root;
        }
        this.root = this._initializeTileHeaders(tilesetJson, null);
        if (this.type === constants_1.TILESET_TYPE.TILES3D) {
            this._initializeTiles3DTileset(tilesetJson);
            this.calculateViewPropsTiles3D();
        }
        if (this.type === constants_1.TILESET_TYPE.I3S) {
            this._initializeI3STileset();
        }
    }
    /**
     * Called during initialize Tileset to initialize the tileset's cartographic center (longitude, latitude) and zoom.
     * These metrics help apps center view on tileset
     * For I3S there is extent (<1.8 version) or fullExtent (>=1.8 version) to calculate view props
     * @returns
     */
    calculateViewPropsI3S() {
        // for I3S 1.8 try to calculate with fullExtent
        const fullExtent = this.tileset.fullExtent;
        if (fullExtent) {
            const { xmin, xmax, ymin, ymax, zmin, zmax } = fullExtent;
            this.cartographicCenter = new core_1.Vector3(xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2, zmin + (zmax - zmin) / 2);
            this.cartesianCenter = geospatial_1.Ellipsoid.WGS84.cartographicToCartesian(this.cartographicCenter, new core_1.Vector3());
            this.zoom = (0, zoom_1.getZoomFromFullExtent)(fullExtent, this.cartographicCenter, this.cartesianCenter);
            return;
        }
        // for I3S 1.6-1.7 try to calculate with extent
        const extent = this.tileset.store?.extent;
        if (extent) {
            const [xmin, ymin, xmax, ymax] = extent;
            this.cartographicCenter = new core_1.Vector3(xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2, 0);
            this.cartesianCenter = geospatial_1.Ellipsoid.WGS84.cartographicToCartesian(this.cartographicCenter, new core_1.Vector3());
            this.zoom = (0, zoom_1.getZoomFromExtent)(extent, this.cartographicCenter, this.cartesianCenter);
            return;
        }
        // eslint-disable-next-line no-console
        console.warn('Extent is not defined in the tileset header');
        this.cartographicCenter = new core_1.Vector3();
        this.zoom = 1;
        return;
    }
    /**
     * Called during initialize Tileset to initialize the tileset's cartographic center (longitude, latitude) and zoom.
     * These metrics help apps center view on tileset.
     * For 3DTiles the root tile data is used to calculate view props.
     * @returns
     */
    calculateViewPropsTiles3D() {
        const root = this.root;
        const { center } = root.boundingVolume;
        // TODO - handle all cases
        if (!center) {
            // eslint-disable-next-line no-console
            console.warn('center was not pre-calculated for the root tile');
            this.cartographicCenter = new core_1.Vector3();
            this.zoom = 1;
            return;
        }
        // cartographic coordinates are undefined at the center of the ellipsoid
        if (center[0] !== 0 || center[1] !== 0 || center[2] !== 0) {
            this.cartographicCenter = geospatial_1.Ellipsoid.WGS84.cartesianToCartographic(center, new core_1.Vector3());
        }
        else {
            this.cartographicCenter = new core_1.Vector3(0, 0, -geospatial_1.Ellipsoid.WGS84.radii[0]);
        }
        this.cartesianCenter = center;
        this.zoom = (0, zoom_1.getZoomFromBoundingVolume)(root.boundingVolume, this.cartographicCenter);
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
    // Installs the main tileset JSON file or a tileset JSON file referenced from a tile.
    // eslint-disable-next-line max-statements
    _initializeTileHeaders(tilesetJson, parentTileHeader) {
        // A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
        // Get the basePath relative to the external tileset.
        const rootTile = new tile_3d_1.Tile3D(this, tilesetJson.root, parentTileHeader); // resource
        // If there is a parentTileHeader, add the root of the currently loading tileset
        // to parentTileHeader's children, and update its depth.
        if (parentTileHeader) {
            parentTileHeader.children.push(rootTile);
            rootTile.depth = parentTileHeader.depth + 1;
        }
        // 3DTiles knows the hierarchy beforehand
        if (this.type === constants_1.TILESET_TYPE.TILES3D) {
            const stack = [];
            stack.push(rootTile);
            while (stack.length > 0) {
                const tile = stack.pop();
                this.stats.get(TILES_TOTAL).incrementCount();
                const children = tile.header.children || [];
                for (const childHeader of children) {
                    const childTile = new tile_3d_1.Tile3D(this, childHeader, tile);
                    // Special handling for Google
                    // A session key must be used for all tile requests
                    if (childTile.contentUrl?.includes('?session=')) {
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
            case constants_1.TILESET_TYPE.TILES3D:
                TraverserClass = tileset_3d_traverser_1.Tileset3DTraverser;
                break;
            case constants_1.TILESET_TYPE.I3S:
                TraverserClass = i3s_tileset_traverser_1.I3STilesetTraverser;
                break;
            default:
                TraverserClass = tileset_traverser_1.TilesetTraverser;
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
        }
        catch (error) {
            this._onTileLoadError(tile, error instanceof Error ? error : new Error('load failed'));
        }
        finally {
            this._onEndTileLoading();
            this._onTileLoad(tile, loaded);
        }
    }
    _onTileLoadError(tile, error) {
        this.stats.get(TILES_LOAD_FAILED).incrementCount();
        const message = error.message || error.toString();
        const url = tile.url;
        // TODO - Allow for probe log to be injected instead of console?
        console.error(`A 3D tile failed to load: ${tile.url} ${message}`); // eslint-disable-line
        this.options.onTileError(tile, message, url);
    }
    _onTileLoad(tile, loaded) {
        if (!loaded) {
            return;
        }
        if (this.type === constants_1.TILESET_TYPE.I3S) {
            // We can't calculate tiles total in I3S in advance so we calculate it dynamically.
            const nodesInNodePages = this.tileset?.nodePagesTile?.nodesInNodePages || 0;
            this.stats.get(TILES_TOTAL).reset();
            this.stats.get(TILES_TOTAL).addCount(nodesInNodePages);
        }
        // add coordinateOrigin and modelMatrix to tile
        if (tile && tile.content) {
            (0, transform_utils_1.calculateTransformProps)(tile, tile.content);
        }
        this.updateContentTypes(tile);
        this._addTileToCache(tile);
        this.options.onTileLoad(tile);
    }
    /**
     * Update information about data types in nested tiles
     * @param tile instance of a nested Tile3D
     */
    updateContentTypes(tile) {
        if (this.type === constants_1.TILESET_TYPE.I3S) {
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
        }
        else if (this.type === constants_1.TILESET_TYPE.TILES3D) {
            const { extensionsRemoved = [] } = tile.content?.gltf || {};
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
        this._cache.add(this, tile, (tileset) => tileset._updateCacheStats(tile));
    }
    _updateCacheStats(tile) {
        this.stats.get(TILES_LOADED).incrementCount();
        this.stats.get(TILES_IN_MEMORY).incrementCount();
        // Good enough? Just use the raw binary ArrayBuffer's byte length.
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
    // Traverse the tree and destroy all tiles
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
    // Traverse the tree and destroy all sub tiles
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
            this._queryParams = { ...this._queryParams, ...queryParams };
        }
        this.asset = tilesetJson.asset;
        if (!this.asset) {
            throw new Error('Tileset must have an asset property.');
        }
        if (this.asset.version !== '0.0' &&
            this.asset.version !== '1.0' &&
            this.asset.version !== '1.1') {
            throw new Error('The tileset must be 3D Tiles version 0.0 or 1.0.');
        }
        // Note: `asset.tilesetVersion` is version of the tileset itself (not the version of the 3D TILES standard)
        // We add this version as a `v=1.0` query param to fetch the right version and not get an older cached version
        if ('tilesetVersion' in this.asset) {
            this._queryParams.v = this.asset.tilesetVersion;
        }
        // TODO - ion resources have a credits property we can use for additional attribution.
        this.credits = {
            attributions: this.options.attributions || []
        };
        this.description = this.options.description || '';
        // Gets the tileset's properties dictionary object, which contains metadata about per-feature properties.
        this.properties = tilesetJson.properties;
        this.geometricError = tilesetJson.geometricError;
        this._extensionsUsed = tilesetJson.extensionsUsed || [];
        // Returns the extras property at the top of the tileset JSON (application specific metadata).
        this.extras = tilesetJson.extras;
    }
    _initializeI3STileset() {
        // @ts-expect-error
        if (this.loadOptions.i3s && 'token' in this.loadOptions.i3s) {
            this._queryParams.token = this.loadOptions.i3s.token;
        }
    }
}
exports.Tileset3D = Tileset3D;
