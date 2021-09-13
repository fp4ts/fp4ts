import { Auto, Intro, Kind, Mix, URIS } from '../../core';
import { MonadError } from '../../cats';
import { Outcome } from './outcome';
import { Poll } from './poll';

export interface MonadCancel<F extends URIS, E, C = Auto>
  extends MonadError<F, E, C> {
  readonly uncancelable: <S, R, A>(
    body: (poll: Poll<F, C>) => Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, A>;

  readonly onCancel: <S2, R2>(
    fin: Kind<F, C, S2, R2, E, void>,
  ) => <S, R, A>(
    fa: Kind<F, C, Intro<C, 'S', S2, S>, Intro<C, 'R', R2, R>, E, A>,
  ) => Kind<F, C, Mix<C, 'S', [S2, S]>, Mix<C, 'R', [R2, R]>, E, A>;

  readonly finalize: <S2, R2, A>(
    finalizer: (oc: Outcome<F, E, A>) => Kind<F, C, S2, R2, E, void>,
  ) => <S, R>(
    fa: Kind<F, C, Intro<C, 'S', S2, S>, Intro<C, 'R', R2, R>, E, A>,
  ) => Kind<F, C, Mix<C, 'S', [S2, S]>, Mix<C, 'R', [R2, R]>, E, A>;

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
    release: (a: A, oc: Outcome<F, E, B>) => Kind<F, C, S, R, E, void>,
  ) => Kind<F, C, S, R, E, B>;

  readonly bracketFull: <S, R, A>(
    acquire: (poll: Poll<F, C>) => Kind<F, C, S, R, E, A>,
  ) => <B>(
    use: (a: A) => Kind<F, C, S, R, E, B>,
  ) => (
    release: (a: A, oc: Outcome<F, E, B>) => Kind<F, C, S, R, E, void>,
  ) => Kind<F, C, S, R, E, B>;
}
