import { Option, None, Some } from '../../option';
import { List } from '../list';
import { Deep, Empty, Node, Single, view, FingerTree, Affix } from './algebra';
import { fingerTreeMeasured, listMeasured, nodeMeasured } from './instances';
import { Measured } from './measured';

const throwError = (e: Error) => {
  throw e;
};

export const isEmpty: <V, A>(xs: FingerTree<V, A>) => boolean = xs => {
  const v = view(xs);
  return v.tag === 'empty';
};
export const nonEmpty: <V, A>(xs: FingerTree<V, A>) => boolean = xs =>
  !isEmpty(xs);

export const head: <V, A>(M: Measured<A, V>) => (xs: FingerTree<V, A>) => A =
  M => xs =>
    headOption(M)(xs).getOrElse(() =>
      throwError(new Error('Vector.empty.head')),
    );

export const headOption: <V, A>(
  M: Measured<A, V>,
) => (xs: FingerTree<V, A>) => Option<A> = M => xs =>
  popHead(M)(xs).map(([h]) => h);

export const tail: <V, A>(
  M: Measured<A, V>,
) => (xs: FingerTree<V, A>) => FingerTree<V, A> = M => xs =>
  popHead(M)(xs)
    .map(([, tl]) => tl)
    .getOrElse(() => new Empty());

export const last: <V, A>(M: Measured<A, V>) => (xs: FingerTree<V, A>) => A =
  M => xs =>
    lastOption(M)(xs).getOrElse(() =>
      throwError(new Error('Vector.empty.last')),
    );

export const lastOption: <V, A>(
  M: Measured<A, V>,
) => (xs: FingerTree<V, A>) => Option<A> = M => xs =>
  popLast(M)(xs).map(([h]) => h);

export const init: <V, A>(
  M: Measured<A, V>,
) => (xs: FingerTree<V, A>) => FingerTree<V, A> = M => xs =>
  popLast(M)(xs)
    .map(([, tl]) => tl)
    .getOrElse(() => new Empty());

export const toList = <V, A>(v: FingerTree<V, A>): List<A> =>
  foldRight_(v, List.empty as List<A>, (x, xs) => xs.prepend(x));

export const toArray = <V, A>(v: FingerTree<V, A>): A[] =>
  foldLeft_(v, [] as A[], (xs, x) => [...xs, x]);

export const popHead =
  <V, A>(M: Measured<A, V>) =>
  (v: FingerTree<V, A>): Option<[A, FingerTree<V, A>]> => {
    const ft = view(v);

    switch (ft.tag) {
      case 'empty':
        return None;

      case 'single':
        return Some([ft.value, new Empty()]);

      case 'deep':
        switch (ft.prefix.length) {
          case 2:
          case 3:
          case 4: {
            const [x, ...rest] = ft.prefix;
            return Some([x, _mkDeep(rest, ft.deep, ft.suffix, M)]);
          }
          case 1: {
            const rest = popHead(nodeMeasured(M))(ft.deep).fold(
              () => {
                switch (ft.suffix.length) {
                  case 1:
                    return new Single<V, A>(ft.suffix[0]);
                  case 2: {
                    const [x, y] = ft.suffix;
                    return _mkDeep([x], new Empty<V>(), [y], M);
                  }
                  case 3: {
                    const [x, y, z] = ft.suffix;
                    return _mkDeep([x, y], new Empty<V>(), [z], M);
                  }
                  case 4: {
                    const [x, y, z, w] = ft.suffix;
                    return _mkDeep([x, y, z], new Empty<V>(), [w], M);
                  }
                }
              },
              ([[, ...node], rest_]) => _mkDeep(node, rest_, ft.suffix, M),
            );
            return Some([ft.prefix[0], rest]);
          }
        }
    }
  };

export const popLast =
  <V, A>(M: Measured<A, V>) =>
  (v: FingerTree<V, A>): Option<[A, FingerTree<V, A>]> => {
    const ft = view(v);

    switch (ft.tag) {
      case 'empty':
        return None;

      case 'single':
        return Some([ft.value, new Empty()]);

      case 'deep':
        switch (ft.suffix.length) {
          case 2: {
            const [x, y] = ft.suffix;
            return Some([y, _mkDeep(ft.prefix, ft.deep, [x], M)]);
          }
          case 3: {
            const [x, y, z] = ft.suffix;
            return Some([z, _mkDeep(ft.prefix, ft.deep, [x, y], M)]);
          }
          case 4: {
            const [x, y, z, w] = ft.suffix;
            return Some([w, _mkDeep(ft.prefix, ft.deep, [x, y, z], M)]);
          }
          case 1: {
            const rest = popLast(nodeMeasured(M))(ft.deep).fold(
              () => {
                switch (ft.prefix.length) {
                  case 1:
                    return new Single<V, A>(ft.prefix[0]);
                  case 2: {
                    const [x, y] = ft.prefix;
                    return _mkDeep([x], new Empty<V>(), [y], M);
                  }
                  case 3: {
                    const [x, y, z] = ft.prefix;
                    return _mkDeep([x], new Empty<V>(), [y, z], M);
                  }
                  case 4: {
                    const [x, y, z, w] = ft.prefix;
                    return _mkDeep([x], new Empty<V>(), [y, z, w], M);
                  }
                }
              },
              ([[v, ...node], rest_]) => _mkDeep(node, rest_, ft.suffix, M),
            );
            return Some([ft.suffix[ft.suffix.length - 1], rest]);
          }
        }
    }
  };

export const prepend: <V, B>(
  M: Measured<B, V>,
) => (x: B) => <A extends B>(xs: FingerTree<V, A>) => FingerTree<V, B> =
  M => x => xs =>
    prepend_(M)(xs, x);

export const append: <V, B>(
  M: Measured<B, V>,
) => (x: B) => <A extends B>(xs: FingerTree<V, A>) => FingerTree<V, B> =
  M => x => xs =>
    append_(M)(xs, x);

export const concat: <V, B>(
  M: Measured<B, V>,
) => (
  ys: FingerTree<V, B>,
) => <A extends B>(xs: FingerTree<V, A>) => FingerTree<V, B> = M => ys => xs =>
  concat_(M)(xs, ys);

export const splitAt: <V, A>(
  M: Measured<A, V>,
) => (
  start: V,
  p: (a: V) => boolean,
) => (xs: FingerTree<V, A>) => Option<[FingerTree<V, A>, A, FingerTree<V, A>]> =
  M => (start, p) => xs => splitAt_(M)(xs, start, p);

export const foldLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => <V>(xs: FingerTree<V, A>) => B = (z, f) => xs => foldLeft_(xs, z, f);

export const foldRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => <V>(xs: FingerTree<V, A>) => B = (z, f) => xs => foldRight_(xs, z, f);

// -- Point-ful operators

export const prepend_ =
  <V, A>(M: Measured<A, V>) =>
  (v: FingerTree<V, A>, x: A): FingerTree<V, A> => {
    const ft = view(v);

    switch (ft.tag) {
      case 'empty':
        return new Single(x);

      case 'single':
        return _mkDeep([x], new Empty(), [ft.value], M);

      case 'deep':
        switch (ft.prefix.length) {
          case 1:
          case 2:
          case 3:
            return _mkDeep([x, ...ft.prefix], ft.deep, ft.suffix, M);
          case 4: {
            const [a, b, c, d] = ft.prefix;
            const v = listMeasured(M).measure([b, c, d]);
            return _mkDeep(
              [x, a],
              prepend_(nodeMeasured(M))(ft.deep, [v, b, c, d]),
              ft.suffix,
              M,
            );
          }
        }
    }
  };

export const append_ =
  <V, A>(M: Measured<A, V>) =>
  (v: FingerTree<V, A>, x: A): FingerTree<V, A> => {
    const ft = view(v);

    switch (ft.tag) {
      case 'empty':
        return new Single(x);

      case 'single':
        return _mkDeep([ft.value], new Empty(), [x], M);

      case 'deep':
        switch (ft.suffix.length) {
          case 1:
          case 2:
          case 3:
            return _mkDeep(ft.prefix, ft.deep, [...ft.suffix, x], M);
          case 4: {
            const [a, b, c, d] = ft.suffix;
            const v = listMeasured(M).measure([a, b, c]);
            return _mkDeep(
              ft.prefix,
              append_(nodeMeasured(M))(ft.deep, [v, a, b, c]),
              [d, x],
              M,
            );
          }
        }
    }
  };

export const concat_ =
  <V, A>(M: Measured<A, V>) =>
  (xs: FingerTree<V, A>, ys: FingerTree<V, A>): FingerTree<V, A> =>
    _concatWithMiddle(M)(xs, [], ys);

export const splitAt_ =
  <V, A>(M: Measured<A, V>) =>
  (
    xs: FingerTree<V, A>,
    start: V,
    p: (a: V) => boolean,
  ): Option<[FingerTree<V, A>, A, FingerTree<V, A>]> => {
    const ft = view(xs);

    if (ft.tag === 'empty') return None;
    if (ft.tag === 'single') {
      if (p(M.monoid.combine_(start, M.measure(ft.value)))) {
        return Some([new Empty(), ft.value, new Empty()]);
      } else {
        return None;
      }
    }

    if (!p(M.monoid.combine_(start, ft.annotation)))
      // Split point does not exists
      return None;

    const LM = listMeasured(M);
    const startPref = M.monoid.combine_(start, LM.measure(ft.prefix));
    if (p(startPref)) {
      return _splitList(M)(ft.prefix, p, start).map(
        ([before, [x, ...after]]) => [
          _chunkToTree(M)(before),
          x,
          _mkDeep(after as Affix<A>, ft.deep, ft.suffix, M),
        ],
      );
    }

    const MN = nodeMeasured(M);
    const MFT = fingerTreeMeasured(MN);
    if (p(M.monoid.combine_(startPref, MFT.measure(ft.deep))))
      return splitAt_(MN)(ft.deep, startPref, p).flatMap(
        ([before, [, ...node], after]) => {
          const start_ = M.monoid.combine_(startPref, MFT.measure(before));
          return _splitList(M)(node, p, start_).map(
            ([beforeNode, [x, ...afterNode]]) => [
              _mkDeep(ft.prefix, before, beforeNode as Affix<A>, M),
              x,
              _mkDeep(afterNode as Affix<A>, after, ft.suffix, M),
            ],
          );
        },
      );

    const start_ = M.monoid.combine_(startPref, MFT.measure(ft.deep));
    return _splitList(M)(ft.suffix, p, start_).map(
      ([before, [x, ...after]]) => [
        _mkDeep(ft.prefix, ft.deep, before as Affix<A>, M),
        x,
        _chunkToTree(M)(after),
      ],
    );
  };

export const foldLeft_ = <V, A, B>(
  v: FingerTree<V, A>,
  z: B,
  f: (b: B, a: A) => B,
): B => {
  const ft = view(v);

  switch (ft.tag) {
    case 'empty':
      return z;
    case 'single':
      return f(z, ft.value);

    case 'deep': {
      const prefix = ft.prefix.reduce(f, z);
      const deep = foldLeft_(ft.deep, prefix, (result, [, ...n]) =>
        n.reduce(f, result),
      );
      return ft.suffix.reduce(f, deep);
    }
  }
};

export const foldRight_ = <V, A, B>(
  v: FingerTree<V, A>,
  z: B,
  f: (a: A, b: B) => B,
): B => {
  const ft = view(v);

  switch (ft.tag) {
    case 'empty':
      return z;
    case 'single':
      return f(ft.value, z);

    case 'deep': {
      const suffix = ft.suffix.reduceRight((r, x) => f(x, r), z);
      const deep = foldRight_(ft.deep, suffix, ([, ...n], result) =>
        n.reduceRight((r, x) => f(x, r), result),
      );
      return ft.prefix.reduceRight((r, x) => f(x, r), deep);
    }
  }
};

// -- Private implementation

const _mkDeep = <V, A>(
  prefix: Affix<A>,
  deep: FingerTree<V, Node<V, A>>,
  suffix: Affix<A>,
  M: Measured<A, V>,
) => {
  const { combine_, empty } = M.monoid;
  const ML = listMeasured(M);
  const MFT = fingerTreeMeasured(nodeMeasured(M));
  const annotation = [
    ML.measure(prefix),
    MFT.measure(deep),
    ML.measure(suffix),
  ].reduce(combine_, empty);

  return new Deep(annotation, prefix, deep, suffix);
};

const _nodes = <V, A>(M: Measured<A, V>) => {
  const ML = listMeasured(M);
  const loop = (xs: A[]): Node<V, A>[] => {
    switch (xs.length) {
      case 0:
      case 1:
        throw new Error('Not enough elements for nodes');
      case 2: {
        const [x, y] = xs;
        return [[ML.measure([x, y]), x, y]];
      }
      case 3: {
        const [x, y, z] = xs;
        return [[ML.measure([x, y, z]), x, y, z]];
      }
      default: {
        const [x, y, ...rest] = xs;
        return [[ML.measure([x, y]), x, y], ...loop(rest)];
      }
    }
  };
  return loop;
};

const _concatWithMiddle =
  <V, A>(M: Measured<A, V>) =>
  (lhs: FingerTree<V, A>, m: A[], rhs: FingerTree<V, A>): FingerTree<V, A> => {
    const left = view(lhs);
    const right = view(rhs);

    if (left.tag === 'empty' && m.length === 0) return right;
    if (left.tag === 'empty') {
      const [x, ...xs] = m;
      return prepend_(M)(_concatWithMiddle(M)(new Empty(), xs, right), x);
    }
    if (left.tag === 'single')
      return prepend_(M)(
        _concatWithMiddle(M)(new Empty(), m, right),
        left.value,
      );

    if (right.tag === 'empty' && m.length === 0) return left;
    if (right.tag === 'empty') {
      const [last, init] = [m[m.length - 1], m.slice(0, m.length - 1)];
      return append_(M)(_concatWithMiddle(M)(left, init, new Empty()), last);
    }
    if (right.tag === 'single')
      return append_(M)(
        _concatWithMiddle(M)(left, m, new Empty()),
        right.value,
      );

    const mid = _nodes(M)([...left.suffix, ...m, ...right.prefix]);
    const deep = _concatWithMiddle(nodeMeasured(M))(left.deep, mid, right.deep);
    return _mkDeep(left.prefix, deep, right.suffix, M);
  };

const _splitList =
  <V, A>(M: Measured<A, V>) =>
  (xs: A[], p: (a: V) => boolean, start: V): Option<[A[], A[]]> => {
    if (!xs) return None;

    const [x, ...rest] = xs;
    const start_ = M.monoid.combine_(start, M.measure(x));
    if (p(start_)) return Some([[], [x, ...rest]]);

    return _splitList(M)(rest, p, start_).map(([before, after]) => [
      [x, ...before],
      after,
    ]);
  };

const _chunkToTree =
  <V, A>(M: Measured<A, V>) =>
  (affix: A[]): FingerTree<V, A> => {
    switch (affix.length) {
      case 0:
        return new Empty();
      case 1:
        return new Single(affix[0]);
      case 2:
        return _mkDeep([affix[0]], new Empty<V>(), [affix[1]], M);
      case 3:
        return _mkDeep([affix[0]], new Empty<V>(), [affix[1], affix[2]], M);
      case 4:
        return _mkDeep(
          [affix[0], affix[1]],
          new Empty<V>(),
          [affix[2], affix[3]],
          M,
        );
      default:
        throw new Error('Invalid list size');
    }
  };
