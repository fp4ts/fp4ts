// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, $variables, Kind, TyK, TyVar } from '../hkt';
import { id } from '../function';
import { TypeRef } from './type-ref';

export const newtype =
  <A>() =>
  <Ref extends string>(Ref: Ref): Constructor<Ref, A> => {
    const nt = function () {} as any as Constructor<Ref, A>;
    (nt as any).Ref = Ref;
    (nt as any).unsafeWrap = id as any;
    (nt as any).unwrap = id as any;
    return nt;
  };

export const subtype =
  <A>() =>
  <Ref extends string>(Ref: Ref): SubtypeConstructor<Ref, A> => {
    const nt = function () {} as any as SubtypeConstructor<Ref, A>;
    (nt as any).Ref = Ref;
    (nt as any).unsafeWrap = id as any;
    (nt as any).unwrap = id as any;
    return nt;
  };

export interface Newtype<Ref extends string, A> {
  readonly Ref: Ref;
  readonly _A: A;
}

export type Subtype<Ref extends string, A> = A & {
  readonly Ref: Ref;
  readonly _A: A;
};

export interface Constructor<Ref extends string, A>
  extends TypeRef<Ref, Newtype<Ref, A>> {
  new (...args: [never]): Newtype<Ref, A>;
  unsafeWrap(a: A): Newtype<Ref, A>;
  unwrap(a: Newtype<Ref, A>): A;
  readonly Type: Newtype<Ref, A>;
}

export interface SubtypeConstructor<Ref extends string, A>
  extends TypeRef<Ref, Subtype<Ref, A>> {
  new (...args: [never]): Newtype<Ref, A>;
  unsafeWrap(a: A): Subtype<Ref, A>;
  unwrap(a: Subtype<Ref, A>): A;
  readonly Type: Subtype<Ref, A>;
}

// prettier-ignore
type NewKind<Ref extends string, F, A extends unknown[]> =
  Newtype<Ref, Kind<F, A>> & { tag: A };

export interface NewtypeF<Ref extends string, F> extends TyK {
  [$type]: this[$variables] extends infer A extends unknown[]
    ? NewKind<Ref, F, A>
    : never;
}

export interface KindId extends TyK<[unknown]> {
  [$type]: TyVar<this, 0>;
}

export interface ConstructorK<Ref extends string, F = KindId> {
  Ref: Ref;
  <A extends unknown[]>(fa: Kind<F, A>): NewKind<Ref, F, A>;
  unapply<A extends unknown[]>(nt: NewKind<Ref, F, A>): Kind<F, A>;
  fix<A extends unknown[]>(): Constructor<Ref, Kind<F, A>>;
}

export function newtypeK<F = KindId>(): <Ref extends string>(
  Ref: Ref,
) => ConstructorK<Ref, F> {
  return function <Ref extends string>(Ref: Ref): ConstructorK<Ref, F> {
    const cotr: ConstructorK<Ref, F> = function <A extends unknown[]>(
      _: Kind<F, A>,
    ): NewKind<Ref, F, A> {
      return _ as any;
    };
    cotr.Ref = Ref;
    cotr.unapply = <A extends unknown[]>(_: NewKind<Ref, F, A>): Kind<F, A> =>
      _ as any;
    cotr.fix = <A extends unknown[]>() => newtype<Kind<F, A>>()(Ref);
    return cotr;
  };
}

export type KindOf<T> = [T] extends [ConstructorK<infer Ref, infer F>]
  ? NewtypeF<Ref, F>
  : never;
