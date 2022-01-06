// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fst } from '@fp4ts/core';
import { Either, List, Option, OrderedMap } from '@fp4ts/cats';
import { PathComponent } from '../path-component';
import { Node } from './node';

export class TrieRouter<A> {
  public static empty: TrieRouter<never> = new TrieRouter();

  private constructor(private readonly root: Node<A> = new Node()) {}

  public register<B>(
    this: TrieRouter<B>,
    components: List<PathComponent>,
    output: B,
  ): Either<Error, TrieRouter<B>> {
    return this.root
      .register(components, output)
      .map(root => new TrieRouter(root));
  }

  public route(path: List<string>): Option<[A, OrderedMap<string, string>]>;
  public route(...path: string[]): Option<[A, OrderedMap<string, string>]>;
  public route(...xs: any[]): any {
    return xs[0] === undefined || typeof xs[0] === 'string'
      ? this.root.route(List.fromArray(xs))
      : this.root.route(xs[0]);
  }

  public route_(path: List<string>): Option<A>;
  public route_(...path: string[]): Option<A>;
  public route_(...xs: any[]): any {
    return this.route(...xs).map(fst);
  }
}
