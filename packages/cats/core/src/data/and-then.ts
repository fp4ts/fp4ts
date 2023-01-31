// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, id, lazy, TyK, TyVar, α, λ } from '@fp4ts/core';
import { Arrow, ArrowApply, ArrowChoice } from '../arrow';
import { Contravariant } from '../contravariant';
import { Functor } from '../functor';
import { Monad } from '../monad';

/**
 * A single-input function that supports stack-safe function composition via
 * `andThen` and `compose` with amortized linear time application (of composed
 * functions).
 *
 * @examples
 *
 * ```typescript
 * import { MonoidK } from '@fp4ts/cats';
 * type Endo<A> = (a: A) => A;
 * const endoMonoidK = MonoidK.of<FunctionF>({
 *   emptyK: AndThen.id,
 *   combineK_: (f, g) => AndThen(f).andThen(g),
 * });
 * ```
 */
export interface AndThen<in A, out B> {
  (a: A): B;
  andThen<C>(that: (b: B) => C): AndThen<A, C>;
  compose<A0>(that: (a0: A0) => A): AndThen<A0, B>;
}
export function AndThen<A, B>(f: (a: A) => B): AndThen<A, B>;
export function AndThen<A, B, C>(f: (a: A) => B, g: (b: B) => C): AndThen<A, C>;
export function AndThen(
  f: (x: any) => any,
  g?: (x: any) => any,
): AndThen<any, any> {
  if (g == null) return AndThen.lift(f);

  if (isAndThen(f)) return f.andThen(g);
  if (isAndThen(g)) return g.compose(f);
  return AndThen.lift(f).andThen(g);
}

AndThen.pure = <B, A>(x: B): AndThen<A, B> => Single(_ => x, 0);
AndThen.lift = <A, B>(f: (a: A) => B): AndThen<A, B> =>
  isAndThen(f) ? f : Single(f, 0);

AndThen.id = lazy(<A>(): AndThen<A, A> => Single(id, 0)) as <A>() => AndThen<
  A,
  A
>;

function Single<A, B>(f: (a: A) => B, idx: number): Single<A, B> {
  const apply = ((a: A): B => _runLoop(apply, a)) as Single<A, B>;

  apply[AndThenTag] = true;
  apply.tag = 'single' as const;
  apply.fun = f;
  apply.idx = idx;
  apply.andThen = andThen;
  apply.compose = compose;
  return apply;
}

function Concat<A, E, B>(f: View<A, E>, g: View<E, B>): Concat<A, E, B> {
  const apply = ((a: A): B => _runLoop(apply, a)) as Concat<A, E, B>;

  apply[AndThenTag] = true;
  apply.tag = 'concat';
  apply.left = f;
  apply.right = g;
  apply.andThen = andThen;
  apply.compose = compose;
  return apply;
}

const AndThenTag = Symbol('@fp4ts/cats/core/and-then');
type AndThenTag = typeof AndThenTag;
function isAndThen<A, B>(f: (a: A) => B): f is View<A, B> {
  return AndThenTag in f;
}

interface Single<A, B> extends AndThen<A, B> {
  [AndThenTag]: true;
  tag: 'single';
  fun: (a: A) => B;
  idx: number;
}

interface Concat<A, E, B> extends AndThen<A, B> {
  [AndThenTag]: true;
  tag: 'concat';
  left: View<A, E>;
  right: View<E, B>;
}

type View<A, B> = Single<A, B> | Concat<A, any, B>;

const fusionMaxStackDepth = 128;

function andThen<A, E, B>(this: View<A, E>, that: (e: E) => B): AndThen<A, B> {
  if (isAndThen(that)) return _andThen(this, that);
  if (this.tag === 'single') {
    const f = this.fun;
    return this.idx < fusionMaxStackDepth
      ? Single(x => that(f(x)), this.idx + 1)
      : Concat(this, Single(that, 0));
  } else {
    const rv = this.right;
    return rv.tag === 'single' && rv.idx < fusionMaxStackDepth
      ? Concat(
          this.left,
          Single(x => that(rv.fun(x)), rv.idx + 1),
        )
      : Concat(this, Single(that, 0));
  }
}

function compose<A, E, B>(this: View<E, B>, that: (e: A) => E): AndThen<A, B> {
  if (isAndThen(that)) return _andThen(that, this);
  if (this.tag === 'single') {
    const g = this.fun;
    return this.idx < fusionMaxStackDepth
      ? Single(x => g(that(x)), this.idx + 1)
      : Concat(Single(that, 0), this);
  } else {
    const lv = this.left as View<E, any>;
    return lv.tag === 'single' && lv.idx < fusionMaxStackDepth
      ? Concat(
          Single(x => lv.fun(that(x)), lv.idx + 1),
          this.right,
        )
      : Concat(Single(that, 0), this);
  }
}

function _andThen<A, B, C>(self: View<A, B>, that: View<B, C>): AndThen<A, C> {
  if (self.tag === 'single') {
    const f = self.fun;
    const indexF = self.idx;
    if (that.tag === 'single') {
      const g = that.fun;
      const indexG = that.idx;

      if (indexF + indexG < fusionMaxStackDepth)
        return Single(x => g(f(x)), indexF + indexG);
    } else {
      const leftV = that.left;
      if (leftV.tag === 'single' && indexF + leftV.idx < fusionMaxStackDepth)
        return Concat(
          Single(x => leftV.fun(f(x)), indexF + leftV.idx),
          that.right,
        );
    }
  } else {
    const lr = self.right;
    if (lr.tag === 'single') {
      const f = lr.fun;
      const indexF = lr.idx;
      if (that.tag === 'single') {
        const g = that.fun;
        const indexG = that.idx;
        if (indexF + indexG < fusionMaxStackDepth)
          Concat(
            self.left,
            Single(x => g(f(x)), indexF + indexG),
          );
      } else {
        const rl = that.left;
        if (rl.tag === 'single' && indexF + rl.idx < fusionMaxStackDepth)
          return Concat(
            self.left,
            Concat(
              Single(x => rl.fun(f(x)), indexF + rl.idx),
              that.right,
            ),
          );
      }
    }
  }

  return Concat(self, that);
}

function _runLoop<A, B>(f: View<A, B>, start: A): B {
  let current: unknown = start;
  let self: View<unknown, unknown> = f as View<unknown, unknown>;
  const stack: View<unknown, unknown>[] = [];

  while (true) {
    while (self.tag !== 'single') {
      const leftV = self.left;

      if (leftV.tag === 'single') {
        self = self.right;
        current = leftV.fun(current);
      } else {
        stack.push(self.right);
        self = leftV;
      }
    }

    current = self.fun(current);
    if (stack.length === 0) return current as B;
    self = stack.pop()!;
  }
}

// -- Instances

const andThenContravariant = lazy(() =>
  Contravariant.of({ contramap_: (fa, f) => fa.compose(f) }),
) as <B>() => Contravariant<λ<AndThenF, [α, Fix<B>]>>;

const andThenFunctor = lazy(
  <R>(): Functor<$<AndThenF, [R]>> =>
    Functor.of({ map_: (fa, f) => fa.andThen(f) }),
) as <R>() => Functor<$<AndThenF, [R]>>;

export const andThenMonad = lazy(<A>() => {
  const F = Monad.Function1<A>();
  return Monad.of<$<AndThenF, [A]>>({
    ...andThenFunctor(),
    pure: AndThen.pure,
    flatMap_: (fa, f) => AndThen.lift(F.flatMap_(fa, f)),
    tailRecM_: (s, f) => AndThen.lift(F.tailRecM_(s, f)),
  });
}) as <A>() => Monad<$<AndThenF, [A]>>;

const andThenArrow = lazy(
  (): Arrow<AndThenF> =>
    Arrow.of({
      lift: AndThen.lift,

      first:
        <C>() =>
        <A, B>(fa: AndThen<A, B>): AndThen<[A, C], [B, C]> =>
          AndThen.lift(([a, c]) => [fa(a), c]),

      second:
        <C>() =>
        <A, B>(fa: AndThen<A, B>): AndThen<[C, A], [C, B]> =>
          AndThen.lift(([c, a]) => [c, fa(a)]),

      lmap_: (fab, f) => fab.compose(f),
      rmap_: (fab, g) => fab.andThen(g),
      dimap_: (fab, f, g) => fab.compose(f).andThen(g),

      id: AndThen.id,

      compose_: (f, g) => f.compose(g),
    }),
);

const andThenArrowChoice = lazy((): ArrowChoice<AndThenF> => {
  const A = ArrowChoice.Function1;
  return ArrowChoice.of({
    ...andThenArrow(),

    choose: <A, B, C, D>(f: AndThen<A, C>, g: AndThen<B, D>) =>
      AndThen.lift(A.choose(f, g)),
  });
});

const andThenArrowApply = lazy((): ArrowApply<AndThenF> => {
  const A = ArrowApply.Function1;
  return ArrowApply.of({
    ...andThenArrow(),

    app: <A, B>(): AndThen<[AndThen<A, B>, A], B> => AndThen.lift(A.app()),
  });
});

AndThen.Contravariant = andThenContravariant;
AndThen.Functor = andThenFunctor;
AndThen.Monad = andThenMonad;
AndThen.Arrow = null as any as Arrow<AndThenF>;
AndThen.ArrowChoice = null as any as ArrowChoice<AndThenF>;
AndThen.ArrowApply = null as any as ArrowApply<AndThenF>;

Object.defineProperty(AndThen, 'Arrow', {
  get() {
    return andThenArrow();
  },
});
Object.defineProperty(AndThen, 'ArrowChoice', {
  get() {
    return andThenArrowChoice();
  },
});
Object.defineProperty(AndThen, 'ArrowApply', {
  get() {
    return andThenArrowApply();
  },
});

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface AndThenF extends TyK<[unknown, unknown]> {
  [$type]: AndThen<TyVar<this, 0>, TyVar<this, 1>>;
}
