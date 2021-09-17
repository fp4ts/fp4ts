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
    .getOrElse(() => Empty);

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
    .getOrElse(() => Empty);

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
        return Some([ft.value, Empty]);

      case 'deep': {
        const mkDeep = _mkDeep(M);
        switch (ft.prefix.length) {
          case 2:
          case 3:
          case 4: {
            const [x, ...rest] = ft.prefix;
            return Some([x, mkDeep(rest, ft.deep, ft.suffix)]);
          }
          case 1: {
            const rest = popHead(nodeMeasured(M))(ft.deep).fold(
              () => {
                switch (ft.suffix.length) {
                  case 1:
                    return new Single<V, A>(ft.suffix[0]);
                  case 2: {
                    const [x, y] = ft.suffix;
                    return mkDeep([x], Empty, [y]);
                  }
                  case 3: {
                    const [x, y, z] = ft.suffix;
                    return mkDeep([x, y], Empty, [z]);
                  }
                  case 4: {
                    const [x, y, z, w] = ft.suffix;
                    return mkDeep([x, y, z], Empty, [w]);
                  }
                }
              },
              ([[, ...node], rest_]) => mkDeep(node, rest_, ft.suffix),
            );
            return Some([ft.prefix[0], rest]);
          }
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
        return Some([ft.value, Empty]);

      case 'deep': {
        const mkDeep = _mkDeep(M);
        switch (ft.suffix.length) {
          case 2: {
            const [x, y] = ft.suffix;
            return Some([y, mkDeep(ft.prefix, ft.deep, [x])]);
          }
          case 3: {
            const [x, y, z] = ft.suffix;
            return Some([z, mkDeep(ft.prefix, ft.deep, [x, y])]);
          }
          case 4: {
            const [x, y, z, w] = ft.suffix;
            return Some([w, mkDeep(ft.prefix, ft.deep, [x, y, z])]);
          }
          case 1: {
            const rest = popLast(nodeMeasured(M))(ft.deep).fold(
              () => {
                switch (ft.prefix.length) {
                  case 1:
                    return new Single<V, A>(ft.prefix[0]);
                  case 2: {
                    const [x, y] = ft.prefix;
                    return mkDeep([x], Empty, [y]);
                  }
                  case 3: {
                    const [x, y, z] = ft.prefix;
                    return mkDeep([x], Empty, [y, z]);
                  }
                  case 4: {
                    const [x, y, z, w] = ft.prefix;
                    return mkDeep([x], Empty, [y, z, w]);
                  }
                }
              },
              ([[, ...node], rest_]) => mkDeep(ft.prefix, rest_, node),
            );
            return Some([ft.suffix[ft.suffix.length - 1], rest]);
          }
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
    const mkDeep = _mkDeep(M);

    switch (ft.tag) {
      case 'empty':
        return new Single(x);

      case 'single':
        return mkDeep([x], Empty, [ft.value]);

      case 'deep':
        switch (ft.prefix.length) {
          case 1:
          case 2:
          case 3:
            return mkDeep([x, ...ft.prefix], ft.deep, ft.suffix);
          case 4: {
            const [a, b, c, d] = ft.prefix;
            const v = listMeasured(M).measure([b, c, d]);
            return mkDeep(
              [x, a],
              prepend_(nodeMeasured(M))(ft.deep, [v, b, c, d]),
              ft.suffix,
            );
          }
        }
    }
  };

export const append_ =
  <V, A>(M: Measured<A, V>) =>
  (v: FingerTree<V, A>, x: A): FingerTree<V, A> => {
    const ft = view(v);
    const mkDeep = _mkDeep(M);

    switch (ft.tag) {
      case 'empty':
        return new Single(x);

      case 'single':
        return mkDeep([ft.value], Empty, [x]);

      case 'deep':
        switch (ft.suffix.length) {
          case 1:
          case 2:
          case 3:
            return mkDeep(ft.prefix, ft.deep, [...ft.suffix, x]);
          case 4: {
            const [a, b, c, d] = ft.suffix;
            const v = listMeasured(M).measure([a, b, c]);
            return mkDeep(
              ft.prefix,
              append_(nodeMeasured(M))(ft.deep, [v, a, b, c]),
              [d, x],
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
    const { combine_ } = M.monoid;

    // An empty finger tree cannot have a split, since there
    // are no elements whose annotations we
    // can add to the monoidal value we are given.
    if (ft.tag === 'empty') return None;

    // For a single element, we must check whether or not its
    // annotation makes the predicate true.
    if (ft.tag === 'single')
      return p(combine_(start, M.measure(ft.value)))
        ? Some([Empty, ft.value, Empty])
        : None;

    // For the deeper case, we must do several checks:
    // Up to one for each prefix and for the deeper tree.
    const { annotation: total, prefix, deep, suffix } = ft;

    // Make sure a split point exists.
    if (!p(combine_(start, total)))
      // Split point does not exists
      return None;

    const LM = listMeasured(M);
    const startPref = combine_(start, LM.measure(prefix));
    // The split point is in the prefix.
    if (p(startPref)) {
      // Treat the prefix as a list and find where the split point is.
      return _splitList(M, prefix, p, start).map(
        //  Convert the pre-split part of the prefix to a tree.
        ([before, [x, ...after]]) => [
          _chunkToTree(M)(before),
          x,
          _mkDeep(M)(after, deep, suffix),
        ],
      );
    }

    const MN = nodeMeasured(M);
    const MFT = fingerTreeMeasured(MN);
    // The split point is in the deeper tree.
    if (p(combine_(startPref, MFT.measure(deep)))) {
      // Find the split point in the deeper tree.
      // The split point is not as fine-grained as we want, as it works on Node<V, A>,
      // instead of just values of type A.
      return splitAt_(MN)(deep, startPref, p).flatMap(
        ([before, [, ...node], after]) => {
          const start_ = combine_(startPref, MFT.measure(before));
          // Convert the node at the split point into a list, and search for the
          // real split point within that list.
          return _splitList(M, node, p, start_).map(
            ([beforeNode, [x, ...afterNode]]) => [
              _mkDeep(M)(prefix, before, beforeNode),
              x,
              _mkDeep(M)(afterNode, after, suffix),
            ],
          );
        },
      );
    }

    // Otherwise, the split point is in the suffix.
    const start_ = combine_(startPref, MFT.measure(deep));
    return _splitList(M, suffix, p, start_).map(([before, [x, ...after]]) => [
      _mkDeep(M)(prefix, deep, before),
      x,
      _chunkToTree(M)(after),
    ]);
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

const _mkDeep = <V, A>(M: Measured<A, V>) => {
  const { combine_, empty } = M.monoid;
  const MN = nodeMeasured(M);
  const chunkToTree = _chunkToTree(M);

  const loop = (
    prefix: A[],
    deep: FingerTree<V, Node<V, A>>,
    suffix: A[],
  ): FingerTree<V, A> => {
    if (prefix.length === 0 && suffix.length === 0)
      return popHead(MN)(deep).fold<FingerTree<V, A>>(
        () => Empty,
        ([[, ...node], deeper]) => loop(node, deeper, []),
      );

    if (prefix.length === 0)
      return popHead(MN)(deep).fold(
        () => chunkToTree(suffix),
        ([[, ...node], deeper]) => loop(node, deeper, suffix),
      );

    if (suffix.length === 0)
      return popLast(MN)(deep).fold(
        () => chunkToTree(prefix),
        ([[, ...node], deeper]) => loop(prefix, deeper, node),
      );

    const ML = listMeasured(M);
    const MFT = fingerTreeMeasured(MN);
    const annotation = [
      ML.measure(prefix),
      MFT.measure(deep),
      ML.measure(suffix),
    ].reduce(combine_, empty);

    return new Deep(annotation, prefix as Affix<A>, deep, suffix as Affix<A>);
  };
  return loop;
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

const _concatWithMiddle = <V, A>(M: Measured<A, V>) => {
  const prepend = prepend_(M);
  const append = append_(M);

  const loop = (
    lhs: FingerTree<V, A>,
    m: A[],
    rhs: FingerTree<V, A>,
  ): FingerTree<V, A> => {
    const left = view(lhs);
    const right = view(rhs);

    if (left.tag === 'empty' && m.length === 0) return right;
    if (left.tag === 'empty') {
      const [x, ...xs] = m;
      return prepend(loop(Empty, xs, right), x);
    }
    if (left.tag === 'single')
      return prepend(loop(Empty, m, right), left.value);

    if (right.tag === 'empty' && m.length === 0) return left;
    if (right.tag === 'empty') {
      const [last, init] = [m[m.length - 1], m.slice(0, m.length - 1)];
      return append(loop(left, init, Empty), last);
    }
    if (right.tag === 'single')
      return append(loop(left, m, Empty), right.value);

    const mid = _nodes(M)([...left.suffix, ...m, ...right.prefix]);
    const deep = _concatWithMiddle(nodeMeasured(M))(left.deep, mid, right.deep);
    return _mkDeep(M)(left.prefix, deep, right.suffix);
  };

  return loop;
};

const _splitList = <V, A>(
  M: Measured<A, V>,
  xs: A[],
  p: (a: V) => boolean,
  start: V,
): Option<[A[], A[]]> => {
  for (let i = 0, len = xs.length; i < len; i++) {
    start = M.monoid.combine_(start, M.measure(xs[i]));
    if (p(start)) return Some([xs.slice(0, i), xs.slice(i)]);
  }
  return None;
};

const _chunkToTree = <V, A>(M: Measured<A, V>) => {
  const ML = listMeasured(M);
  return (affix: A[]): FingerTree<V, A> => {
    const v = ML.measure(affix);
    switch (affix.length) {
      case 0:
        return Empty;
      case 1:
        return new Single(affix[0]);
      case 2:
        return new Deep(v, [affix[0]], Empty, [affix[1]]);
      case 3:
        return new Deep(v, [affix[0]], Empty, [affix[1], affix[2]]);
      case 4:
        return new Deep(v, [affix[0], affix[1]], Empty, [affix[2], affix[3]]);
      default:
        throw new Error('Invalid list size');
    }
  };
};
