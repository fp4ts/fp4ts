import * as E from '../../fp/either';
import { flow, id, pipe } from '../../fp/core';
import { Kind } from '../../fp/hkt';

import { Ref } from './ref';
import { Async } from './async';

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

export class Deferred<F, A> {
  // @ts-ignore
  private readonly __void: void;

  private constructor(
    private readonly F: Async<F>,
    private readonly state: Ref<F, State<A>>,
  ) {}

  public readonly get = (): Kind<F, A> => {
    const deleteReader = (reader: ResumeReader<A>): Kind<F, void> =>
      this.F.defer(() =>
        this.state.update(
          foldState<A, State<A>>(
            id,
            ({ readers }) => new UnsetState(readers.filter(r => r !== reader)),
          ),
        ),
      );

    const addReader = (
      reader: ResumeReader<A>,
    ): Kind<F, Kind<F, void> | undefined> =>
      this.F.defer(() =>
        this.state.modify(
          foldState<A, [State<A>, Kind<F, void> | undefined]>(
            ({ value }) => {
              reader(value);
              return [new SetState(value), undefined];
            },
            ({ readers }) => {
              const newState = new UnsetState([...readers, reader]);
              return [newState, deleteReader(reader)];
            },
          ),
        ),
      );

    return this.F.defer(() =>
      pipe(
        this.state.get(),
        this.F.flatMap(
          foldState(
            ({ value }) => this.F.pure(value),
            () =>
              this.F.async(resume =>
                this.F.defer(() => addReader(flow(E.right, resume))),
              ),
          ),
        ),
      ),
    );
  };

  public readonly complete = (result: A): Kind<F, void> => {
    const notifyReaders = (readers: ResumeReader<A>[]): Kind<F, void> =>
      this.F.defer(() =>
        pipe(
          readers.map(f => this.F.delay(() => f(result))),
          rds => rds.reduce(this.F.productR, this.F.unit),
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
  };

  public static of =
    <F>(F: Async<F>) =>
    <A>(a?: A): Kind<F, Deferred<F, A>> => {
      const state: State<A> = a ? new SetState(a) : new UnsetState([]);
      return pipe(
        Ref.of(F)(state),
        F.map(state => new Deferred<F, A>(F, state)),
      );
    };
}

export const of: <F>(
  F: Async<F>,
) => <A = unknown>(a?: A) => Kind<F, Deferred<F, A>> = F => x =>
  Deferred.of(F)(x);

export const get: <F, A>(dfa: Deferred<F, A>) => Kind<F, A> = dfa => dfa.get();

export const complete: <A>(a: A) => <F>(dfa: Deferred<F, A>) => Kind<F, void> =
  a => dfa =>
    complete_(dfa, a);

export const complete_ = <F, A>(dfa: Deferred<F, A>, a: A): Kind<F, void> =>
  dfa.complete(a);
