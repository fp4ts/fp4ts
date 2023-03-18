// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind, pipe, throwError } from '@fp4ts/core';
import { Option, None, MonadError, Some } from '@fp4ts/cats';
import { List, Vector } from '@fp4ts/collections';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Collector } from './collectors';
import { Compiler } from '../compiler';

export class CompileOps<F, G, A> {
  public constructor(
    private pull: Pull<F, A, void>,
    private readonly compiler: Compiler<F, G>,
  ) {}

  public get count(): Kind<G, [number]> {
    return this.foldChunks(0, (acc, chunk) => acc + chunk.size);
  }

  public get drain(): Kind<G, [void]> {
    return this.foldChunks(undefined, () => {});
  }

  public get head(): Kind<G, [A]> {
    return pipe(
      this.headOption,
      this.compiler.target.map(headOpt =>
        headOpt.fold(() => throwError(new Error('Empty.head')), id),
      ),
    );
  }

  public get headOption(): Kind<G, [Option<A>]> {
    return this.foldChunks(None as Option<A>, (prev, next) =>
      prev['<|>'](next.headOption),
    );
  }

  public get last(): Kind<G, [A]> {
    return pipe(
      this.lastOption,
      this.compiler.target.map(lastOpt =>
        lastOpt.fold(() => throwError(new Error('Empty.last')), id),
      ),
    );
  }

  public get lastOption(): Kind<G, [Option<A>]> {
    return this.foldChunks(None as Option<A>, (prev, next) =>
      next.lastOption['<|>'](prev),
    );
  }

  public lastOrError(G: MonadError<G, Error>): Kind<G, [Option<A>]> {
    return G.flatMap_(this.lastOption, lastOp =>
      lastOp.fold(
        () => G.throwError(new Error('No such element')),
        x => G.pure(Some(x)),
      ),
    );
  }

  public get string(): A extends string ? Kind<G, [string]> : never {
    return this.to(Collector.string() as any) as any;
  }

  get toArray(): Kind<G, [Array<A>]> {
    return this.to(Collector.array());
  }
  get toList(): Kind<G, [List<A>]> {
    return this.to(Collector.list());
  }
  get toVector(): Kind<G, [Vector<A>]> {
    return this.to(Collector.vector());
  }
  to<A2, O>(this: CompileOps<F, G, A2>, col: Collector<A2, O>): Kind<G, [O]> {
    return pipe(
      this.compiler.target.unit,
      this.compiler.target.flatMap(() =>
        this.foldChunks(col.newBuilder(), (acc, chunk) => acc.append(chunk)),
      ),
      this.compiler.target.map(b => b.result),
    );
  }

  fold<B>(init: B, f: (b: B, a: A) => B): Kind<G, [B]> {
    return this.foldChunks(init, (b, chunk) => chunk.foldLeft(b, f));
  }
  foldChunks<B>(init: B, f: (b: B, chunk: Chunk<A>) => B): Kind<G, [B]> {
    return this.compiler.compile(this.pull, init)(f);
  }
}
