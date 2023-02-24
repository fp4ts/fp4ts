// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval, EvalF } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';
import {
  Identity,
  None,
  Option,
  OptionF,
  OptionT,
  Some,
} from '@fp4ts/cats-core/lib/data';
import { Eq, CommutativeMonoid } from '@fp4ts/cats-kernel';
import { ComonadSuite, TraversableSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { Cofree } from '@fp4ts/cats-free';
import {
  cofNelToArray,
  CofreeNel,
  cofreeOptionArb,
  eqCofreeNel,
} from './cofree-nel';

describe('Cofree', () => {
  describe('anamorphism', () => {
    it('should create a lazy Cofree structure', () => {
      let counter = 0;
      const incrementor = Cofree.unfold(Identity.Functor)(counter)(
        () => counter++,
      );

      expect(counter).toBe(0);
      incrementor.tail.value;
      expect(counter).toBe(1);
    });

    it('should create a lazy Cofree structure', () => {
      let counter = 0;
      const incrementor = Cofree.unfold(Identity.Functor)(counter)(
        () => counter++,
      );

      expect(counter).toBe(0);
      incrementor.forcedTail;
      expect(counter).toBe(1);
    });

    it('should unfold 100 options to a array', () => {
      const anaNel: CofreeNel<number> = Cofree.unfold(Option.Functor)(0)(i =>
        i === 100 ? None : Some(i + 1),
      );
      const raw = [...new Array(101).keys()];

      expect(cofNelToArray(anaNel)).toEqual(raw);
    });

    it('should unfold a array of hundred elements into a tree', () => {
      const anaNel: CofreeNel<number> = Cofree.ana(Option.Functor)([
        ...new Array(101).keys(),
      ])(
        xs => (xs.length < 2 ? None : Some(xs.slice(1))),
        xs => xs[0],
      );
      const raw = [...new Array(101).keys()];

      expect(cofNelToArray(anaNel)).toEqual(raw);
    });
  });

  describe('catamorphism', () => {
    it('should transform a unfolded structure of options into a array', () => {
      const unfolded: Cofree<OptionF, number> = Cofree.unfold(Option.Functor)(
        0,
      )(i => (i === 100 ? None : Some(i + 1)));

      const cata = unfolded.cata(Option.TraversableFilter)<number[]>((i, lb) =>
        Eval.now([i, ...lb.getOrElse(() => [])]),
      );

      expect(cata.value).toEqual([...new Array(101).keys()]);
    });

    it('should be stack safe', () => {
      const size = 50_000;
      const sum = [...new Array(size + 1).keys()].reduce((a, b) => a + b, 0);
      const unfolded: Cofree<OptionF, number> = Cofree.unfold(Option.Functor)(
        0,
      )(i => (i === size ? None : Some(i + 1)));

      const cata = unfolded.cata(Option.TraversableFilter)<number>((i, lb) =>
        Eval.now(lb.getOrElse(() => 0) + i),
      );

      expect(cata.value).toEqual(sum);
    });

    it('should allow evaluation in provided effect', () => {
      type EvalOption<A> = OptionT<EvalF, A>;

      const folder = (i: number, lb: Option<number[]>): EvalOption<number[]> =>
        i > 100
          ? OptionT.None(Monad.Eval)
          : OptionT.Some(Monad.Eval)([i, ...lb.getOrElse(() => [])]);
      const inclusion = OptionT.liftF(Monad.Eval);

      const unfolded: Cofree<OptionF, number> = Cofree.unfold(Option.Functor)(
        0,
      )(i => (i === 100 ? None : Some(i + 1)));

      const cataHundred = unfolded.cataM(
        Option.TraversableFilter,
        OptionT.Monad(Monad.Eval),
      )(folder, inclusion).value;
      const cataHundredOne = Cofree<OptionF, number>(
        101,
        Eval.now(Some(unfolded)),
      ).cataM(Option.TraversableFilter, OptionT.Monad(Monad.Eval))(
        folder,
        inclusion,
      ).value;

      expect(cataHundred).toEqual(Some([...new Array(101).keys()]));
      expect(cataHundredOne).toEqual(None);
    });
  });

  describe('Laws', () => {
    const comonadTests = ComonadSuite(Cofree.Comonad(Option.Functor));
    checkAll(
      'Comonad<Cofree<Option, *>>',
      comonadTests.comonad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        cofreeOptionArb,
        eqCofreeNel,
      ),
    );

    const traversableTests = TraversableSuite(
      Cofree.Traversable(Option.TraversableFilter),
    );
    checkAll(
      'Traversable<Cofree<Option, *>>',
      traversableTests.traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        Cofree.Functor(Option.Functor),
        Option.Monad,
        Option.Monad,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        cofreeOptionArb,
        eqCofreeNel,
        A.fp4tsOption,
        Option.Eq,
        A.fp4tsOption,
        Option.Eq,
      ),
    );
  });
});
