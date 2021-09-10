import { Auto, Kind } from '../../core';
import { MonadError } from '../../cats';
import { Outcome } from './outcome';
import { Poll } from './poll';

export interface MonadCancel<F, E, C = Auto> extends MonadError<F, E, C> {
  readonly uncancelable: <S, R, A>(
    body: (poll: Poll<F, C>) => Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, A>;

  readonly onCancel: <S, R>(
    fin: Kind<F, C, S, R, E, void>,
  ) => <A>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, A>;

  readonly finalize: <S, R, A>(
    finalizer: (oc: Outcome<F, E, A, C>) => Kind<F, C, S, R, E, void>,
  ) => (fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, A>;

  readonly bracket: <S, R, A>(
    fa: Kind<F, C, S, R, E, A>,
  ) => <B>(
    use: (a: A) => Kind<F, C, S, R, E, B>,
  ) => (release: (a: A) => Kind<F, C, S, R, E, void>) => Kind<F, C, S, R, E, B>;

  readonly bracketOutcome: <S, R, A>(
    fa: Kind<F, C, S, R, E, A>,
  ) => <B>(
    use: (a: A) => Kind<F, C, S, R, E, B>,
  ) => (
    release: (a: A, oc: Outcome<F, E, B, C>) => Kind<F, C, S, R, E, void>,
  ) => Kind<F, C, S, R, E, B>;

  readonly bracketFull: <S, R, A>(
    acquire: (poll: Poll<F, C>) => Kind<F, C, S, R, E, A>,
  ) => <B>(
    use: (a: A) => Kind<F, C, S, R, E, B>,
  ) => (
    release: (a: A, oc: Outcome<F, E, B, C>) => Kind<F, C, S, R, E, void>,
  ) => Kind<F, C, S, R, E, B>;
}
