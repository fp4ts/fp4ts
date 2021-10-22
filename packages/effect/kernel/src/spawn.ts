import { Kind, pipe } from '@cats4ts/core';
import { Either, Left, Right } from '@cats4ts/cats';

import { Poll } from './poll';
import { Fiber } from './fiber';
import { Outcome } from './outcome';
import { MonadCancel, MonadCancelRequirements } from './monad-cancel';

export interface Spawn<F, E> extends MonadCancel<F, E> {
  readonly fork: <A>(fa: Kind<F, [A]>) => Kind<F, [Fiber<F, E, A>]>;
  readonly never: Kind<F, [never]>;
  readonly suspend: Kind<F, [void]>;

  readonly racePair: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(
    fa: Kind<F, [A]>,
  ) => Kind<
    F,
    [
      Either<
        [Outcome<F, E, A>, Fiber<F, E, B>],
        [Fiber<F, E, A>, Outcome<F, E, B>]
      >,
    ]
  >;
  readonly racePair_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<
    F,
    [
      Either<
        [Outcome<F, E, A>, Fiber<F, E, B>],
        [Fiber<F, E, A>, Outcome<F, E, B>]
      >,
    ]
  >;

  readonly race: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [Either<A, B>]>;
  readonly race_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [Either<A, B>]>;

  readonly raceOutcome: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(
    fa: Kind<F, [A]>,
  ) => Kind<F, [Either<Outcome<F, E, A>, Outcome<F, E, B>>]>;
  readonly raceOutcome_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [Either<Outcome<F, E, A>, Outcome<F, E, B>>]>;

  readonly both: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [[A, B]]>;
  readonly both_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [[A, B]]>;

  readonly bothOutcome: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [[Outcome<F, E, A>, Outcome<F, E, B>]]>;
  readonly bothOutcome_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [[Outcome<F, E, A>, Outcome<F, E, B>]]>;
}

export type SpawnRequirements<F, E> = Pick<
  Spawn<F, E>,
  'fork' | 'never' | 'suspend' | 'racePair_'
> &
  MonadCancelRequirements<F, E> &
  Partial<Spawn<F, E>>;
export const Spawn = Object.freeze({
  of: <F, E>(F: SpawnRequirements<F, E>): Spawn<F, E> => {
    const self: Spawn<F, E> = {
      racePair: fb => fa => self.racePair_(fa, fb),

      race: fb => fa => self.race_(fa, fb),
      race_: <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) => {
        const cont = <X, Y>(
          poll: Poll<F>,
          oc: Outcome<F, E, X>,
          f: Fiber<F, E, Y>,
        ): Kind<F, [Either<X, Y>]> =>
          oc.fold(
            (): Kind<F, [Either<X, Y>]> =>
              pipe(
                poll(f.join),
                self.onCancel(f.cancel),
                self.flatMap(oc =>
                  oc.fold(
                    () => self.flatMap_(poll(self.canceled), () => self.never),
                    ey => self.throwError(ey),
                    fy => self.map_(fy, Right),
                  ),
                ),
              ),
            ex => F.flatMap_(f.cancel, () => F.throwError(ex)),
            fx =>
              pipe(
                f.cancel,
                self.flatMap(() => f.join),
                self.flatMap(oc =>
                  oc.fold(
                    () => self.map_(fx, Left),
                    ey => F.throwError(ey),
                    () => self.map_(fx, Left),
                  ),
                ),
              ),
          );

        return self.uncancelable(poll =>
          pipe(
            poll(self.racePair_(fa, fb)),
            self.flatMap(ea =>
              ea.fold(
                ([oc, f]) => cont(poll, oc, f),
                ([f, oc]) =>
                  pipe(
                    cont(poll, oc, f),
                    self.map(ea => ea.swapped),
                  ),
              ),
            ),
          ),
        );
      },

      raceOutcome: fb => fa => self.raceOutcome_(fa, fb),
      raceOutcome_: <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) =>
        self.uncancelable(() =>
          pipe(
            self.racePair_(fa, fb),
            self.flatMap(ea =>
              ea.fold(
                ([oc, f]) =>
                  pipe(
                    f.cancel,
                    self.map(
                      () =>
                        Left(oc) as Either<Outcome<F, E, A>, Outcome<F, E, B>>,
                    ),
                  ),
                ([f, oc]) =>
                  pipe(
                    f.cancel,
                    self.map(() => Right(oc)),
                  ),
              ),
            ),
          ),
        ),

      both: fb => fa => self.both_(fa, fb),
      both_: <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) => {
        const cont = <X, Y>(
          poll: Poll<F>,
          oc: Outcome<F, E, X>,
          f: Fiber<F, E, Y>,
        ): Kind<F, [[X, Y]]> =>
          oc.fold(
            () =>
              pipe(
                f.cancel,
                self.flatMap(() => poll(self.canceled)),
                self.flatMap(() => self.never),
              ),
            ex => self.flatMap_(f.cancel, () => self.throwError(ex)),
            fx =>
              pipe(
                poll(f.join),
                self.onCancel(f.cancel),
                self.flatMap(oc =>
                  oc.fold(
                    () => self.flatMap_(poll(self.canceled), () => self.never),
                    ey => self.throwError(ey),
                    fy => self.product_(fx, fy),
                  ),
                ),
              ),
          );

        return self.uncancelable(poll =>
          pipe(
            poll(self.racePair_(fa, fb)),
            self.flatMap(ea =>
              ea.fold(
                ([oc, f]) => cont(poll, oc, f),
                ([f, oc]) =>
                  pipe(
                    cont(poll, oc, f),
                    self.map(([b, a]) => [a, b]),
                  ),
              ),
            ),
          ),
        );
      },

      bothOutcome: fb => fa => self.bothOutcome_(fa, fb),
      bothOutcome_: (fa, fb) =>
        self.uncancelable(poll =>
          pipe(
            poll(self.racePair_(fa, fb)),
            self.flatMap(ea =>
              ea.fold(
                ([oc, f]) =>
                  pipe(
                    poll(f.join),
                    self.onCancel(f.cancel),
                    self.map(oc2 => [oc, oc2]),
                  ),
                ([f, oc]) =>
                  pipe(
                    poll(f.join),
                    self.onCancel(f.cancel),
                    self.map(oc2 => [oc2, oc]),
                  ),
              ),
            ),
          ),
        ),

      ...MonadCancel.of(F),
      ...F,
    };
    return self;
  },
});
