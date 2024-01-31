"use strict";
// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBatchedModel3DTile = void 0;
const math_1 = require("@loaders.gl/math"); // math.gl/geometry;
const tile_3d_feature_table_1 = __importDefault(require("../classes/tile-3d-feature-table"));
// import Tile3DBatchTable from '../classes/tile-3d-batch-table.js';
const parse_3d_tile_header_1 = require("./helpers/parse-3d-tile-header");
const parse_3d_tile_tables_1 = require("./helpers/parse-3d-tile-tables");
const parse_3d_tile_gltf_view_1 = require("./helpers/parse-3d-tile-gltf-view");
async function parseBatchedModel3DTile(tile, arrayBuffer, byteOffset, options, context) {
    byteOffset = parseBatchedModel(tile, arrayBuffer, byteOffset, options, context);
    await (0, parse_3d_tile_gltf_view_1.extractGLTF)(tile, parse_3d_tile_gltf_view_1.GLTF_FORMAT.EMBEDDED, options, context);
    const extensions = tile?.gltf?.extensions;
    if (extensions && extensions.CESIUM_RTC) {
        tile.rtcCenter = extensions.CESIUM_RTC.center;
    }
    return byteOffset;
}
exports.parseBatchedModel3DTile = parseBatchedModel3DTile;
function parseBatchedModel(tile, arrayBuffer, byteOffset, options, context) {
    byteOffset = (0, parse_3d_tile_header_1.parse3DTileHeaderSync)(tile, arrayBuffer, byteOffset);
    byteOffset = (0, parse_3d_tile_tables_1.parse3DTileTablesHeaderSync)(tile, arrayBuffer, byteOffset);
    byteOffset = (0, parse_3d_tile_tables_1.parse3DTileTablesSync)(tile, arrayBuffer, byteOffset, options);
    byteOffset = (0, parse_3d_tile_gltf_view_1.parse3DTileGLTFViewSync)(tile, arrayBuffer, byteOffset, options);
    const featureTable = new tile_3d_feature_table_1.default(tile.featureTableJson, tile.featureTableBinary);
    tile.rtcCenter = featureTable.getGlobalProperty('RTC_CENTER', math_1.GL.FLOAT, 3);
    return byteOffset;
}