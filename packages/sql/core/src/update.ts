// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Foldable, Option } from '@fp4ts/cats';
import { Chunk, Stream } from '@fp4ts/stream';
import { DefaultChunkSize } from './consts';
import {
  ConnectionIO,
  ConnectionIOF,
  Fragment,
  PreparedStatement,
  StreamedResultSet,
} from './free';
import { Read } from './read';
import { Write } from './write';

export class Update<in A> {
  public constructor(
    private readonly W: Write<A>,
    private readonly fragment: Fragment,
  ) {}

  public toUpdate0(a: A): Update0 {
    return {
      run: () => this.run(a),
      updateReturning: R => this.updateReturning(R)(a),
      updateReturningWithChunkSize: R => chunkSize =>
        this.updateReturningWithChunkSize(R)(a, chunkSize),
    };
  }

  public run(a: A): ConnectionIO<number> {
    return this.prepareStatement(ps =>
      ps
        .set(this.W)(a)
        .flatMap(ps => ps.query())
        .flatMap(rs => rs.getRowCount()),
    );
  }

  public updateMany<F>(
    F: Foldable<F>,
  ): (fa: Kind<F, [A]>) => ConnectionIO<number> {
    return fa =>
      this.prepareStatement(ps =>
        F.foldLeft_(fa, ConnectionIO.pure(0), (fi, a) =>
          ps
            .set(this.W)(a)
            .flatMap(ps => ps.query())
            .flatMap(rs => rs.getRowCount())
            .map2(fi)((a, b) => a + b),
        ),
      );
  }

  public updateReturning<R>(
    R: Read<R> = Read.id(),
  ): (a: A) => Stream<ConnectionIOF, R> {
    return a => this.updateReturningWithChunkSize(R)(a, DefaultChunkSize);
  }

  public updateManyReturning<F, R>(
    F: Foldable<F>,
    R: Read<R> = Read.id(),
  ): (fa: Kind<F, [A]>) => Stream<ConnectionIOF, R> {
    return fa =>
      this.updateManyReturningWithChunkSize(F, R)(fa, DefaultChunkSize);
  }

  public updateReturningWithChunkSize<R>(
    R: Read<R> = Read.id(),
  ): (a: A, chunkSize: number) => Stream<ConnectionIOF, R> {
    return (a, chunkSize) =>
      this.updateManyReturningWithChunkSize(Foldable.Array, R)([a], chunkSize);
  }

  public updateManyReturningWithChunkSize<F, R>(
    F: Foldable<F>,
    R: Read<R> = Read.id(),
  ): (fa: Kind<F, [A]>, chunkSize: number) => Stream<ConnectionIOF, R> {
    const acquireStream = (ps: PreparedStatement) =>
      Stream.bracket<ConnectionIOF, StreamedResultSet>(ps.queryStream(), rs =>
        rs.close(),
      );

    const pullStream = (chunkSize: number) => (rs: StreamedResultSet) =>
      Stream.repeatEval<ConnectionIOF, Option<Chunk<unknown>>>(
        rs.getNextChunk(chunkSize).map(c => Option(c).filter(() => c.nonEmpty)),
      ).unNoneTerminate().unchunks;

    return (fa, chunkSize) =>
      Stream.bracket<ConnectionIOF, PreparedStatement>(
        ConnectionIO.prepareStatement(this.fragment),
        ps => ps.close(),
      )
        .flatMap(ps =>
          Stream.fromArray<ConnectionIOF, A>(F.toArray(fa)).evalMap(
            ps.set(this.W),
          ),
        )
        .flatMap(acquireStream)
        .flatMap(pullStream(chunkSize))
        .map(R.fromRow);
  }

  public contramap<A0>(f: (a0: A0) => A): Update<A0> {
    return new Update(this.W.contramap(f), this.fragment);
  }

  private prepareStatement<R>(
    f: (ps: PreparedStatement) => ConnectionIO<R>,
  ): ConnectionIO<R> {
    return ConnectionIO.prepareStatement(this.fragment).bracket(
      ps => f(ps),
      ps => ps.close(),
    );
  }
}

export function Update0(fragment: Fragment): Update0 {
  return new Update(Write.unit, fragment).toUpdate0();
}
export interface Update0 {
  run(): ConnectionIO<number>;

  updateReturning<R>(R?: Read<R>): Stream<ConnectionIOF, R>;

  updateReturningWithChunkSize<R>(
    R?: Read<R>,
  ): (chunkSize: number) => Stream<ConnectionIOF, R>;
}
