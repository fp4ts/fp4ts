import * as E from '../fp/either';

export class CancellationError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Outcome<A> {
  // @ts-ignore
  private readonly __void: void;
}

class Success<A> extends Outcome<A> {
  public readonly tag = 'success';
  public constructor(public readonly result: A) {
    super();
  }
}

class Failure extends Outcome<never> {
  public readonly tag = 'failure';
  public constructor(public readonly error: Error) {
    super();
  }
}

const Canceled = new (class Canceled extends Outcome<never> {
  readonly tag = 'canceled';
})();
type Canceled = typeof Canceled;

type OutcomeView<A> = Success<A> | Failure | Canceled;

const view = <A>(oc: Outcome<A>): OutcomeView<A> => oc as any;

// -- Constructors

export const success: <A>(result: A) => Outcome<A> = r => new Success(r);
export const successUnit: Outcome<void> = success(undefined);

export const failure: (error: Error) => Outcome<never> = e => new Failure(e);

export const canceled: Outcome<never> = Canceled;

export const fromEither = <A>(ea: E.Either<Error, A>): Outcome<A> =>
  E.fold_(ea, failure, success);

// -- Point-free operators

export const toEither = <A>(oc: Outcome<A>): E.Either<Error, A> =>
  fold_<A, E.Either<Error, A>>(
    oc,
    () => E.left(new CancellationError()),
    E.left,
    E.right,
  );

export const fold: <A, B>(
  onCanceled: () => B,
  onFailure: (e: Error) => B,
  onSuccess: (a: A) => B,
) => (oc: Outcome<A>) => B = (onCanceled, onFailure, onSuccess) => oc =>
  fold_(oc, onCanceled, onFailure, onSuccess);

// -- Point-ful operators

export const fold_ = <A, B>(
  _oc: Outcome<A>,
  onCanceled: () => B,
  onFailure: (e: Error) => B,
  onSuccess: (a: A) => B,
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
