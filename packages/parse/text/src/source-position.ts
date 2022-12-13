// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import { SourcePosition } from '@fp4ts/parse-core';

const lineTerminatorRegex = /^\r\n$|^[\n\r]$/;
export function getPosition(source: string, cursor: number): SourcePosition {
  let line = 1;
  let column = 1;
  for (let i = 0; i < cursor; i++) {
    const c = source.charAt(i);
    if (lineTerminatorRegex.test(c)) {
      line++;
      column = 1;
    } else if (c === '\t') {
      column = column + 8 - ((column - 1) % 8);
    } else {
      column++;
    }
  }
  return new SourcePosition(line, column);
}

export function updatePositionByChar(
  startPos: SourcePosition,
  char: Char,
): SourcePosition {
  return updatePositionByString(startPos, char);
}

export function updatePositionByString(
  startPos: SourcePosition,
  string: string,
): SourcePosition {
  if (string === '') return startPos;

  let line = startPos.line;
  let column = startPos.column;
  for (let i = 0, len = string.length; i < len; i++) {
    const c = string.charAt(i);
    if (lineTerminatorRegex.test(c)) {
      line++;
      column = 1;
    } else if (c === '\t') {
      column = column + 8 - ((column - 1) % 8);
    } else {
      column++;
    }
  }
  return new SourcePosition(line, column);
}
