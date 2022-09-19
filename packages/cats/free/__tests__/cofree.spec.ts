// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval, EvalF } from '@fp4ts/cats-core';
import {
  Identity,
  List,
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
  cofNelToList,
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

    it('should unfold 100 options to a list', () => {
      const anaNel: CofreeNel<number> = Cofree.unfold(Option.Functor)(0)(i =>
        i === 100 ? None : Some(i + 1),
      );
      const raw = List.range(0, 101);

      expect(cofNelToList(anaNel)).toEqual(raw);
    });

    it('should unfold a list of hundred elements into a tree', () => {
      const anaNel: CofreeNel<number> = Cofree.ana(Option.Functor)(
        List.range(0, 101),
      )(
        xs => (xs.tail.isEmpty ? None : Some(xs.tail)),
        xs => xs.head,
      );
      const raw = List.range(0, 101);

      expect(cofNelToList(anaNel)).toEqual(raw);
    });
  });

  describe('catamorphism', () => {
    it('should transform a unfolded structure of options into a list', () => {
      const unfolded: Cofree<OptionF, number> = Cofree.unfold(Option.Functor)(
        0,
      )(i => (i === 100 ? None : Some(i + 1)));

      const cata = unfolded.cata(Option.Traversable)<List<number>>((i, lb) =>
        Eval.now(lb.getOrElse(() => List.empty).cons(i)),
      );

      expect(cata.value).toEqual(List.range(0, 101));
    });

    it('should be stack safe', () => {
      const size = 50_000;
      const sum = List.range(0, size + 1).foldLeft(0, (a, b) => a + b);
      const unfolded: Cofree<OptionF, number> = Cofree.unfold(Option.Functor)(
        0,
      )(i => (i === size ? None : Some(i + 1)));

      const cata = unfolded.cata(Option.Traversable)<number>((i, lb) =>
        Eval.now(lb.getOrElse(() => 0) + i),
      );

      expect(cata.value).toEqual(sum);
    });

    it('should allow evaluation in provided effect', () => {
      type EvalOption<A> = OptionT<EvalF, A>;

      const folder = (
        i: number,
        lb: Option<List<number>>,
      ): EvalOption<List<number>> =>
        i > 100
          ? OptionT.none(Eval.Applicative)
          : OptionT.some(Eval.Applicative)(
              lb.getOrElse(() => List.empty).cons(i),
            );
      const inclusion = OptionT.liftF(Eval.Applicative);

      const unfolded: Cofree<OptionF, number> = Cofree.unfold(Option.Functor)(
        0,
      )(i => (i === 100 ? None : Some(i + 1)));

      const cataHundred = unfolded.cataM(
        Option.Traversable,
        OptionT.Monad(Eval.Monad),
      )(folder, inclusion).value.value;
      const cataHundredOne = Cofree<OptionF, number>(
        101,
        Eval.now(Some(unfolded)),
      ).cataM(Option.Traversable, OptionT.Monad(Eval.Monad))(folder, inclusion)
        .value.value;

      expect(cataHundred).toEqual(Some(List.range(0, 101)));
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
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        cofreeOptionArb,
        eqCofreeNel,
      ),
    );

    const traversableTests = TraversableSuite(
      Cofree.Traversable(Option.Traversable),
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
        Option.Applicative,
        Option.Applicative,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
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
