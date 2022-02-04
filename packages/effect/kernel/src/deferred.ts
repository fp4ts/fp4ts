// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, flow, id, pipe } from '@fp4ts/core';
import { FunctionK, None, Option, Right, Some } from '@fp4ts/cats';

import { Ref } from './ref';
import { Async } from './async';

export abstract class Deferred<F, A>
  implements DeferredSource<F, A>, DeferredSink<F, A>
{
  private readonly __void!: void;

  public abstract get(): Kind<F, [A]>;

  public abstract tryGet(): Kind<F, [Option<A>]>;

  public abstract complete(result: A): Kind<F, [void]>;

  public mapK<G>(nt: FunctionK<F, G>): Deferred<G, A> {
    return new TransformerDeferred(nt, this);
  }

  public static of =
    <F>(F: Async<F>) =>
    <A>(a?: A): Kind<F, [Deferred<F, A>]> => {
      const state: State<A> = a ? new SetState(a) : new UnsetState([]);
      return pipe(
        Ref.of(F)(state),
        F.map(state => new AsyncDeferred<F, A>(F, state)),
      );
    };
}

interface DeferredSource<F, A> {
  get(): Kind<F, [A]>;
}

interface DeferredSink<F, A> {
  complete(result: A): Kind<F, [void]>;
}

type ResumeReader<A> = (a: A) => void;

class State<A> {
  public readonly view: StateView<A> = this as any;

  public readonly fold = <B>(
    onSet: (ss: SetState<A>) => B,
    onUnset: (us: UnsetState<A>) => B,
  ) => {
    const view = this.view;
    switch (view.tag) {
      case 'set':
        return onSet(view);
      case 'unset':
        return onUnset(view);
    }
  };
}

const foldState: <A, B>(
  onSet: (ss: SetState<A>) => B,
  onUnset: (us: UnsetState<A>) => B,
) => (s: State<A>) => B = (onSet, onUnset) => s => s.fold(onSet, onUnset);

class UnsetState<A> extends State<A> {
  public readonly tag = 'unset';
  public constructor(public readonly readers: ResumeReader<A>[]) {
    super();
  }
}
class SetState<A> extends State<A> {
  public readonly tag = 'set';
  public constructor(public readonly value: A) {
    super();
  }
}

type StateView<A> = UnsetState<A> | SetState<A>;

class AsyncDeferred<F, A> extends Deferred<F, A> {
  public constructor(
    private readonly F: Async<F>,
    private readonly state: Ref<F, State<A>>,
  ) {
    super();
  }

  public override get(): Kind<F, [A]> {
    return this.F.defer(() =>
      pipe(
        this.state.get(),
        this.F.flatMap(
          foldState(
            ({ value }) => this.F.pure(value),
            () =>
              this.F.async(resume =>
                this.F.defer(() => this.addReader(flow(Right, resume))),
              ),
          ),
        ),
      ),
    );
  }

  private deleteReader(reader: ResumeReader<A>): Kind<F, [void]> {
    return this.F.defer(() =>
      this.state.update(
        foldState<A, State<A>>(
          id,
          ({ readers }) => new UnsetState(readers.filter(r => r !== reader)),
        ),
      ),
    );
  }

  private addReader(
    reader: ResumeReader<A>,
  ): Kind<F, [Option<Kind<F, [void]>>]> {
    return this.F.defer(() =>
      this.state.modify(
        foldState<A, [State<A>, Option<Kind<F, [void]>>]>(
          ({ value }) => {
            reader(value);
            return [new SetState(value), None];
          },
          ({ readers }) => {
            const newState = new UnsetState([...readers, reader]);
            return [newState, Some(this.deleteReader(reader))];
          },
        ),
      ),
    );
  }

  public override tryGet(): Kind<F, [Option<A>]> {
    return pipe(
      this.state.get(),
      this.F.flatMap(
        foldState(
          ({ value }) => this.F.pure(Some(value)),
          () => this.F.pure(None),
        ),
      ),
    );
  }

  public override complete(result: A): Kind<F, [void]> {
    const notifyReaders = (readers: ResumeReader<A>[]): Kind<F, [void]> =>
      this.F.defer(() =>
        pipe(
          readers.map(f => this.F.delay(() => f(result))),
          rds => rds.reduce(this.F.productR_, this.F.unit),
        ),
      );

    return this.F.defer(() =>
      pipe(
        this.state.modify(
          foldState(
            s => [s, this.F.unit],
            ({ readers }) => [new SetState(result), notifyReaders(readers)],
          ),
        ),
        this.F.flatten,
      ),
    );
  }
}

class TransformerDeferred<G, F, A> extends Deferred<G, A> {
  public constructor(
    private readonly nt: FunctionK<F, G>,
    private readonly underlying: Deferred<F, A>,
  ) {
    super();
  }

  public override get(): Kind<G, [A]> {
    return this.nt(this.underlying.get());
  }

  public override tryGet(): Kind<G, [Option<A>]> {
    return this.nt(this.underlying.tryGet());
  }

  public override complete(result: A): Kind<G, [void]> {
    return this.nt(this.underlying.complete(result));
  }
}
