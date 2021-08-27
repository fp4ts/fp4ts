import { MonadError } from '../../cats';
import { Kind } from '../../fp/hkt';
import { Outcome } from './outcome';
import { Poll } from './poll';

export interface MonadCancel<F, E> extends MonadError<F, E> {
  readonly uncancelable: <A>(body: (poll: Poll<F>) => Kind<F, A>) => Kind<F, A>;

  readonly onCancel: <A>(fa: Kind<F, A>, fin: Kind<F, void>) => Kind<F, A>;

  readonly finalize: <A>(
    fa: Kind<F, A>,
    finalizer: (oc: Outcome<F, E, A>) => Kind<F, void>,
  ) => Kind<F, A>;

  readonly bracket: <A>(
    fa: Kind<F, A>,
  ) => <B>(
    use: (a: A) => Kind<F, B>,
  ) => (release: (a: A) => Kind<F, void>) => Kind<F, B>;

  readonly bracketOutcome: <A>(
    fa: Kind<F, A>,
  ) => <B>(
    use: (a: A) => Kind<F, B>,
  ) => (release: (a: A, oc: Outcome<F, E, B>) => Kind<F, void>) => Kind<F, B>;

  readonly bracketFull: <A>(
    acquire: (poll: Poll<F>) => Kind<F, A>,
  ) => <B>(
    use: (a: A) => Kind<F, B>,
  ) => (release: (a: A, oc: Outcome<F, E, B>) => Kind<F, void>) => Kind<F, B>;
}
