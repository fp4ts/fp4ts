import { Kind, flow, id, pipe, Auto, URIS } from '../../core';
import { None, Option, Right, Some } from '../../cats/data';

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

export class Deferred<F extends URIS, A, C = Auto> {
  // @ts-ignore
  private readonly __void: void;

  private constructor(
    private readonly F: Async<F, C>,
    private readonly state: Ref<F, State<A>, C>,
  ) {}

  public readonly get = <S, R, E>(): Kind<F, C, S, R, Error, A> => {
    const deleteReader = (
      reader: ResumeReader<A>,
    ): Kind<F, C, S, R, Error, void> =>
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
    ): Kind<F, C, S, R, Error, Option<Kind<F, C, S, R, Error, void>>> =>
      this.F.defer(() =>
        this.state.modify(
          foldState<A, [State<A>, Option<Kind<F, C, S, R, Error, void>>]>(
            ({ value }) => {
              reader(value);
              return [new SetState(value), None];
            },
            ({ readers }) => {
              const newState = new UnsetState([...readers, reader]);
              return [newState, Some(deleteReader(reader))];
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
                this.F.defer(() => addReader(flow(Right, resume))),
              ),
          ),
        ),
      ),
    );
  };

  public readonly complete = <S, R>(
    result: A,
  ): Kind<F, C, S, R, Error, void> => {
    const notifyReaders = (
      readers: ResumeReader<A>[],
    ): Kind<F, C, S, R, Error, void> =>
      this.F.defer(() =>
        pipe(
          readers.map(f => this.F.delay(() => f(result))),
          rds => rds.reduce(this.F.productR_, this.F.unit()),
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
    <F extends URIS, C = Auto>(F: Async<F, C>) =>
    <A, S = unknown, R = unknown>(
      a?: A,
    ): Kind<F, C, S, R, Error, Deferred<F, A, C>> => {
      const state: State<A> = a ? new SetState(a) : new UnsetState([]);
      return pipe(
        Ref.of(F)(state),
        F.map(state => new Deferred<F, A>(F, state)),
      );
    };
}

export const of: <F extends URIS, C = Auto>(
  F: Async<F, C>,
) => <S, R, A = unknown>(a?: A) => Kind<F, C, S, R, Error, Deferred<F, A, C>> =
  F => x =>
    Deferred.of(F)(x);

export const get: <F extends URIS, C, S, R, A>(
  dfa: Deferred<F, A, C>,
) => Kind<F, C, S, R, Error, A> = dfa => dfa.get();

export const complete: <A>(
  a: A,
) => <F extends URIS, C, S, R>(
  dfa: Deferred<F, A, C>,
) => Kind<F, C, S, R, Error, void> = a => dfa => complete_(dfa, a);

export const complete_ = <F extends URIS, C, S, R, A>(
  dfa: Deferred<F, A, C>,
  a: A,
): Kind<F, C, S, R, Error, void> => dfa.complete(a);
