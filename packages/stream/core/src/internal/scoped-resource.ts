import { Kind, pipe } from '@fp4ts/core';
import { Either, Right, Option, Some, None } from '@fp4ts/cats';
import { ExitCase, UniqueToken } from '@fp4ts/effect';

import { CompilerTarget } from '../compiler';
import { Lease } from './lease';

export class ScopedResource<F> {
  private readonly __void!: void;

  public constructor(
    public readonly id: UniqueToken,
    public readonly release: (ec: ExitCase) => Kind<F, [Either<Error, void>]>,
    public readonly acquired: (
      finalizer: (ec: ExitCase) => Kind<F, [void]>,
    ) => Kind<F, [Either<Error, boolean>]>,
    public readonly lease: Kind<F, [Option<Lease<F>>]>,
  ) {}

  public static create<F>(
    target: CompilerTarget<F>,
  ): Kind<F, [ScopedResource<F>]> {
    const { F } = target;
    const initialState = new State(true, None, 0);

    return pipe(
      F.Do,
      F.bindTo('state', target.ref<State<F>>(initialState)),
      F.bindTo('token', target.unique),
      F.map(({ state, token }) => {
        const pru: Kind<F, [Either<Error, void>]> = F.pure(Either.rightUnit);

        const release = (ec: ExitCase): Kind<F, [Either<Error, void>]> =>
          pipe(
            state.modify(s =>
              s.leases !== 0
                ? [s.copy({ open: false }), None]
                : [s.copy({ open: false, finalizer: None }), s.finalizer],
            ),
            F.flatMap(optFin =>
              optFin.map(fin => fin(ec)).getOrElse(() => pru),
            ),
          );

        const acquired = (
          finalizer: (ec: ExitCase) => Kind<F, [Either<Error, void>]>,
        ): Kind<F, [Either<Error, boolean>]> =>
          pipe(
            state.modify(s =>
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
                      finalizer: Some((ec: ExitCase) =>
                        F.attempt(finalizer(ec)),
                      ),
                    }),
                    F.pure(Right(true)),
                  ],
            ),
            F.flatten,
          );

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
          s.open
            ? [s.copy({ leases: s.leases + 1 }), Some(TheLease)]
            : [s, None],
        );

        return new ScopedResource(token, release, acquired, lease);
      }),
    );
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
