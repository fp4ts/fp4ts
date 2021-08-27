import { Applicative } from '../../cats';
import * as E from '../../fp/either';
import { Kind } from '../../fp/hkt';

export class CancellationError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Outcome<F, E, A> {
  // @ts-ignore
  private readonly __void: void;
}

class Success<F, A> extends Outcome<F, never, A> {
  public readonly tag = 'success';
  public constructor(public readonly result: Kind<F, A>) {
    super();
  }
  public toString(): string {
    return `[Success: ${this.result}]`;
  }
}

class Failure<E> extends Outcome<unknown, E, never> {
  public readonly tag = 'failure';
  public constructor(public readonly error: E) {
    super();
  }
  public toString(): string {
    return `[Failure: ${this.error}]`;
  }
}

const Canceled = new (class Canceled extends Outcome<unknown, never, never> {
  readonly tag = 'canceled';
  public toString(): string {
    return '[Canceled]';
  }
})();
type Canceled = typeof Canceled;

type OutcomeView<F, E, A> = Success<F, A> | Failure<E> | Canceled;

const view = <F, E, A>(oc: Outcome<F, E, A>): OutcomeView<F, E, A> => oc as any;

// -- Constructors

export const success: <F, A>(fa: Kind<F, A>) => Outcome<F, never, A> = fa =>
  new Success(fa);

export const failure: <E>(error: E) => Outcome<unknown, E, never> = e =>
  new Failure(e);

export const canceled: Outcome<unknown, never, never> = Canceled;

export const fromEither =
  <F>(F: Applicative<F>) =>
  <E, A>(ea: E.Either<E, A>): Outcome<F, E, A> =>
    E.fold_(ea, failure, a => success(F.pure(a)));

// -- Point-free operators

export const fold: <F, E, A, B>(
  onCanceled: () => B,
  onFailure: (e: E) => B,
  onSuccess: (a: Kind<F, A>) => B,
) => (oc: Outcome<F, E, A>) => B = (onCanceled, onFailure, onSuccess) => oc =>
  fold_(oc, onCanceled, onFailure, onSuccess);

// -- Point-ful operators

export const fold_ = <F, E, A, B>(
  _oc: Outcome<F, E, A>,
  onCanceled: () => B,
  onFailure: (e: E) => B,
  onSuccess: (a: Kind<F, A>) => B,
): B => {
  const oc = view(_oc);
  switch (oc.tag) {
    case 'success':
      return onSuccess(oc.result);
    case 'failure':
      return onFailure(oc.error);
    case 'canceled':
      return onCanceled();
  }
};
