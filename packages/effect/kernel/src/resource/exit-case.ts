import { Applicative } from '@fp4ts/cats';
import { Outcome } from '../outcome';

export abstract class ExitCase {
  readonly __void!: void;

  public abstract fold<B>(
    onCanceled: () => B,
    onErrored: (e: Error) => B,
    onSucceeded: () => B,
  ): B;

  public abstract toOutcome<F>(F: Applicative<F>): Outcome<F, Error, void>;

  public static fromOutcome<F, A>(oc: Outcome<F, Error, A>): ExitCase {
    return oc.fold<ExitCase>(
      () => Canceled,
      e => new Errored(e),
      () => Succeeded,
    );
  }

  public static get Succeeded(): ExitCase {
    return Succeeded;
  }

  public static Errored(e: Error): ExitCase {
    return new Errored(e);
  }

  public static get Canceled(): ExitCase {
    return Canceled;
  }
}

const Succeeded = new (class Succeeded extends ExitCase {
  public fold<B>(
    onCanceled: () => B,
    onErrored: (e: Error) => B,
    onSucceeded: () => B,
  ): B {
    return onSucceeded();
  }

  public toOutcome<F>(F: Applicative<F>): Outcome<F, Error, void> {
    return Outcome.success(F.unit);
  }
})();
type Succeeded = typeof Succeeded;

class Errored extends ExitCase {
  public constructor(public readonly error: Error) {
    super();
  }

  public fold<B>(
    onCanceled: () => B,
    onErrored: (e: Error) => B,
    onSucceeded: () => B,
  ): B {
    return onErrored(this.error);
  }

  public toOutcome<F>(F: Applicative<F>): Outcome<F, Error, void> {
    return Outcome.failure(this.error);
  }
}

const Canceled = new (class Canceled extends ExitCase {
  public fold<B>(
    onCanceled: () => B,
    onErrored: (e: Error) => B,
    onSucceeded: () => B,
  ): B {
    return onCanceled();
  }

  public toOutcome<F>(F: Applicative<F>): Outcome<F, Error, void> {
    return Outcome.canceled();
  }
})();
type Canceled = typeof Canceled;
