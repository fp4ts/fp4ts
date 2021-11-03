import { Applicative } from '@fp4ts/cats';
import { Outcome } from '../outcome';

export abstract class ExitCase {
  readonly __void!: void;

  public abstract fold<B1, B2 = B1, B3 = B2>(
    onCanceled: () => B1,
    onErrored: (e: Error) => B2,
    onSucceeded: () => B3,
  ): B1 | B2 | B3;

  public abstract toOutcome<F>(F: Applicative<F>): Outcome<F, Error, void>;

  public static fromOutcome<F, A>(oc: Outcome<F, Error, A>): ExitCase {
    return oc.fold(
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
  private readonly tag = 'succeeded';

  public fold<B1, B2 = B1, B3 = B2>(
    onCanceled: () => B1,
    onErrored: (e: Error) => B2,
    onSucceeded: () => B3,
  ): B1 | B2 | B3 {
    return onSucceeded();
  }

  public toOutcome<F>(F: Applicative<F>): Outcome<F, Error, void> {
    return Outcome.success(F.unit);
  }
})();
type Succeeded = typeof Succeeded;

class Errored extends ExitCase {
  private readonly tag = 'errored';

  public constructor(public readonly error: Error) {
    super();
  }

  public fold<B1, B2 = B1, B3 = B2>(
    onCanceled: () => B1,
    onErrored: (e: Error) => B2,
    onSucceeded: () => B3,
  ): B1 | B2 | B3 {
    return onErrored(this.error);
  }

  public toOutcome<F>(F: Applicative<F>): Outcome<F, Error, void> {
    return Outcome.failure(this.error);
  }
}

const Canceled = new (class Canceled extends ExitCase {
  private readonly tag = 'canceled';
  public fold<B1, B2 = B1, B3 = B2>(
    onCanceled: () => B1,
    onErrored: (e: Error) => B2,
    onSucceeded: () => B3,
  ): B1 | B2 | B3 {
    return onCanceled();
  }

  public toOutcome<F>(F: Applicative<F>): Outcome<F, Error, void> {
    return Outcome.canceled();
  }
})();
type Canceled = typeof Canceled;
