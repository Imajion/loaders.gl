// loaders.gl, MIT license

import {DataType} from '../../common-types';

export function getTypeFromTypedArray(arrayBufferView: ArrayBufferView): DataType {
  switch (arrayBufferView.constructor) {
    case Int8Array:
      return 'int8';
    case Int16Array:
      return 'int16';
    case Int32Array:
      return 'int32';
    case Uint8Array:
      return 'uint8';
    case Uint8ClampedArray:
      return 'uint8';
    case Uint16Array:
      return 'uint16';
    case Uint32Array:
      return 'uint32';
    case Float32Array:
      return 'float32';
    case Float64Array:
      return 'float64';
    default:
      throw new Error('DataView is not a valid column type');
  }

  // if (typeof BigInt64Array !== 'undefined') {
  //   TYPED_ARRAY_TO_TYPE.BigInt64Array = new Int64();
  //   TYPED_ARRAY_TO_TYPE.BigUint64Array = new Uint64();
  // }
}

export function getTypeFromValue(value: unknown): DataType {
  if (value instanceof Date) {
    return 'date-millisecond';
  }
  if (value instanceof Number) {
    return 'float64';
  }
  if (typeof value === 'string') {
    return 'utf8';
  }
  return 'null';
}

/*
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function deduceSchema(rows) {
  const row = rows[0];

  const schema = {};
  let i = 0;
  for (const columnName in row) {
    const value = row[columnName];
    switch (typeof value) {
      case 'number':
      case 'boolean':
        // TODO - booleans could be handled differently...
        schema[columnName] = {name: String(columnName), index: i, type: Float32Array};
        break;

      case 'object':
        schema[columnName] = {name: String(columnName), index: i, type: Array};
        break;

      case 'string':
      default:
        schema[columnName] = {name: String(columnName), index: i, type: Array};
      // We currently only handle numeric rows
      // TODO we could offer a function to map strings to numbers?
    }
    i++;
  }
  return schema;
}
*/
