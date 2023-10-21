export const TILE_CONTENT_STATE = {
  UNLOADED: 0,
  LOADING: 1,
  PROCESSING: 2,
  READY: 3,
  EXPIRED: 4,
  FAILED: 5
};
export let TILE_REFINEMENT = function (TILE_REFINEMENT) {
  TILE_REFINEMENT[TILE_REFINEMENT["ADD"] = 1] = "ADD";
  TILE_REFINEMENT[TILE_REFINEMENT["REPLACE"] = 2] = "REPLACE";
  return TILE_REFINEMENT;
}({});
export let TILE_TYPE = function (TILE_TYPE) {
  TILE_TYPE["EMPTY"] = "empty";
  TILE_TYPE["SCENEGRAPH"] = "scenegraph";
  TILE_TYPE["POINTCLOUD"] = "pointcloud";
  TILE_TYPE["MESH"] = "mesh";
  return TILE_TYPE;
}({});
export let TILESET_TYPE = function (TILESET_TYPE) {
  TILESET_TYPE["I3S"] = "I3S";
  TILESET_TYPE["TILES3D"] = "TILES3D";
  return TILESET_TYPE;
}({});
export let LOD_METRIC_TYPE = function (LOD_METRIC_TYPE) {
  LOD_METRIC_TYPE["GEOMETRIC_ERROR"] = "geometricError";
  LOD_METRIC_TYPE["MAX_SCREEN_THRESHOLD"] = "maxScreenThreshold";
  return LOD_METRIC_TYPE;
}({});
export const TILE3D_OPTIMIZATION_HINT = {
  NOT_COMPUTED: -1,
  USE_OPTIMIZATION: 1,
  SKIP_OPTIMIZATION: 0
};
//# sourceMappingURL=constants.js.map