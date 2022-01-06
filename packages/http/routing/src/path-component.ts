// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List } from '@fp4ts/cats';
import { Path, Uri } from '@fp4ts/http-core';

export type PathComponent =
  | ConstantPathComponent
  | ParameterPathComponent
  | Any
  | CatchAll;
export const PathComponent = Object.freeze({
  from(...xs: string[]): List<PathComponent> {
    return PathComponent.fromArray(xs);
  },
  fromUri(uri: Uri): List<PathComponent> {
    return PathComponent.fromPath(uri.path);
  },
  fromPath(path: Path): List<PathComponent> {
    return PathComponent.fromArray(path.components);
  },
  fromArray(xs: string[]): List<PathComponent> {
    return List.fromArray(xs.map(PathComponent.fromString));
  },
  fromUriString(s: string): List<PathComponent> {
    if (s === '/') return List.empty;
    else return PathComponent.fromArray(s.split('/'));
  },
  fromString(s: string): PathComponent {
    if (s.startsWith(':')) return new ParameterPathComponent(s.slice(1));
    if (s === '*') return Any;
    if (s === '**') return CatchAll;
    return new ConstantPathComponent(s);
  },
});

export class ConstantPathComponent {
  public readonly tag = 'constant';
  public constructor(public readonly value: string) {}

  public toString(): string {
    return this.value;
  }
}

export class ParameterPathComponent {
  public readonly tag = 'parameter';
  public constructor(public readonly name: string) {}

  public toString(): string {
    return `:${this.name}`;
  }
}

export const Any = Object.freeze({
  tag: 'any' as const,
  toString() {
    return '*';
  },
});
export type Any = typeof Any;

const CatchAll = Object.freeze({
  tag: 'catch-all' as const,
  toString() {
    return '**';
  },
});
export type CatchAll = typeof CatchAll;
