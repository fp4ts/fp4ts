import { Kind, pipe, throwError } from '@fp4ts/core';
import {
  Either,
  Left,
  Right,
  Option,
  Some,
  None,
  Chain,
  IdentityK,
  List,
} from '@fp4ts/cats';
import { Ref, Outcome, UniqueToken, ExitCase, Poll } from '@fp4ts/effect';

import { CompositeFailure } from '../composite-failure';
import { CompilerTarget } from '../compiler';
import { Lease } from './lease';
import { InterruptContext } from './interrupt-context';
import { ScopedResource } from './scoped-resource';
import { InterruptionOutcome } from './interrupt-context';

export class Scope<F> {
  private readonly __void!: void;

  private constructor(
    private readonly target: CompilerTarget<F>,
    public readonly id: UniqueToken,
    private readonly parent: Option<Scope<F>>,
    public readonly interruptible: Option<InterruptContext<F>>,
    private readonly state: Ref<F, ScopeState<F>>,
  ) {}

  public static create =
    <F>(target: CompilerTarget<F>) =>
    (
      id: UniqueToken,
      parent: Option<Scope<F>>,
      interruptible: Option<InterruptContext<F>>,
    ): Kind<F, [Scope<F>]> =>
      target.F.map_(
        target.ref(ScopeState.initial<F>()),
        state => new Scope(target, id, parent, interruptible, state),
      );

  public static newRoot = <F>(target: CompilerTarget<F>): Kind<F, [Scope<F>]> =>
    target.F.flatMap_(target.unique, id =>
      Scope.create(target)(id, None, None),
    );

  public get isRoot(): boolean {
    return this.parent.isEmpty;
  }

  public get level(): number {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cur: Scope<F> = this;
    let level = 0;
    while (cur.parent.nonEmpty) {
      level += 1;
      cur = cur.parent.get;
    }
    return level;
  }

  public get isInterrupted(): Kind<F, [Option<InterruptionOutcome>]> {
    return this.interruptible.fold(
      () => this.target.F.pure(None),
      iCtx => iCtx.ref.get(),
    );
  }

  public findStepScope(scopeId: UniqueToken): Kind<F, [Option<Scope<F>>]> {
    const { F } = this.target;

    return this.id === scopeId
      ? F.pure(Some(this))
      : this.parent.fold(
          () => this.findSelfOrChild(scopeId),
          parent =>
            F.flatMap_(parent.findSelfOrChild(scopeId), opt =>
              opt.fold<Kind<F, [Option<Scope<F>>]>>(
                () => this.rootScope.findSelfOrChild(scopeId),
                scope => F.pure(Some(scope)),
              ),
            ),
        );
  }

  public findInLineage(scopeId: UniqueToken): Kind<F, [Option<Scope<F>>]> {
    const { F } = this.target;
    return this.findSelfOrAncestor(scopeId).fold(
      () => this.findSelfOrChild(scopeId),
      scope => F.pure(Some(scope)),
    );
  }

  public interruptibleEval<A>(
    fa: Kind<F, [A]>,
  ): Kind<F, [Either<InterruptionOutcome, A>]> {
    const { F } = this.target;
    return this.interruptible.fold(
      () =>
        F.map_(F.attempt(fa), ea =>
          ea.leftMap(e => Outcome.failure<F, Error>(e)),
        ),
      iCtx => iCtx.evalF(fa),
    );
  }

  public open(interruptible: boolean): Kind<F, [Either<Error, Scope<F>>]> {
    const { F } = this.target;
    const createScope: Kind<F, [Scope<F>]> = F.flatMap_(
      this.target.unique,
      newScopeId =>
        this.interruptible.fold(
          () => {
            const optFCtx = interruptible
              ? this.target.interruptContext(newScopeId)
              : None;

            return optFCtx.fold(
              () => Scope.create(this.target)(newScopeId, Some(this), None),
              fCtx =>
                F.flatMap_(fCtx, ctx =>
                  Scope.create(this.target)(newScopeId, Some(this), Some(ctx)),
                ),
            );
          },
          parentICtx =>
            F.flatMap_(
              parentICtx.childContext(interruptible, newScopeId),
              iCtx =>
                Scope.create(this.target)(newScopeId, Some(this), Some(iCtx)),
            ),
        ),
    );

    return F.flatMap_(createScope, scope =>
      pipe(
        this.state.modify(s =>
          s.tag === 'closed'
            ? [s, None]
            : [s.copy({ children: s.children['+::'](scope) }), Some(scope)],
        ),
        F.flatMap(optScope =>
          optScope.fold<Kind<F, [Either<Error, Scope<F>>]>>(
            () =>
              this.parent.fold(
                () => F.pure(Left(new Error('Cannot re-open closed scope'))),
                parent =>
                  F.productR_(
                    this.interruptible
                      .map(x => x.cancelParent)
                      .getOrElse(() => F.unit),
                    parent.open(interruptible),
                  ),
              ),
            scope => F.pure(Right(scope)),
          ),
        ),
      ),
    );
  }

  public acquireResource<R>(
    acquire: (p: Poll<F>) => Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ): Kind<F, [Outcome<IdentityK, Error, Either<UniqueToken, R>>]> {
    const { F } = this.target;

    return pipe(
      this.interruptibleEval<Either<Error, R>>(
        F.flatMap_(ScopedResource.create(this.target), resource =>
          F.uncancelable(poll =>
            F.redeemWith_(
              acquire(poll),
              e => F.pure(Left(e)),
              r => {
                const finalizer = (ec: ExitCase) => release(r, ec);
                return pipe(
                  resource.acquired(finalizer),
                  F.flatMap(result =>
                    result.isRight
                      ? F.flatMap_(this.register(resource), registered =>
                          registered
                            ? F.pure(Right(r))
                            : F.map_(finalizer(ExitCase.Canceled), () =>
                                Left(new Error('AcquireAfterClose')),
                              ),
                        )
                      : F.map_(finalizer(ExitCase.Canceled), () =>
                          result.swapped.getOrElse(
                            () => new Error('AcquireAfterClose'),
                          ),
                        ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
      F.map(ea =>
        ea.fold<Outcome<IdentityK, Error, Either<UniqueToken, R>>>(
          oc =>
            oc.fold(
              () => Outcome.canceled<IdentityK>(),
              e => Outcome.failure<IdentityK, Error>(e),
              token =>
                Outcome.success<IdentityK, Either<UniqueToken, R>>(Left(token)),
            ),
          er =>
            er.fold(
              e => Outcome.failure<IdentityK, Error>(e),
              r => Outcome.success<IdentityK, Either<UniqueToken, R>>(Right(r)),
            ),
        ),
      ),
    );
  }

  public close(ec: ExitCase): Kind<F, [Either<Error, void>]> {
    const { F } = this.target;

    return pipe(
      this.state.modify(s => [ScopeState.closed(), s]),
      F.flatMap(prevState =>
        prevState.tag === 'closed'
          ? F.pure(Either.rightUnit)
          : pipe(
              F.Do,
              F.bindTo(
                'resultChildren',
                this.traverseError<Scope<F>>(prevState.children, x =>
                  x.close(ec),
                ),
              ),
              F.bindTo(
                'resultResources',
                this.traverseError<ScopedResource<F>>(prevState.resources, x =>
                  x.release(ec),
                ),
              ),
              F.bind(
                this.interruptible
                  .map(x => x.cancelParent)
                  .getOrElse(() => F.unit),
              ),
              F.bind(
                this.parent.fold(
                  () => F.unit,
                  parent => parent.releaseChildScope(this.id),
                ),
              ),

              F.map(({ resultChildren, resultResources }) => {
                const results = resultChildren
                  .fold(List, () => List.empty)
                  ['+++'](resultResources.fold(List, () => List.empty));

                return CompositeFailure.fromList(results).fold(
                  () => Either.rightUnit,
                  Left,
                ) as Either<Error, void>;
              }),
            ),
      ),
    );
  }

  public get lease(): Kind<F, [Lease<F>]> {
    const { F } = this.target;

    return pipe(
      F.Do,
      F.bindTo(
        'children',
        F.flatMap_(this.state.get(), s =>
          s.tag === 'open'
            ? F.pure(s.children)
            : throwError(new Error('Scope closed at the time of the lease')),
        ),
      ),
      F.bindTo('allScopes', ({ children }) =>
        F.pure(children['::+'](this)['+++'](this.ancestors)),
      ),
      F.bindTo('allResources', ({ allScopes }) =>
        Chain.Traversable.flatTraverse_(Chain.Monad, F)(
          allScopes,
          scope => scope.resources,
        ),
      ),
      F.bindTo('allLeases', ({ allResources }) =>
        allResources.traverse(F)(resource => resource.lease),
      ),
      F.map(
        ({ allLeases }) =>
          new Lease(this.traverseError(allLeases, l => l.cancel)),
      ),
    );
  }

  private register = (resource: ScopedResource<F>): Kind<F, [boolean]> =>
    this.state.modify(s =>
      s.tag === 'open'
        ? [s.copy({ resources: s.resources['+::'](resource) }), true]
        : [s, false],
    );

  private releaseChildScope = (id: UniqueToken): Kind<F, [void]> =>
    this.state.update(s => (s.tag === 'open' ? s.unregisterChild(id) : s));

  private get resources(): Kind<F, [Chain<ScopedResource<F>>]> {
    const { F } = this.target;
    return F.map_(this.state.get(), s =>
      s.tag === 'open' ? s.resources : Chain.empty,
    );
  }

  private traverseError = <A>(
    ca: Chain<A>,
    f: (a: A) => Kind<F, [Either<Error, void>]>,
  ): Kind<F, [Either<Error, void>]> =>
    this.target.F.map_(
      Chain.Traversable.traverse_(this.target.F)(ca, f),
      results =>
        CompositeFailure.fromList(
          results.collect(ea =>
            ea.fold(
              e => Some(e),
              () => None,
            ),
          ).toList,
        ).fold<Either<Error, void>>(
          () => Either.rightUnit,
          e => Left(e),
        ),
    );

  private get ancestors(): Chain<Scope<F>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cur: Scope<F> = this;
    let acc: Chain<Scope<F>> = Chain.empty;
    while (cur.parent.nonEmpty) {
      const next = cur.parent.get;
      acc = acc['::+'](next);
      cur = next;
    }
    return acc;
  }

  private findSelfOrAncestor = (scopeId: UniqueToken): Option<Scope<F>> => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cur: Scope<F> = this;
    while (true) {
      if (cur.id === scopeId) return Some(cur);
      const next = cur.parent;
      if (next.isEmpty) return None;
      cur = next.get;
    }
  };

  private findSelfOrChild = (
    scopeId: UniqueToken,
  ): Kind<F, [Option<Scope<F>>]> => {
    const { F } = this.target;

    const go = (scopes: Chain<Scope<F>>): Kind<F, [Option<Scope<F>>]> =>
      scopes.uncons.fold(
        () => F.pure(None),
        ([scope, tl]) =>
          scope.id === scopeId
            ? F.pure(Some(scope))
            : F.flatMap_(scope.state.get(), s => {
                if (s.tag === 'closed') return go(tl);
                if (s.children.isEmpty) return go(tl);
                return F.flatMap_(go(s.children), scp =>
                  scp.fold(
                    () => go(tl),
                    scope => F.pure(Some(scope)),
                  ),
                );
              }),
      );

    return scopeId === this.id
      ? F.pure(Some(this))
      : F.flatMap_(this.state.get(), s =>
          s.tag === 'open' ? go(s.children) : F.pure(None),
        );
  };

  private get rootScope(): Scope<F> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cur: Scope<F> = this;
    while (cur.parent.nonEmpty) {
      cur = cur.parent.get;
    }
    return cur;
  }
}

type ScopeState<F> = Open<F> | Closed;
const ScopeState = Object.freeze({
  initial: <F>(): ScopeState<F> => new Open<F>(Chain.empty, Chain.empty),
  closed: <F>(): ScopeState<F> => Closed,
});

type StateProps<F> = {
  readonly resources: Chain<ScopedResource<F>>;
  readonly children: Chain<Scope<F>>;
};
class Open<F> {
  public readonly tag = 'open';
  public constructor(
    public readonly resources: Chain<ScopedResource<F>>,
    public readonly children: Chain<Scope<F>>,
  ) {}

  public unregisterChild = (id: UniqueToken): ScopeState<F> =>
    this.children
      .deleteFirst(s => s.id === id)
      .fold(
        () => this,
        ([, newChildren]) => this.copy({ children: newChildren }),
      );

  public copy({
    resources = this.resources,
    children = this.children,
  }: Partial<StateProps<F>> = {}): Open<F> {
    return new Open(resources, children);
  }
}

const Closed = { tag: 'closed' as const };
type Closed = typeof Closed;
