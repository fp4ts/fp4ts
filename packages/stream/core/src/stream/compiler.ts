import { MonadError } from '@cats4ts/cats-core';
import { List, Vector } from '@cats4ts/cats-core/lib/data';
import { AnyK, Kind, pipe } from '@cats4ts/core';
import { SyncIO, SyncIoK } from '@cats4ts/effect-core';
import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Collector } from './collectors';

export class Compiler<F extends AnyK, A> {
  private readonly __void!: void;
  public constructor(
    private readonly F: MonadError<F, Error>,
    private readonly stream: Pull<F, A, void>,
  ) {}

  public foldChunks<B>(init: B, f: (b: B, chunk: Chunk<A>) => B): Kind<F, [B]> {
    return this.stream.compile(this.F)(init, f);
  }

  public fold<B>(init: B, f: (b: B, a: A) => B): Kind<F, [B]> {
    return this.foldChunks(init, (b, chunk) => chunk.foldLeft(b, f));
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

  public constructor(private readonly stream: Pull<SyncIoK, A, void>) {
    this.underlying = new Compiler(SyncIO.MonadError, stream);
  }

  public foldChunks<B>(init: B, f: (b: B, chunk: Chunk<A>) => B): B {
    return this.underlying.foldChunks(init, f).unsafeRunSync();
  }

  public fold<B>(init: B, f: (b: B, a: A) => B): B {
    return this.underlying.fold(init, f).unsafeRunSync();
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
