import { TilesetTraverser } from '../tileset-traverser';
import { FrameState } from '../helpers/frame-state';
export declare class I3STilesetTraverser extends TilesetTraverser {
    private _tileManager;
    constructor(options: any);
    /**
     * Check if there are no penging tile header requests,
     * that means the traversal is finished and we can call
     * following-up callbacks.
     */
    traversalFinished(frameState: FrameState): boolean;
    shouldRefine(tile: any, frameState: FrameState): boolean;
    updateChildTiles(tile: any, frameState: FrameState): boolean;
    _loadTile(nodeId: any, tileset: any): Promise<unknown>;
    /**
     * The callback to init Tile3D instance after loading the tile JSON
     * @param {Object} header - the tile JSON from a dataset
     * @param {Tile3D} tile - the parent Tile3D instance
     * @param {string} extendedId - optional ID to separate copies of a tile for different viewports.
     *                              const extendedId = `${tile.id}-${frameState.viewport.id}`;
     * @return {void}
     */
    _onTileLoad(header: any, tile: any, extendedId: any): void;
}
//# sourceMappingURL=i3s-tileset-traverser.d.ts.map