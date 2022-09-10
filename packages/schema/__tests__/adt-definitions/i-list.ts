// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { List } from '@fp4ts/cats';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { $type, TyK, TyVar } from '@fp4ts/core';
import { SchemaK } from '@fp4ts/schema-kernel';

export abstract class IList<A> {
  private readonly __void!: void;

  public abstract fold<B, C = B>(
    onNil: () => B,
    onCons: (hd: A, tl: IList<A>) => C,
  ): B | C;

  public static fromList<A>(xs: List<A>): IList<A> {
    return xs.foldRight_(INil as IList<A>, (x, xs) => new ICons(x, xs));
  }

  public static toList<A>(xs: IList<A>): List<A> {
    let acc: List<A> = List.empty;
    while (xs !== INil) {
      const ys = xs as ICons<A>;
      acc = acc.prepend(ys.head);
      xs = ys.tail;
    }
    return acc.reverse;
  }

  public static arb<A>(arbA: Arbitrary<A>): Arbitrary<IList<A>> {
    return A.fp4tsList(arbA).map(IList.fromList);
  }

  public static readonly schemaK: SchemaK<IListF> = SchemaK.sum('tag')({
    cons: SchemaK.struct({
      tag: SchemaK.literal('cons'),
      head: SchemaK.par,
      tail: SchemaK.defer(() => IList.schemaK),
    }),
    nil: SchemaK.struct({ tag: SchemaK.literal('nil') }),
  }).imap(
    xs => (xs.tag === 'cons' ? new ICons(xs.head, xs.tail) : INil),
    <A>(xs: IList<A>) =>
      xs.fold(
        () => ({ tag: 'nil' }),
        (head, tail) => ({ tag: 'cons', head, tail }),
      ),
  );
}

export class ICons<A> extends IList<A> {
  public readonly tag = 'cons';

  public constructor(public readonly head: A, public readonly tail: IList<A>) {
    super();
  }

  public fold<B, C = B>(
    onNil: () => B,
    onCons: (hd: A, tl: IList<A>) => C,
  ): B | C {
    return onCons(this.head, this.tail);
  }
}

export const INil: IList<never> & { tag: 'nil' } =
  new (class INil extends IList<never> {
    public readonly tag = 'nil';

    public fold<B, C = B>(
      onNil: () => B,
      onCons: (hd: never, tl: IList<never>) => C,
    ): B | C {
      return onNil();
    }
  })();
export type INil = typeof INil;

export interface IListF extends TyK<[unknown]> {
  [$type]: IList<TyVar<this, 0>>;
}
