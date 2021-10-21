import '../array';
import { Kind, fst, snd, throwError, Iter } from '@cats4ts/core';
import { Eq } from '../../../eq';
import { Applicative } from '../../../applicative';
import { Eval } from '../../../eval';
import { Option, None, Some } from '../../option';

import { IndexedSeq } from '../indexed-seq';
import { List } from '../list';
import { Vector } from '../vector';
import { Seq } from '../seq';

import { Chain, Concat, Empty, NonEmpty, view, Wrap } from './algebra';
import { empty, fromSeq, pure } from './constructors';

export const isEmpty = <A>(c: Chain<A>): boolean => c === Empty;

export const nonEmpty = <A>(c: Chain<A>): boolean => c !== Empty;

export const head = <A>(c: Chain<A>): A =>
  uncons(c).fold(() => throwError(new Error('Empty.head')), fst);

export const headOption = <A>(c: Chain<A>): Option<A> => uncons(c).map(fst);
export const tail = <A>(c: Chain<A>): Chain<A> =>
  uncons(c)
    .map(snd)
    .getOrElse(() => Empty);

export const last = <A>(c: Chain<A>): A =>
  popLast(c).fold(() => throwError(new Error('Empty.last')), fst);
export const lastOption = <A>(c: Chain<A>): Option<A> => popLast(c).map(fst);
export const init = <A>(c: Chain<A>): Chain<A> =>
  popLast(c)
    .map(snd)
    .getOrElse(() => Empty);

export const popHead = <A>(c: Chain<A>): Option<[A, Chain<A>]> => {
  let _cur: Chain<A> = c;
  let result: [A, Chain<A>] | undefined;
  let sfx: NonEmpty<A> | undefined;

  while (!result) {
    const cur = view(_cur);
    switch (cur.tag) {
      case 'empty':
        return None;

      case 'singleton':
        result = sfx ? [cur.value, sfx] : [cur.value, Empty];
        break;

      case 'concat':
        sfx = sfx ? new Concat(cur.rhs, sfx) : cur.rhs;
        _cur = cur.lhs;
        break;

      case 'wrap': {
        const [hd, tl] = cur.values.popHead.get;
        sfx = (sfx ? concat_(fromSeq(tl), sfx) : fromSeq(tl)) as NonEmpty<A>;
        result = [hd, sfx];
        break;
      }
    }
  }

  return Some(result);
};
export const uncons: <A>(c: Chain<A>) => Option<[A, Chain<A>]> = popHead;

export const popLast = <A>(c: Chain<A>): Option<[A, Chain<A>]> => {
  let _cur: Chain<A> = c;
  let result: [A, Chain<A>] | undefined;
  let pfx: NonEmpty<A> | undefined;

  while (!result) {
    const cur = view(_cur);
    switch (cur.tag) {
      case 'empty':
        return None;

      case 'singleton':
        result = pfx ? [cur.value, pfx] : [cur.value, Empty];
        break;

      case 'concat':
        pfx = pfx ? new Concat(pfx, cur.lhs) : cur.lhs;
        _cur = cur.rhs;
        break;

      case 'wrap': {
        const [lst, ini] = cur.values.popLast.get;
        pfx = (pfx ? concat_(pfx, fromSeq(ini)) : fromSeq(ini)) as NonEmpty<A>;
        result = [lst, pfx];
        break;
      }
    }
  }

  return Some(result);
};

export const prepend: <AA>(x: AA) => <A extends AA>(xs: Chain<A>) => Chain<AA> =
  x => xs => prepend_(xs, x);

export const cons: <AA>(x: AA) => <A extends AA>(xs: Chain<A>) => Chain<AA> =
  prepend;

export const append: <AA>(x: AA) => <A extends AA>(xs: Chain<A>) => Chain<AA> =
  x => xs =>
    append_(xs, x);

export const snoc: <AA>(x: AA) => <A extends AA>(xs: Chain<A>) => Chain<AA> =
  append;

export const size = <A>(xs: Chain<A>): number => {
  let len = 0;
  for (let i = iterator(xs), x = i.next(); !x.done; x = i.next()) {
    len++;
  }
  return len;
};

export const iterator = <A>(c: Chain<A>): Iterator<A> => {
  let stack: List<Chain<A>> = List(c);
  let cur: Iterator<A> = Iter.empty;

  return Iter.lift(() => {
    iterLoop: while (true) {
      const next = cur.next();
      if (!next.done) return next;

      while (stack.nonEmpty) {
        const [hd, tl] = stack.uncons.get;
        stack = tl;

        const v = view(hd);
        switch (v.tag) {
          case 'empty':
            continue;
          case 'singleton':
            return Iter.Result.pure(v.value);
          case 'wrap':
            cur = v.values.iterator;
            continue iterLoop;
          case 'concat':
            stack = stack.prepend(v.rhs).prepend(v.lhs);
            continue;
        }
      }
      return Iter.Result.done;
    }
  });
};

export const reversedIterator = <A>(c: Chain<A>): Iterator<A> => {
  let stack: List<Chain<A>> = List(c);
  let cur: Iterator<A> = Iter.empty;

  return Iter.lift(() => {
    iterLoop: while (true) {
      const next = cur.next();
      if (!next.done) return next;

      while (stack.nonEmpty) {
        const [hd, tl] = stack.uncons.get;
        stack = tl;

        const v = view(hd);
        switch (v.tag) {
          case 'empty':
            continue;
          case 'singleton':
            return Iter.Result.pure(v.value);
          case 'wrap':
            cur = v.values.reverseIterator;
            continue iterLoop;
          case 'concat':
            stack = stack.prepend(v.lhs).prepend(v.rhs);
            continue;
        }
      }
      return Iter.Result.done;
    }
  });
};

export const concat: <AA>(
  y: Chain<AA>,
) => <A extends AA>(x: Chain<A>) => Chain<AA> = y => x => concat_(x, y);

export const collect: <A, B>(
  p: (a: A) => Option<B>,
) => (xs: Chain<A>) => Chain<B> = p => xs => collect_(xs, p);

export const foldLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (xs: Chain<A>) => B = (z, f) => xs => foldLeft_(xs, z, f);

export const foldRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => (xs: Chain<A>) => B = (z, f) => xs => foldRight_(xs, z, f);

export const zipWithIndex = <A>(xs: Chain<A>): Chain<[A, number]> =>
  new Wrap(Vector.fromIterator(Iter.zipWithIndex(iterator(xs))));

export const zipWith: <A, B, C>(
  ys: Chain<B>,
  f: (a: A, b: B) => C,
) => (xs: Chain<A>) => Chain<C> = (ys, f) => xs => zipWith_(xs, ys)(f);

export const traverse: <G>(
  G: Applicative<G>,
) => <A, B>(
  f: (a: A) => Kind<G, [B]>,
) => (xs: Chain<A>) => Kind<G, [Chain<B>]> = G => f => xs =>
  traverse_(G)(xs, f);

export const toArray = <A>(xs: Chain<A>): A[] => [...xs];

export const toList = <A>(xs: Chain<A>): List<A> =>
  List.fromIterator(iterator(xs));

export const toVector = <A>(xs: Chain<A>): Vector<A> =>
  Vector.fromIterator(iterator(xs));

export const toSeq = <A>(xs: Chain<A>): Seq<A> =>
  Seq.fromIterator(iterator(xs));

export const traverseViaChain =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: IndexedSeq<A>, f: (a: A) => Kind<G, [B]>): Kind<G, [Chain<B>]> => {
    if (xs.isEmpty) return G.pure(empty);

    // Max width of the tree -- max depth log_128(c.size)
    const width = 128;

    const loop = (start: number, end: number): Eval<Kind<G, [Chain<B>]>> => {
      if (end - start <= width) {
        // We've entered leaves of the tree
        let first = Eval.delay(() => G.map_(f(xs['!!'](end - 1)), List));
        for (let idx = end - 2; start <= idx; idx--) {
          const a = xs['!!'](idx);
          const right = first;
          first = Eval.defer(() =>
            G.map2Eval_(f(a), right)((h, t) => t.prepend(h)),
          );
        }
        return first.map(gls => G.map_(gls, fromSeq));
      } else {
        const step = ((end - start) / width) | 0;

        let fchain = Eval.defer(() => loop(start, start + step));

        for (
          let start0 = start + step, end0 = start0 + step;
          start0 < end;
          start0 += step, end0 += step
        ) {
          const end1 = Math.min(end, end0);
          const right = loop(start0, end1);
          fchain = fchain.flatMap(fv => G.map2Eval_(fv, right)(concat_));
        }
        return fchain;
      }
    };

    return loop(0, xs.size).value;
  };

// -- Point-ful operators

export const prepend_ = <A>(xs: Chain<A>, x: A): Chain<A> =>
  concat_(pure(x), xs);
export const cons_: <A>(xs: Chain<A>, x: A) => Chain<A> = prepend_;

export const append_ = <A>(xs: Chain<A>, x: A): Chain<A> =>
  concat_(xs, pure(x));
export const snoc_: <A>(xs: Chain<A>, x: A) => Chain<A> = append_;

export const concat_ = <A>(x: Chain<A>, y: Chain<A>): Chain<A> => {
  const xx = view(x);
  const yy = view(y);
  if (xx.tag === 'empty') return yy;
  if (yy.tag === 'empty') return xx;
  return new Concat(xx, yy);
};

export const collect_ = <A, B>(
  xs: Chain<A>,
  p: (a: A) => Option<B>,
): Chain<B> =>
  foldLeft_(xs, empty as Chain<B>, (ys, x) =>
    p(x).fold(
      () => ys,
      y => append_(ys, y),
    ),
  );

export const foldLeft_ = <A, B>(c: Chain<A>, z: B, f: (b: B, a: A) => B): B => {
  const it = iterator(c);
  let acc = z;
  for (let next: IteratorResult<A> = it.next(); !next.done; next = it.next()) {
    acc = f(acc, next.value);
  }
  return acc;
};

export const foldRight_ = <A, B>(
  c: Chain<A>,
  z: B,
  f: (a: A, b: B) => B,
): B => {
  const it = reversedIterator(c);
  let acc = z;
  for (let next: IteratorResult<A> = it.next(); !next.done; next = it.next()) {
    acc = f(next.value, acc);
  }
  return acc;
};

export const zipWith_ =
  <A, B>(xs: Chain<A>, ys: Chain<B>) =>
  <C>(f: (a: A, b: B) => C): Chain<C> =>
    new Wrap(Vector.fromIterator(Iter.zipWith_(iterator(xs), iterator(ys))(f)));

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: Chain<A>, f: (a: A) => Kind<G, [B]>): Kind<G, [Chain<B>]> =>
    traverseViaChain(G)(toArray(xs), f);

export const equals_ =
  <A>(E: Eq<A>) =>
  (xs: Chain<A>, ys: Chain<A>): boolean => {
    const xsIt = iterator(xs);
    const ysIt = iterator(ys);

    for (
      let x = xsIt.next(), y = ysIt.next();
      !x.done || !y.done;
      x = xsIt.next(), y = ysIt.next()
    ) {
      if (x.done || y.done) return false;
      if (E.notEquals(x.value, y.value)) return false;
    }
    return true;
  };

// const _forEachUntil = <A>(xs: Chain<A>, f: (a: A) => boolean): void => {
//   let stack: List<Chain<A>> = List(xs);

//   while (stack.nonEmpty) {
//     const next = view(stack.head);
//     stack = stack.tail;

//     switch (next.tag) {
//       case 'empty':
//         break;

//       case 'singleton': {
//         const cont = f(next.value);
//         if (!cont) return;
//         break;
//       }

//       case 'concat':
//         stack = stack.prepend(next.rhs).prepend(next.lhs);
//         break;

//       case 'wrap': {
//         const it = next.values.iterator;
//         for (let nextRes = it.next(); !nextRes.done; nextRes = it.next()) {
//           if (f(nextRes.value)) {
//             return;
//           }
//         }
//         break;
//       }
//     }
//   }
// };
