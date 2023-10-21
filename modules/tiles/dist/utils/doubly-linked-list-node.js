"use strict";
// loaders.gl, MIT license
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoublyLinkedListNode = void 0;
// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md
/**
 * Doubly linked list node
 * @private
 */
class DoublyLinkedListNode {
    constructor(item, previous, next) {
        this.item = item;
        this.previous = previous;
        this.next = next;
    }
}
exports.DoublyLinkedListNode = DoublyLinkedListNode;
