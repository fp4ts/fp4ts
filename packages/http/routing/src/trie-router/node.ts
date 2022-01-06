// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Either,
  Left,
  List,
  None,
  Option,
  OrderedMap,
  Right,
  Some,
} from '@fp4ts/cats';
import { tupled } from '@fp4ts/core';
import { PathComponent } from '../path-component';

export class Node<A = never> {
  public constructor(
    private readonly constants: OrderedMap<string, Node<A>> = OrderedMap.empty,
    private readonly parameter: Option<[string, Node<A>]> = None,
    private readonly any: Option<Node<A>> = None,
    private readonly catchAll: Option<Node<A>> = None,
    private readonly output: Option<A> = None,
  ) {}

  public register<B>(
    this: Node<B>,
    components: List<PathComponent>,
    output: B,
  ): Either<Error, Node<B>> {
    return components.fold(
      () =>
        this.output.fold(
          () => Right(this.copy({ output: Some(output) })),
          () => Left(new Error('path already registered')),
        ),
      (hd, tl) => {
        switch (hd.tag) {
          case 'constant':
            return this.registerConstant(hd.value, tl, output);
          case 'parameter':
            return this.registerParameter(hd.name, tl, output);
          case 'any':
            return this.registerAny(tl, output);
          case 'catch-all':
            return this.registerCatchAll(tl, output);
        }
      },
    );
  }

  public route(path: List<string>): Option<[A, OrderedMap<string, string>]> {
    const loop = (
      cur: Node<A>,
      path: List<string>,
      parameters: OrderedMap<string, string>,
      catchAll: Option<Node<A>> = None,
    ): Option<[A, OrderedMap<string, string>]> =>
      path.fold(
        () =>
          cur.output
            .orElse(() => catchAll.flatMap(c => c.output))
            .map(o => [o, parameters]),
        (hd, tl) => {
          const nextCatchAll = cur.catchAll.orElse(() => catchAll);

          return cur.constants
            .lookup(hd)
            .flatMap(constant => loop(constant, tl, parameters, nextCatchAll))
            .orElse(() =>
              cur.parameter.flatMap(([name, next]) =>
                loop(next, tl, parameters.insert(name, hd), nextCatchAll),
              ),
            )
            .orElse(() =>
              cur.any.flatMap(next => loop(next, tl, parameters, nextCatchAll)),
            )
            .orElse(() =>
              nextCatchAll.flatMap(n => n.output).map(o => [o, parameters]),
            );
        },
      );

    return loop(this, path, OrderedMap.empty, None);
  }

  private registerConstant<B>(
    this: Node<B>,
    constant: string,
    rest: List<PathComponent>,
    output: B,
  ): Either<Error, Node<B>> {
    return this.constants['!?'](constant)
      .getOrElse(() => new Node())
      .register(rest, output)
      .map(next =>
        this.copy({ constants: this.constants.insert(constant, next) }),
      );
  }

  private registerParameter<B>(
    this: Node<B>,
    paramName: string,
    rest: List<PathComponent>,
    output: B,
  ): Either<Error, Node<B>> {
    return this.parameter
      .fold<Either<Error, Node<B>>>(
        () => Right(new Node<B>()),
        ([current, node]) =>
          current !== paramName ? Left(new Error('Collision')) : Right(node),
      )
      .flatMap(node => node.register(rest, output))
      .map(next => this.copy({ parameter: Some(tupled(paramName, next)) }));
  }

  private registerAny<B>(
    this: Node<B>,
    rest: List<PathComponent>,
    output: B,
  ): Either<Error, Node<B>> {
    return this.any
      .getOrElse(() => new Node<B>())
      .register(rest, output)
      .map(next => this.copy({ any: Some(next) }));
  }

  private registerCatchAll<B>(
    this: Node<B>,
    rest: List<PathComponent>,
    output: B,
  ): Either<Error, Node<B>> {
    return this.catchAll.fold(
      () =>
        new Node()
          .register(rest, output)
          .map(next => this.copy({ catchAll: Some(next) })),
      () => Left(new Error('Double catch-all')),
    );
  }

  private copy({
    constants = this.constants,
    parameter = this.parameter,
    any = this.any,
    catchAll = this.catchAll,
    output = this.output,
  }: Partial<Props<A>> = {}): Node<A> {
    return new Node(constants, parameter, any, catchAll, output);
  }
}
type Props<A> = {
  readonly constants: OrderedMap<string, Node<A>>;
  readonly parameter: Option<[string, Node<A>]>;
  readonly any: Option<Node<A>>;
  readonly catchAll: Option<Node<A>>;
  readonly output: Option<A>;
};
