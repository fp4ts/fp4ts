// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Either, Right, Option, Some, None, MonadError } from '@fp4ts/cats';
import { ExitCase, Ref, UniqueToken } from '@fp4ts/effect';

import { CompilerTarget } from '../compiler';
import { Lease } from './lease';

export class ScopedResource<F> {
  private readonly __void!: void;

  public constructor(
    private readonly F: MonadError<F, Error>,
    private readonly state: Ref<F, State<F>>,
    public readonly id: UniqueToken,
    public readonly lease: Kind<F, [Option<Lease<F>>]>,
  ) {}

  public acquired(
    finalizer: (ec: ExitCase) => Kind<F, [void]>,
  ): Kind<F, [Either<Error, boolean>]> {
    const { F } = this;
    return pipe(
      this.state.modify(s =>
        s.isFinished
          ? [
              s,
              pipe(
                finalizer(ExitCase.Succeeded),
                F.map(() => false),
                F.attempt,
              ),
            ]
          : [
              s.copy({
                finalizer: Some((ec: ExitCase) => F.attempt(finalizer(ec))),
              }),
              F.pure(Right(true)),
            ],
      ),
      F.flatten,
    );
  }

  public release(ec: ExitCase): Kind<F, [Either<Error, void>]> {
    const { F } = this;
    return pipe(
      this.state.modify(s =>
        s.leases !== 0
          ? [s.copy({ open: false }), None]
          : [s.copy({ open: false, finalizer: None }), s.finalizer],
      ),
      this.F.flatMap(optFin =>
        optFin.map(fin => fin(ec)).getOrElse(() => F.pure(Either.rightUnit)),
      ),
    );
  }

  public static create<F>(
    target: CompilerTarget<F>,
  ): Kind<F, [ScopedResource<F>]> {
    const { F } = target;
    const initialState = new State<F>(true, None, 0);

    return F.do(function* (_) {
      const state = yield* _(target.ref<State<F>>(initialState));
      const token = yield* _(target.unique);
      const pru: Kind<F, [Either<Error, void>]> = F.pure(Either.rightUnit);

      const TheLease: Lease<F> = new Lease(
        pipe(
          state.modify(s => {
            const now = s.copy({ leases: s.leases - 1 });
            return [now, now];
          }),
          F.flatMap(now =>
            now.isFinished
              ? F.flatten(
                  state.modify(s => [
                    s.copy({ finalizer: None }),
                    s.finalizer.fold(
                      () => pru,
                      ff => ff(ExitCase.Succeeded),
                    ),
                  ]),
                )
              : pru,
          ),
        ),
      );

      const lease: Kind<F, [Option<Lease<F>>]> = state.modify(s =>
        s.open ? [s.copy({ leases: s.leases + 1 }), Some(TheLease)] : [s, None],
      );

      return new ScopedResource(F, state, token, lease);
    });
  }
}

type StateProps<F> = {
  readonly open: boolean;
  readonly finalizer: Option<(ec: ExitCase) => Kind<F, [Either<Error, void>]>>;
  readonly leases: number;
};
class State<F> {
  public constructor(
    public readonly open: boolean,
    public readonly finalizer: Option<
      (ec: ExitCase) => Kind<F, [Either<Error, void>]>
    >,
    public readonly leases: number,
  ) {}

  public get isFinished(): boolean {
    return !this.open && this.leases === 0;
  }

  public copy({
    open = this.open,
    finalizer = this.finalizer,
    leases = this.leases,
  }: Partial<StateProps<F>> = {}): State<F> {
    return new State(open, finalizer, leases);
  }
}
