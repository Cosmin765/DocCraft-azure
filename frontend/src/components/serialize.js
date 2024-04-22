'use strict';
import _extends from 'react';

Object.defineProperty(exports, '__esModule', { value: true });
var slate = require('slate');
var immutable = require('immutable');


export function deserialize(string) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$defaultBlock = options.defaultBlock,
        defaultBlock = _options$defaultBlock === undefined ? 'line' : _options$defaultBlock,
        _options$defaultMarks = options.defaultMarks,
        defaultMarks = _options$defaultMarks === undefined ? [] : _options$defaultMarks,
        _options$delimiter = options.delimiter,
        delimiter = _options$delimiter === undefined ? '\n' : _options$delimiter,
        _options$toJSON = options.toJSON,
        toJSON = _options$toJSON === undefined ? false : _options$toJSON;
  
  
    if (immutable.Set.isSet(defaultMarks)) {
      defaultMarks = defaultMarks.toArray();
    }
  
    defaultBlock = slate.Node.createProperties(defaultBlock);
    defaultMarks = defaultMarks.map(slate.Mark.createProperties);
  
    var json = {
      object: 'value',
      document: {
        object: 'document',
        data: {},
        nodes: string.split(delimiter).map(function (line) {
          return _extends({}, defaultBlock, {
            object: 'block',
            data: {},
            nodes: [{
              object: 'text',
              text: line,
              marks: defaultMarks
            }]
          });
        })
      }
    };
  
    var ret = toJSON ? json : slate.Value.fromJSON(json);
    return ret;
  }