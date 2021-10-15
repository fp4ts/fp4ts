import { Kind, pipe } from '@cats4ts/core';
import { MonadError, List, None, Option, Vector } from '@cats4ts/cats';
import { SyncIO, SyncIoK } from '@cats4ts/effect';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Stream } from './algebra';
import { Collector } from './collectors';

export class Compiler<F, A> {
  private readonly __void!: void;
  public constructor(
    private readonly F: MonadError<F, Error>,
    private readonly stream: Pull<F, A, void>,
  ) {}

  public get count(): Kind<F, [number]> {
    return this.foldChunks(0, (acc, chunk) => acc + chunk.size);
  }

  public get drain(): Kind<F, [void]> {
    return this.foldChunks(undefined, () => {});
  }

  public foldChunks<B>(init: B, f: (b: B, chunk: Chunk<A>) => B): Kind<F, [B]> {
    return this.stream.compile(this.F)(init, f);
  }

  public fold<B>(init: B, f: (b: B, a: A) => B): Kind<F, [B]> {
    return this.foldChunks(init, (b, chunk) => chunk.foldLeft(b, f));
  }

  public get last(): Kind<F, [A]> {
    return this.F.flatMap_(this.lastOption, opt =>
      opt.fold(
        () => this.F.throwError(new Error('EmptyStream.last')),
        x => this.F.pure(x),
      ),
    );
  }

  public get lastOption(): Kind<F, [Option<A>]> {
    return this.foldChunks(None as Option<A>, (prev, next) =>
      prev.orElse(() => next.lastOption),
    );
  }

  public get string(): A extends string ? Kind<F, [string]> : never {
    const result: Kind<F, [string]> = new Stream(this.stream as any)
      .compileF(this.F)
      .to(Collector.string());

    return result as any;
  }

  public to<A2, O>(this: Compiler<F, A2>, col: Collector<A2, O>): Kind<F, [O]> {
    return pipe(
      // Suspend creation of the mutable builder
      this.F.unit,
      this.F.flatMap(() =>
        this.foldChunks(col.newBuilder(), (acc, chunk) => acc.append(chunk)),
      ),
      this.F.map(b => b.result),
    );
  }

  public get toArray(): Kind<F, [A[]]> {
    return this.to(Collector.array());
  }

  public get toList(): Kind<F, [List<A>]> {
    return this.to(Collector.list());
  }

  public get toVector(): Kind<F, [Vector<A>]> {
    return this.to(Collector.vector());
  }
}

export class PureCompiler<A> {
  private readonly __void!: void;
  private readonly underlying: Compiler<SyncIoK, A>;

  public constructor(stream: Pull<SyncIoK, A, void>) {
    this.underlying = new Compiler(SyncIO.MonadError, stream);
  }

  public foldChunks<B>(init: B, f: (b: B, chunk: Chunk<A>) => B): B {
    return this.underlying.foldChunks(init, f).unsafeRunSync();
  }

  public fold<B>(init: B, f: (b: B, a: A) => B): B {
    return this.underlying.fold(init, f).unsafeRunSync();
  }

  public get drain(): void {
    return this.underlying.drain.unsafeRunSync();
  }

  public get last(): A {
    return this.underlying.last.unsafeRunSync();
  }

  public get lastOption(): Option<A> {
    return this.underlying.lastOption.unsafeRunSync();
  }

  public get string(): A extends string ? string : never {
    return this.underlying.string.unsafeRunSync() as any;
  }

  public to<A2, O>(this: PureCompiler<A2>, col: Collector<A2, O>): O {
    return this.underlying.to(col).unsafeRunSync();
  }

  public get toArray(): A[] {
    return this.underlying.toArray.unsafeRunSync();
  }

  public get toList(): List<A> {
    return this.underlying.toList.unsafeRunSync();
  }

  public get toVector(): Vector<A> {
    return this.underlying.toVector.unsafeRunSync();
  }
}
