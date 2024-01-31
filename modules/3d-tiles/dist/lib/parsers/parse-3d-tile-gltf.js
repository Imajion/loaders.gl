"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGltf3DTile = void 0;
const gltf_1 = require("@loaders.gl/gltf");
async function parseGltf3DTile(tile, arrayBuffer, options, context) {
    // Set flags
    // glTF models need to be rotated from Y to Z up
    // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
    tile.rotateYtoZ = true;
    // Save gltf up axis
    tile.gltfUpAxis =
        options['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis
            ? options['3d-tiles'].assetGltfUpAxis
            : 'Y';
    const { parse } = context;
    const gltfWithBuffers = await parse(arrayBuffer, gltf_1.GLTFLoader, options, context);
    tile.gltf = (0, gltf_1.postProcessGLTF)(gltfWithBuffers);
    tile.gpuMemoryUsageInBytes = (0, gltf_1._getMemoryUsageGLTF)(tile.gltf);
}
exports.parseGltf3DTile = parseGltf3DTile;