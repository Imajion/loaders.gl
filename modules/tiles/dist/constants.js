"use strict";
// loaders.gl, MIT license
Object.defineProperty(exports, "__esModule", { value: true });
exports.TILE3D_OPTIMIZATION_HINT = exports.LOD_METRIC_TYPE = exports.TILESET_TYPE = exports.TILE_TYPE = exports.TILE_REFINEMENT = exports.TILE_CONTENT_STATE = void 0;
exports.TILE_CONTENT_STATE = {
    UNLOADED: 0,
    LOADING: 1,
    PROCESSING: 2,
    READY: 3,
    EXPIRED: 4,
    FAILED: 5 // Request failed.
};
var TILE_REFINEMENT;
(function (TILE_REFINEMENT) {
    TILE_REFINEMENT[TILE_REFINEMENT["ADD"] = 1] = "ADD";
    TILE_REFINEMENT[TILE_REFINEMENT["REPLACE"] = 2] = "REPLACE"; // Render tile or, if screen space error exceeded, refine to its descendants instead.
})(TILE_REFINEMENT = exports.TILE_REFINEMENT || (exports.TILE_REFINEMENT = {}));
var TILE_TYPE;
(function (TILE_TYPE) {
    TILE_TYPE["EMPTY"] = "empty";
    TILE_TYPE["SCENEGRAPH"] = "scenegraph";
    TILE_TYPE["POINTCLOUD"] = "pointcloud";
    TILE_TYPE["MESH"] = "mesh";
})(TILE_TYPE = exports.TILE_TYPE || (exports.TILE_TYPE = {}));
var TILESET_TYPE;
(function (TILESET_TYPE) {
    TILESET_TYPE["I3S"] = "I3S";
    TILESET_TYPE["TILES3D"] = "TILES3D";
})(TILESET_TYPE = exports.TILESET_TYPE || (exports.TILESET_TYPE = {}));
var LOD_METRIC_TYPE;
(function (LOD_METRIC_TYPE) {
    LOD_METRIC_TYPE["GEOMETRIC_ERROR"] = "geometricError";
    LOD_METRIC_TYPE["MAX_SCREEN_THRESHOLD"] = "maxScreenThreshold";
})(LOD_METRIC_TYPE = exports.LOD_METRIC_TYPE || (exports.LOD_METRIC_TYPE = {}));
exports.TILE3D_OPTIMIZATION_HINT = {
    NOT_COMPUTED: -1,
    USE_OPTIMIZATION: 1,
    SKIP_OPTIMIZATION: 0
};
