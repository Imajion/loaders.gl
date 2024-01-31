import { GLTFLoader, postProcessGLTF, _getMemoryUsageGLTF } from '@loaders.gl/gltf';
import { sliceArrayBuffer } from '@loaders.gl/loader-utils';
export const GLTF_FORMAT = {
  URI: 0,
  EMBEDDED: 1
};
export function parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset, options) {
  tile.rotateYtoZ = true;
  const gltfByteLength = tile.byteOffset + tile.byteLength - byteOffset;
  if (gltfByteLength === 0) {
    throw new Error('glTF byte length must be greater than 0.');
  }
  tile.gltfUpAxis = options['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis ? options['3d-tiles'].assetGltfUpAxis : 'Y';
  tile.gltfArrayBuffer = sliceArrayBuffer(arrayBuffer, byteOffset, gltfByteLength);
  tile.gltfByteOffset = 0;
  tile.gltfByteLength = gltfByteLength;
  if (byteOffset % 4 === 0) {} else {
    console.warn("".concat(tile.type, ": embedded glb is not aligned to a 4-byte boundary."));
  }
  return tile.byteOffset + tile.byteLength;
}
export async function extractGLTF(tile, gltfFormat, options, context) {
  const tile3DOptions = options['3d-tiles'] || {};
  extractGLTFBufferOrURL(tile, gltfFormat, options);
  if (tile3DOptions.loadGLTF) {
    const {
      parse,
      fetch
    } = context;
    if (tile.gltfUrl) {
      tile.gltfArrayBuffer = await fetch(tile.gltfUrl, options);
      tile.gltfByteOffset = 0;
    }
    if (tile.gltfArrayBuffer) {
      const gltfWithBuffers = await parse(tile.gltfArrayBuffer, GLTFLoader, options, context);
      tile.gltf = postProcessGLTF(gltfWithBuffers);
      tile.gpuMemoryUsageInBytes = _getMemoryUsageGLTF(tile.gltf);
      delete tile.gltfArrayBuffer;
      delete tile.gltfByteOffset;
      delete tile.gltfByteLength;
    }
  }
}
function extractGLTFBufferOrURL(tile, gltfFormat, options) {
  switch (gltfFormat) {
    case GLTF_FORMAT.URI:
      const gltfUrlBytes = new Uint8Array(tile.gltfArrayBuffer, tile.gltfByteOffset);
      const textDecoder = new TextDecoder();
      const gltfUrl = textDecoder.decode(gltfUrlBytes);
      tile.gltfUrl = gltfUrl.replace(/[\s\0]+$/, '');
      delete tile.gltfArrayBuffer;
      delete tile.gltfByteOffset;
      delete tile.gltfByteLength;
      break;
    case GLTF_FORMAT.EMBEDDED:
      break;
    default:
      throw new Error('b3dm: Illegal glTF format field');
  }
}
//# sourceMappingURL=parse-3d-tile-gltf-view.js.map