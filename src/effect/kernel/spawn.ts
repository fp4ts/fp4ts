import { Applicative } from '../../cats';
import { Either } from '../../fp/either';
import { Kind } from '../../fp/hkt';
import { Fiber } from './fiber';
import { MonadCancel } from './monad-cancel';
import { Outcome } from './outcome';

export interface Spawn<F, E> extends MonadCancel<F, E> {
  readonly applicative: Applicative<F>;

  readonly fork: <A>(fa: Kind<F, A>) => Kind<F, Fiber<F, E, A>>;
  readonly never: Kind<F, never>;
  readonly suspend: Kind<F, void>;

  readonly racePair: <A, B>(
    fa: Kind<F, A>,
    fb: Kind<F, B>,
  ) => Kind<
    F,
    Either<
      [Outcome<F, E, A>, Fiber<F, E, B>],
      [Fiber<F, E, A>, Outcome<F, E, B>]
    >
  >;

  readonly race: <A, B>(
    fa: Kind<F, A>,
    fb: Kind<F, B>,
  ) => Kind<F, Either<A, B>>;

  readonly raceOutcome: <A, B>(
    fa: Kind<F, A>,
    fb: Kind<F, B>,
  ) => Kind<F, Either<Outcome<F, E, A>, Outcome<F, E, B>>>;

  readonly both: <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) => Kind<F, [A, B]>;

  readonly bothOutcome: <A, B>(
    fa: Kind<F, A>,
    fb: Kind<F, B>,
  ) => Kind<F, [Outcome<F, E, A>, Outcome<F, E, B>]>;
}
