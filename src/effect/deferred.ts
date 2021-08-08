import { Ref } from './ref';
import * as IO from './io';
import * as E from '../fp/either';
import { flow, id, pipe } from '../fp/core';

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

export class Deferred<A> {
  // @ts-ignore
  private readonly __void: void;

  private constructor(private readonly state: Ref<State<A>>) {}

  public readonly get = (): IO.IO<A> => {
    const deleteReader = (reader: ResumeReader<A>): IO.IO<void> =>
      IO.defer(() =>
        this.state.update(
          foldState<A, State<A>>(
            id,
            ({ readers }) => new UnsetState(readers.filter(r => r !== reader)),
          ),
        ),
      );

    const addReader = (
      reader: ResumeReader<A>,
    ): IO.IO<IO.IO<void> | undefined> =>
      IO.defer(() =>
        pipe(
          this.state.modify(
            foldState<A, [State<A>, IO.IO<void> | undefined]>(
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
        ),
      );

    return IO.defer(() =>
      pipe(
        this.state.get(),
        IO.flatMap(
          foldState(
            ({ value }) => IO.pure(value),
            () =>
              IO.async(resume =>
                IO.defer(() => addReader(flow(E.right, resume))),
              ),
          ),
        ),
      ),
    );
  };

  public readonly complete = (result: A): IO.IO<void> => {
    const notifyReaders = (readers: ResumeReader<A>[]): IO.IO<void> => {
      return pipe(
        readers.map(f => IO.delay(() => f(result))),
        IO.sequence,
        IO.flatMap(() => IO.unit),
      );
    };

    return IO.defer(() =>
      pipe(
        this.state.get(),
        IO.flatMap(
          foldState(
            () => IO.unit,
            ({ readers }) => notifyReaders(readers),
          ),
        ),
        IO.flatMap(() => this.state.set(new SetState(result))),
      ),
    );
  };

  public static of = <A>(a?: A): IO.IO<Deferred<A>> => {
    const state: State<A> = a ? new SetState(a) : new UnsetState([]);
    return pipe(
      Ref.of(state),
      IO.map(state => new Deferred<A>(state)),
    );
  };
}

export const of: <A = unknown>(a?: A) => IO.IO<Deferred<A>> = x =>
  Deferred.of(x);

export const get: <A>(dfa: Deferred<A>) => IO.IO<A> = dfa => dfa.get();

export const complete: <A>(a: A) => (dfa: Deferred<A>) => IO.IO<void> =
  a => dfa =>
    complete_(dfa, a);

export const complete_ = <A>(dfa: Deferred<A>, a: A): IO.IO<void> =>
  dfa.complete(a);
