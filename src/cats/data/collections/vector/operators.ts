import { Option, None, Some } from '../../option';
import { List } from '../list';
import { Deep, Empty, Node, Single, toTree, Vector } from './algebra';
import { empty } from './constructors';

const throwError = (e: Error) => {
  throw e;
};

export const isEmpty: <A>(xs: Vector<A>) => boolean = xs => xs === Empty;
export const nonEmpty: <A>(xs: Vector<A>) => boolean = xs => xs !== Empty;

export const head: <A>(xs: Vector<A>) => A = xs =>
  headOption(xs).getOrElse(() => throwError(new Error('Vector.empty.head')));

export const headOption: <A>(xs: Vector<A>) => Option<A> = xs =>
  popHead(xs).map(([h]) => h);

export const tail: <A>(xs: Vector<A>) => Vector<A> = xs =>
  popHead(xs)
    .map(([, tl]) => tl)
    .getOrElse(() => empty);

export const last: <A>(xs: Vector<A>) => A = xs =>
  lastOption(xs).getOrElse(() => throwError(new Error('Vector.empty.last')));

export const lastOption: <A>(xs: Vector<A>) => Option<A> = xs =>
  popLast(xs).map(([h]) => h);

export const init: <A>(xs: Vector<A>) => Vector<A> = xs =>
  popLast(xs)
    .map(([, tl]) => tl)
    .getOrElse(() => empty);

export const toList = <A>(v: Vector<A>): List<A> =>
  foldRight_(v, List.empty as List<A>, (x, xs) => xs.prepend(x));

export const toArray = <A>(v: Vector<A>): A[] =>
  foldLeft_(v, [] as A[], (xs, x) => [...xs, x]);

export const popHead = <A>(v: Vector<A>): Option<[A, Vector<A>]> => {
  const ft = toTree(v);

  switch (ft.tag) {
    case 'empty':
      return None;

    case 'single':
      return Some([ft.value, Empty]);

    case 'deep':
      switch (ft.prefix.length) {
        case 2:
        case 3:
        case 4: {
          const [x, ...rest] = ft.prefix;
          return Some([x, new Deep(rest, ft.deep, ft.suffix)]);
        }
        case 1: {
          const rest = popHead(ft.deep).fold(
            () => {
              switch (ft.suffix.length) {
                case 1:
                  return new Single(ft.suffix[0]);
                case 2: {
                  const [x, y] = ft.suffix;
                  return new Deep([x], Empty, [y]);
                }
                case 3: {
                  const [x, y, z] = ft.suffix;
                  return new Deep([x, y], Empty, [z]);
                }
                case 4: {
                  const [x, y, z, w] = ft.suffix;
                  return new Deep([x, y, z], Empty, [w]);
                }
              }
            },
            ([node, rest_]) => new Deep(node, rest_, ft.suffix),
          );
          return Some([ft.prefix[0], rest]);
        }
      }
  }
};

export const popLast = <A>(v: Vector<A>): Option<[A, Vector<A>]> => {
  const ft = toTree(v);

  switch (ft.tag) {
    case 'empty':
      return None;

    case 'single':
      return Some([ft.value, Empty]);

    case 'deep':
      switch (ft.suffix.length) {
        case 2: {
          const [x, y] = ft.suffix;
          return Some([y, new Deep(ft.prefix, ft.deep, [x])]);
        }
        case 3: {
          const [x, y, z] = ft.suffix;
          return Some([z, new Deep(ft.prefix, ft.deep, [x, y])]);
        }
        case 4: {
          const [x, y, z, w] = ft.suffix;
          return Some([w, new Deep(ft.prefix, ft.deep, [x, y, z])]);
        }
        case 1: {
          const rest = popLast(ft.deep).fold(
            () => {
              switch (ft.prefix.length) {
                case 1:
                  return new Single(ft.prefix[0]);
                case 2: {
                  const [x, y] = ft.prefix;
                  return new Deep([x], Empty, [y]);
                }
                case 3: {
                  const [x, y, z] = ft.prefix;
                  return new Deep([x], Empty, [y, z]);
                }
                case 4: {
                  const [x, y, z, w] = ft.prefix;
                  return new Deep([x], Empty, [y, z, w]);
                }
              }
            },
            ([node, rest_]) => new Deep(node, rest_, ft.suffix),
          );
          return Some([ft.suffix[ft.suffix.length - 1], rest]);
        }
      }
  }
};

export const prepend: <B>(x: B) => <A extends B>(xs: Vector<A>) => Vector<B> =
  x => xs =>
    prepend_(xs, x);

export const append: <B>(x: B) => <A extends B>(xs: Vector<A>) => Vector<B> =
  x => xs =>
    append_(xs, x);

export const concat: <B>(
  ys: Vector<B>,
) => <A extends B>(xs: Vector<A>) => Vector<B> = ys => xs => concat_(xs, ys);

export const foldLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (xs: Vector<A>) => B = (z, f) => xs => foldLeft_(xs, z, f);

export const foldRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => (xs: Vector<A>) => B = (z, f) => xs => foldRight_(xs, z, f);

// -- Point-ful operators

export const prepend_ = <A>(v: Vector<A>, x: A): Vector<A> => {
  const ft = toTree(v);

  switch (ft.tag) {
    case 'empty':
      return new Single(x);

    case 'single':
      return new Deep([x], Empty, [ft.value]);

    case 'deep':
      switch (ft.prefix.length) {
        case 1:
        case 2:
        case 3:
          return new Deep([x, ...ft.prefix], ft.deep, ft.suffix);
        case 4: {
          const [a, b, c, d] = ft.prefix;
          return new Deep([x, a], prepend_(ft.deep, [b, c, d]), ft.suffix);
        }
      }
  }
};

export const append_ = <A>(v: Vector<A>, x: A): Vector<A> => {
  const ft = toTree(v);

  switch (ft.tag) {
    case 'empty':
      return new Single(x);

    case 'single':
      return new Deep([ft.value], Empty, [x]);

    case 'deep':
      switch (ft.suffix.length) {
        case 1:
        case 2:
        case 3:
          return new Deep(ft.prefix, ft.deep, [...ft.suffix, x]);
        case 4: {
          const [a, b, c, d] = ft.suffix;
          return new Deep(ft.prefix, append_(ft.deep, [a, b, c]), [d, x]);
        }
      }
  }
};

export const concat_ = <A>(xs: Vector<A>, ys: Vector<A>): Vector<A> =>
  _concatWithMiddle(xs, [], ys);

export const foldLeft_ = <A, B>(
  v: Vector<A>,
  z: B,
  f: (b: B, a: A) => B,
): B => {
  const ft = toTree(v);

  switch (ft.tag) {
    case 'empty':
      return z;
    case 'single':
      return f(z, ft.value);

    case 'deep': {
      const prefix = ft.prefix.reduce(f, z);
      const deep = foldLeft_(ft.deep, prefix, (result, n) =>
        n.reduce(f, result),
      );
      return ft.suffix.reduce(f, deep);
    }
  }
};

export const foldRight_ = <A, B>(
  v: Vector<A>,
  z: B,
  f: (a: A, b: B) => B,
): B => {
  const ft = toTree(v);

  switch (ft.tag) {
    case 'empty':
      return z;
    case 'single':
      return f(ft.value, z);

    case 'deep': {
      const suffix = ft.suffix.reduceRight((r, x) => f(x, r), z);
      const deep = foldRight_(ft.deep, suffix, (n, result) =>
        n.reduceRight((r, x) => f(x, r), result),
      );
      return ft.prefix.reduceRight((r, x) => f(x, r), deep);
    }
  }
};

// -- Private implementation

const _nodes = <A>(xs: A[]): Node<A>[] => {
  switch (xs.length) {
    case 0:
    case 1:
      throw new Error('Not enough elements for nodes');
    case 2: {
      const [x, y] = xs;
      return [[x, y]];
    }
    case 3: {
      const [x, y, z] = xs;
      return [[x, y, z]];
    }
    default: {
      const [x, y, ...rest] = xs;
      return [[x, y], ..._nodes(rest)];
    }
  }
};

const _concatWithMiddle = <A>(
  lhs: Vector<A>,
  m: A[],
  rhs: Vector<A>,
): Vector<A> => {
  const left = toTree(lhs);
  const right = toTree(rhs);

  if (left.tag === 'empty' && m.length === 0) return right;
  if (left.tag === 'empty') {
    const [x, ...xs] = m;
    return prepend_(_concatWithMiddle(Empty, xs, right), x);
  }
  if (left.tag === 'single')
    return prepend_(_concatWithMiddle(Empty, m, right), left.value);

  if (right.tag === 'empty' && m.length === 0) return left;
  if (right.tag === 'empty') {
    const [last, init] = [m[m.length - 1], m.slice(0, m.length - 1)];
    return append_(_concatWithMiddle(left, init, Empty), last);
  }
  if (right.tag === 'single')
    return append_(_concatWithMiddle(left, m, Empty), right.value);

  const mid = _nodes([...left.suffix, ...m, ...right.prefix]);
  const deep = _concatWithMiddle(left.deep, mid, right.deep);
  return new Deep(left.prefix, deep, right.suffix);
};
