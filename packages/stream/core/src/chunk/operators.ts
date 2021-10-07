import { AnyK, Kind, pipe } from '@cats4ts/core';
import {
  List,
  None,
  Option,
  Some,
  Vector,
  Applicative,
  Eval,
} from '@cats4ts/cats';

import { ok as assert } from 'assert';
import {
  ArrayChunk,
  ArraySlice,
  Chunk,
  EmptyChunk,
  Queue,
  SingletonChunk,
  view,
} from './algebra';
import { emptyQueue, fromArray, fromList } from './constructor';

export const isEmpty = <O>(c: Chunk<O>): boolean => c === EmptyChunk;
export const nonEmpty = <O>(c: Chunk<O>): boolean => c !== EmptyChunk;

export const size = <O>(c: Chunk<O>): number => c.size;

export const lastOption: <O>(c: Chunk<O>) => Option<O> = c => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return None;
    case 'singleton':
      return Some(v.value);
    case 'array':
      return Some(v.array[v.array.length - 1]);
    case 'slice':
      return Some(v.values[v.offset + v.length - 1]);
    case 'queue':
      return lastOption(v.queue.last);
  }
};

export const take: (n: number) => <O>(c: Chunk<O>) => Chunk<O> = n => c =>
  take_(c, n);

export const takeRight: (n: number) => <O>(c: Chunk<O>) => Chunk<O> = n => c =>
  takeRight_(c, n);

export const drop: (n: number) => <O>(c: Chunk<O>) => Chunk<O> = n => c =>
  drop_(c, n);

export const dropRight: (n: number) => <O>(c: Chunk<O>) => Chunk<O> = n => c =>
  dropRight_(c, n);

export const findIndex: <O>(
  pred: (o: O) => boolean,
) => (c: Chunk<O>) => Option<number> = pred => c => findIndex_(c, pred);

export const elem: (idx: number) => <O>(c: Chunk<O>) => O = idx => c =>
  elem_(c, idx);

export const slice: (
  offset: number,
  until: number,
) => <O>(c: Chunk<O>) => Chunk<O> = (offset, until) => c =>
  slice_(c, offset, until);

export const splitAt: (
  idx: number,
) => <O>(c: Chunk<O>) => [Chunk<O>, Chunk<O>] = idx => c => splitAt_(c, idx);

export const concat: <O2>(
  c2: Chunk<O2>,
) => <O extends O2>(c1: Chunk<O>) => Chunk<O2> = c2 => c1 => concat_(c1, c2);

export const filter: <O>(pred: (o: O) => boolean) => (c: Chunk<O>) => Chunk<O> =
  pred => c => filter_(c, pred);

export const collect: <O, O2>(
  f: (o: O) => Option<O2>,
) => (c: Chunk<O>) => Chunk<O2> = f => c => collect_(c, f);

export const map: <O, O2>(f: (o: O) => O2) => (c: Chunk<O>) => Chunk<O2> =
  f => c =>
    map_(c, f);

export const mapAccumulate: <S>(
  s: S,
) => <O, O2>(f: (s: S, o: O) => [S, O2]) => (c: Chunk<O>) => [S, Chunk<O2>] =
  s => f => c =>
    mapAccumulate_(c, s, f);

export const forEach: <O>(f: (o: O) => void) => (c: Chunk<O>) => void =
  f => c =>
    forEach_(c, f);

export const foldLeft: <O, O2>(
  z: O2,
  f: (o2: O2, o: O) => O2,
) => (c: Chunk<O>) => O2 = (z, f) => c => foldLeft_(c, z, f);

export const scanLeftCarry: <O, O2>(
  z: O2,
  f: (o2: O2, o: O) => O2,
) => (c: Chunk<O>) => [Chunk<O2>, O2] = (z, f) => c => scanLeftCarry_(c, z, f);

export const zipWith: <O1, O2, O3>(
  c2: Chunk<O2>,
  f: (o1: O1, o2: O2) => O3,
) => (c1: Chunk<O1>) => Chunk<O3> = (c2, f) => c1 => zipWith_(c1, c2, f);

export const toArray = <O>(c: Chunk<O>): O[] => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return [];
    case 'singleton':
      return [v.value];
    case 'array':
      return v.array;
    case 'slice':
      return v.values.slice(v.offset, v.offset + v.length);
    case 'queue': {
      const arr: O[] = new Array(v.size);
      let i = 0;
      v.queue.foldLeft(undefined, (_, c) => {
        for (let j = 0, len = c.size; j < len; j++, i++) {
          arr[i] = elem_(c, j);
        }
        return undefined;
      });
      return arr;
    }
  }
};

export const traverse: <F extends AnyK>(
  F: Applicative<F>,
) => <O, O2>(
  f: (o: O) => Kind<F, [O2]>,
) => (c: Chunk<O>) => Kind<F, [Chunk<O2>]> = F => f => c => traverse_(F)(c, f);

export const toList: <O>(c: Chunk<O>) => List<O> = c =>
  List.fromArray(toArray(c));

export const toVector: <O>(c: Chunk<O>) => Vector<O> = c =>
  Vector.fromArray(toArray(c));

// -- Point-ful operators

export const take_ = <O>(c: Chunk<O>, n: number): Chunk<O> => {
  const v = view(c);
  if (n <= 0) return EmptyChunk;
  if (n >= c.size) return c;

  switch (v.tag) {
    case 'empty':
    case 'singleton':
      return v;
    case 'array':
      return new ArraySlice(v.array, 0, n);

    case 'slice':
      return new ArraySlice(v.values, v.offset, n);

    case 'queue': {
      let head: Chunk<O>;
      let chunks = v.queue;
      let offset = n;
      while (true) {
        [head, chunks] = chunks.popHead.get;
        if (offset <= head.size) return take_(head, offset);
        offset -= head.size;
      }
    }
  }
};

export const takeRight_ = <O>(c: Chunk<O>, n: number): Chunk<O> => {
  const v = view(c);
  if (n <= 0) return EmptyChunk;
  if (n >= c.size) return c;

  switch (v.tag) {
    case 'empty':
    case 'singleton':
      return v;
    case 'array':
      return new ArraySlice(v.array, v.array.length - n, n);

    case 'slice':
      return new ArraySlice(v.values, v.offset + v.length - n, n);

    case 'queue': {
      let last: Chunk<O>;
      let chunks = v.queue;
      let offset = n;
      while (true) {
        [last, chunks] = chunks.popLast.get;
        if (offset <= last.size) return takeRight_(last, offset);
        offset -= last.size;
      }
    }
  }
};

export const drop_ = <O>(c: Chunk<O>, n: number): Chunk<O> => {
  const s = size(c);
  const v = view(c);
  if (n <= 0) return c;
  if (n >= s) return EmptyChunk;

  switch (v.tag) {
    case 'empty':
    case 'singleton':
      return EmptyChunk;
    case 'array':
      return new ArraySlice(v.array, n, v.array.length - n);
    case 'slice':
      return new ArraySlice(v.values, v.offset + n, v.length - n);
    case 'queue': {
      let head: Chunk<O>;
      let chunks = v.queue;
      let offset = n;
      let size = v.size;
      while (true) {
        [head, chunks] = chunks.popHead.get;
        size -= head.size;
        if (head.size <= offset)
          return concat_(drop_(head, offset), new Queue(chunks, size));
        offset -= head.size;
      }
    }
  }
};

export const dropRight_ = <O>(c: Chunk<O>, n: number): Chunk<O> => {
  const v = view(c);
  if (n <= 0) return c;
  if (n >= c.size) return EmptyChunk;

  switch (v.tag) {
    case 'empty':
    case 'singleton':
      return EmptyChunk;
    case 'array':
      return new ArraySlice(v.array, 0, v.array.length - n);
    case 'slice':
      return new ArraySlice(v.values, v.offset, v.length - n);
    case 'queue': {
      let last: Chunk<O>;
      let chunks = v.queue;
      let offset = n;
      let size = v.size;
      while (true) {
        [last, chunks] = chunks.popLast.get;
        size -= last.size;
        if (last.size <= offset)
          return concat_(dropRight_(last, offset), new Queue(chunks, size));
        offset -= last.size;
      }
    }
  }
};

export const findIndex_ = <O>(
  c: Chunk<O>,
  pred: (o: O) => boolean,
): Option<number> => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return None;
    case 'singleton':
      return pred(v.value) ? Some(0) : None;
    case 'array': {
      const idx = v.array.findIndex(o => pred(o));
      return idx < 0 ? None : Some(idx);
    }
    case 'slice':
      for (let i = 0, len = v.size; i < len; i++) {
        if (pred(v.values[v.offset + i])) {
          return Some(i);
        }
      }
      return None;
    case 'queue': {
      let head: Chunk<O>;
      let chunks = v.queue;
      let offset = 0;
      while (true) {
        const popped = chunks.popHead;
        if (popped.isEmpty) return None;
        [head, chunks] = popped.get;

        const idxD = findIndex_(head, pred);
        if (idxD.nonEmpty) return idxD.map(i => i + offset);
        offset += head.size;
      }
    }
  }
};

export const elem_ = <O>(c: Chunk<O>, idx: number): O => {
  assert(idx < size(c), 'Chunk.elem IndexOutOfBounds');
  const v = view(c);
  switch (v.tag) {
    case 'array':
      return v.array[idx];
    case 'singleton':
      return v.value;
    case 'slice':
      return v.values[v.offset + idx];
    case 'queue': {
      let head: Chunk<O>;
      let chunks = v.queue;
      let offset = idx;
      while (true) {
        [head, chunks] = chunks.popHead.get;
        if (offset < head.size) return elem_(head, offset);
        offset -= head.size;
      }
    }
    default:
      throw new Error('Empty chunk cannot be indexed');
  }
};

export const slice_ = <O>(
  c: Chunk<O>,
  offset: number,
  until: number,
): Chunk<O> => pipe(c, drop(offset), take(until - offset));

export const splitAt_ = <O>(c: Chunk<O>, n: number): [Chunk<O>, Chunk<O>] => {
  if (n <= 0) return [EmptyChunk, EmptyChunk];
  if (n >= c.size) return [c, EmptyChunk];
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return [EmptyChunk, EmptyChunk];
    case 'singleton':
      return [v, EmptyChunk];
    case 'array':
      return [
        new ArraySlice(v.array, 0, n),
        new ArraySlice(v.array, n, v.array.length - n),
      ];
    case 'slice':
      return [
        new ArraySlice(v.values, v.offset, n),
        new ArraySlice(v.values, v.offset + n, v.length - n),
      ];
    case 'queue': {
      let prefix: Chunk<O> = emptyQueue;
      let head: Chunk<O>;
      let chunks = v.queue;
      let offset = n;
      let size = v.size;

      while (true) {
        [head, chunks] = chunks.popHead.get;
        size -= head.size;
        if (offset < head.size) {
          const [pfx, sfx] = splitAt_(head, offset);
          return [concat_(prefix, pfx), concat_(sfx, new Queue(chunks, size))];
        }
        offset -= head.size;
        prefix = concat_(prefix, head);
      }
    }
  }
};

export const concat_ = <O>(c1: Chunk<O>, c2: Chunk<O>): Chunk<O> => {
  if (isEmpty(c1)) return c2;
  if (isEmpty(c2)) return c1;
  const v1 = view(c1);
  const v2 = view(c2);

  switch (v1.tag) {
    case 'queue':
      return new Queue(v1.queue.append(v2), v1.size + v2.size);

    default:
      switch (v2.tag) {
        case 'queue':
          return new Queue(v2.queue.prepend(v1), v1.size + c2.size);
        default:
          return new Queue(Vector(v1, v2), v1.size + v2.size);
      }
  }
};

export const filter_ = <O>(c: Chunk<O>, pred: (o: O) => boolean): Chunk<O> => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return EmptyChunk;
    case 'singleton':
      return pred(v.value) ? v : EmptyChunk;
    case 'array':
      return fromArray(v.array.filter(o => pred(o)));
    case 'slice': {
      const results: O[] = [];
      for (let i = v.offset, len = v.offset + v.length; i < len; i++) {
        if (pred(v.values[i])) results.push(v.values[i]);
      }
      return fromArray(results);
    }
    case 'queue': {
      let results: Chunk<O> = EmptyChunk;
      let head: Chunk<O>;
      let chunks = v.queue;
      while (true) {
        const r = chunks.popHead;
        if (r.isEmpty) return results;
        [head, chunks] = r.get;
        results = concat_(results, filter_(head, pred));
      }
    }
  }
};

export const collect_ = <O, O2>(
  c: Chunk<O>,
  f: (o: O) => Option<O2>,
): Chunk<O2> => {
  const results: O2[] = [];
  for (let i = 0, len = c.size; i < len; i++) {
    f(elem_(c, i)).fold(
      () => {},
      o => results.push(o),
    );
  }
  return fromArray(results);
};

export const map_ = <O, O2>(c: Chunk<O>, f: (o: O) => O2): Chunk<O2> => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return EmptyChunk;
    case 'singleton':
      return new SingletonChunk(f(v.value));
    case 'array':
      return new ArrayChunk(v.array.map(x => f(x)));
    case 'slice':
    case 'queue': {
      const size = v.size;
      const result: O2[] = new Array(size);
      for (let i = 0; i < size; i++) {
        result[i] = f(elem_(c, i));
      }
      return new ArrayChunk(result);
    }
  }
};

export const mapAccumulate_ = <S, O, O2>(
  c: Chunk<O>,
  s: S,
  f: (s: S, o: O) => [S, O2],
): [S, Chunk<O2>] => {
  const result: O2[] = new Array(c.size);
  let cur = s;
  let idx = 0;
  forEach_(c, o => {
    [cur, result[idx++]] = f(cur, o);
  });
  return [cur, fromArray(result)];
};

export const forEach_ = <O>(c: Chunk<O>, f: (o: O) => void): void => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return;
    case 'singleton':
      return f(v.value);
    case 'array':
      return v.array.forEach(x => f(x));
    case 'slice':
      for (let i = 0, len = v.size; i < len; i++) {
        f(v.values[v.offset + i]);
      }
      return;
    case 'queue':
      return v.queue.forEach(c => forEach_(c, f));
  }
};

export const foldLeft_ = <O, B>(
  c: Chunk<O>,
  init: B,
  f: (b: B, o: O) => B,
): B => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return init;
    case 'singleton':
      return f(init, v.value);
    case 'array':
      return v.array.reduce((b, o) => f(b, o), init);
    case 'slice':
      let ret: B = init;
      for (let i = 0, len = v.values.length; i < len; i++) {
        ret = f(ret, v.values[i]);
      }
      return ret;
    case 'queue':
      return v.queue.foldLeft(init, (b, c) => foldLeft_(c, b, f));
  }
};

export const scanLeftCarry_ = <O, O2>(
  c: Chunk<O>,
  z: O2,
  f: (o2: O2, o: O) => O2,
): [Chunk<O2>, O2] => {
  const results: O2[] = new Array(c.size);
  let carry = z;
  let i = 0;

  forEach_(c, x => {
    carry = f(carry, x);
    results[i] = carry;
    i += 1;
  });

  return [fromArray(results), carry];
};

export const zipWith_ = <O1, O2, O3>(
  c1: Chunk<O1>,
  c2: Chunk<O2>,
  f: (o1: O1, o2: O2) => O3,
): Chunk<O3> => {
  if (c1 === EmptyChunk || c2 === EmptyChunk) return EmptyChunk;
  const size = Math.min(c1.size, c2.size);
  const result: O3[] = new Array(size);
  for (let i = 0; i < size; i++) {
    result[i] = f(elem_(c1, i), elem_(c2, i));
  }
  return new ArrayChunk(result);
};

export const traverse_ =
  <F extends AnyK>(F: Applicative<F>) =>
  <O, O2>(c: Chunk<O>, f: (o: O) => Kind<F, [O2]>): Kind<F, [Chunk<O2>]> => {
    if (c.isEmpty) return F.pure(EmptyChunk);

    // Max width of the tree -- max depth log_128(c.size)
    const width = 128;

    const loop = (start: number, end: number): Eval<Kind<F, [Chunk<O2>]>> => {
      if (end - start <= width) {
        // We've entered leaves of the tree
        let first = F.map_(f(elem_(c, end - 1)), o2 => List(o2));
        for (let idx = end - 2; start <= idx; idx--) {
          first = F.map2_(f(elem_(c, idx)), first)((h, t) => t.prepend(h));
        }
        return Eval.now(F.map_(first, fromList));
      } else {
        const step = ((end - start) / width) | 0;

        let fvector = Eval.defer(() => loop(start, start + step));

        for (
          let start0 = start + step, end0 = start0 + end;
          start0 < end;
          start0 += step, end0 += step
        ) {
          const end1 = Math.min(end, end0);
          const start1 = start0;
          fvector = fvector.flatMap(fv =>
            F.map2Eval_(
              fv,
              Eval.defer(() => loop(start1, end1)),
            )(concat_),
          );
        }
        return fvector;
      }
    };

    return loop(0, c.size).value;
  };
