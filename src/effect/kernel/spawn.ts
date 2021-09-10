import { Kind, Auto, Kind1, URIS } from '../../core';
import { Applicative } from '../../cats';
import { Either } from '../../cats/data';
import { Fiber } from './fiber';
import { MonadCancel } from './monad-cancel';
import { Outcome } from './outcome';

export interface Spawn<F extends URIS, E, C = Auto>
  extends MonadCancel<F, E, C> {
  readonly applicative: Applicative<F, C>;

  readonly fork: <S, R, A>(
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, Fiber<F, E, A, C>>;
  readonly never: Kind1<F, C, never>;
  readonly suspend: Kind1<F, C, void>;

  readonly racePair: <S, R, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<
    F,
    C,
    S,
    R,
    E,
    Either<
      [Outcome<F, E, A, C>, Fiber<F, E, B>],
      [Fiber<F, E, A>, Outcome<F, E, B, C>]
    >
  >;

  readonly race: <S, R, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, Either<A, B>>;

  readonly raceOutcome: <S, R, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, Either<Outcome<F, E, A, C>, Outcome<F, E, B, C>>>;

  readonly both: <S, R, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, [A, B]>;

  readonly bothOutcome: <S, R, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, [Outcome<F, E, A, C>, Outcome<F, E, B, C>]>;
}
