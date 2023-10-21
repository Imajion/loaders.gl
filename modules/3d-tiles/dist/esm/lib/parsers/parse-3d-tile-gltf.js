import { _getMemoryUsageGLTF, GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf';
export async function parseGltf3DTile(tile, arrayBuffer, options, context) {
  tile.rotateYtoZ = true;
  tile.gltfUpAxis = options['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis ? options['3d-tiles'].assetGltfUpAxis : 'Y';
  const {
    parse
  } = context;
  const gltfWithBuffers = await parse(arrayBuffer, GLTFLoader, options, context);
  tile.gltf = postProcessGLTF(gltfWithBuffers);
  tile.gpuMemoryUsageInBytes = _getMemoryUsageGLTF(tile.gltf);
}
//# sourceMappingURL=parse-3d-tile-gltf.js.map