import { List, Either, Reader } from '../../cats/data';

export interface TyK<F extends URIS, Tvs extends unknown[]> {
  _F: F;
  _Tvs: Tvs;
}

export type AnyK = TyK<any, any>;

declare const _: unique symbol;
export type _ = typeof _;

// prettier-ignore
type ApplyHeadTypeTable<Tvs extends unknown[], Tys extends unknown[]> = {
  0:  Tvs;
  1:  [Tvs, Tys] extends [[_, ...infer Tail], [infer A0]] ? [A0, ...Tail] : never;
  2:  [Tvs, Tys] extends [[_, _, ...infer Tail], [infer A0, infer A1]] ? [A0, A1, ...Tail] : never;
  3:  [Tvs, Tys] extends [[_, _, _, ...infer Tail], [infer A0, infer A1, infer A2]] ? [A0, A1, A2, ...Tail] : never;
  4:  [Tvs, Tys] extends [[_, _, _, _, ...infer Tail], [infer A0, infer A1, infer A2, infer A3]] ? [A0, A1, A2, A3, ...Tail] : never;
  5:  [Tvs, Tys] extends [[_, _, _, _, _, ...infer Tail], [infer A0, infer A1, infer A2, infer A3, infer A4]] ? [A0, A1, A2, A3, A4, ...Tail] : never;
  6:  [Tvs, Tys] extends [[_, _, _, _, _, _, ...infer Tail], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5]] ? [A0, A1, A2, A3, A4, A5, ...Tail] : never;
  7:  [Tvs, Tys] extends [[_, _, _, _, _, _, _, ...infer Tail], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6]] ? [A0, A1, A2, A3, A4, A5, A6, ...Tail] : never;
  8:  [Tvs, Tys] extends [[_, _, _, _, _, _, _, _, ...infer Tail], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7]] ? [A0, A1, A2, A3, A4, A5, A6, A7, ...Tail] : never;
  9:  [Tvs, Tys] extends [[_, _, _, _, _, _, _, _, _, ...infer Tail], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7, infer A8]] ? [A0, A1, A2, A3, A4, A5, A6, A7, A8, ...Tail] : never;
  10: [Tvs, Tys] extends [[_, _, _, _, _, _, _, _, _, _, ...infer Tail], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7, infer A8, infer A9]] ? [A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, ...Tail] : never;
};

// prettier-ignore
type ApplyTailTypeTable<Tvs extends unknown[], Tys extends unknown[]> = {
  0:  Tvs;
  1:  [Tvs, Tys] extends [[...infer Head, _], [infer A0]] ? [...Head, A0] : never;
  2:  [Tvs, Tys] extends [[...infer Head, _, _], [infer A0, infer A1]] ? [...Head, A0, A1] : never;
  3:  [Tvs, Tys] extends [[...infer Head, _, _, _], [infer A0, infer A1, infer A2]] ? [...Head, A0, A1, A2] : never;
  4:  [Tvs, Tys] extends [[...infer Head, _, _, _, _], [infer A0, infer A1, infer A2, infer A3]] ? [...Head, A0, A1, A2, A3] : never;
  5:  [Tvs, Tys] extends [[...infer Head, _, _, _, _, _], [infer A0, infer A1, infer A2, infer A3, infer A4]] ? [...Head, A0, A1, A2, A3, A4] : never;
  6:  [Tvs, Tys] extends [[...infer Head, _, _, _, _, _, _], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5]] ? [...Head, A0, A1, A2, A3, A4, A5] : never;
  7:  [Tvs, Tys] extends [[...infer Head, _, _, _, _, _, _, _], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6]] ? [...Head, A0, A1, A2, A3, A4, A5, A6] : never;
  8:  [Tvs, Tys] extends [[...infer Head, _, _, _, _, _, _, _, _], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7]] ? [...Head, A0, A1, A2, A3, A4, A5, A6, A7] : never;
  9:  [Tvs, Tys] extends [[...infer Head, _, _, _, _, _, _, _, _, _], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7, infer A8]] ? [...Head, A0, A1, A2, A3, A4, A5, A6, A7, A8] : never;
  10: [Tvs, Tys] extends [[...infer Head, _, _, _, _, _, _, _, _, _, _], [infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7, infer A8, infer A9]] ? [...Head, A0, A1, A2, A3, A4, A5, A6, A7, A8, A9] : never;
};

// prettier-ignore
type ApplyTyK<Tvs extends unknown[], Tys extends unknown[]> =
  Tys extends { length: infer L }
    ? L extends keyof ApplyHeadTypeTable<any, any>
      ? ApplyHeadTypeTable<Tvs, Tys>[L]
      : never
    : never;

// prettier-ignore
type $<K extends AnyK, Tys extends unknown[]> =
  [K] extends [TyK<infer F, infer Tvs>]
    ? TyK<F, ApplyTyK<Tvs, Tys>>
    : never;

// prettier-ignore
type ApplyKind<Tvs extends unknown[], Tys extends unknown[]> =
  Tys extends { length: infer L }
    ? L extends keyof ApplyTailTypeTable<any, any>
      ? ApplyTailTypeTable<Tvs, Tys>[L]
      : never
    : never;

// prettier-ignore
type Kind<K extends AnyK, Tys extends unknown[]> =
  [K] extends [TyK<infer F, infer Tvs>]
    ? URItoKind<ApplyKind<Tvs, Tys>>[F]
    : never;

type URIS = keyof URItoKind<any>;

const ListURI = 'cats/data/list';
type ListURI = typeof ListURI;
type ListK = TyK<ListURI, [_]>;

const EitherURI = 'cats/data/either';
type EitherURI = typeof EitherURI;
type EitherK = TyK<EitherURI, [_, _]>;

const ReaderURI = 'cats/data/reader';
type ReaderURI = typeof ReaderURI;
type ReaderK = TyK<ReaderURI, [_, _]>;

interface URItoKind<Tvs extends unknown[]> {
  [ListURI]: List<Tvs[0]>;
  [EitherURI]: Either<Tvs[0], Tvs[1]>;
  [ReaderURI]: Reader<Tvs[0], Tvs[1]>;
}

interface Functor<F extends AnyK> {
  map: <A, B>(fa: Kind<F, [A]>, f: (a: A) => B) => Kind<F, [B]>;
}

const listFunctor: Functor<ListK> = {
  map: (fa, f) => fa.map(f),
};

const eitherFunctor: <E>() => Functor<$<EitherK, [E]>> = () => ({
  map: (fa, f) => fa.map(f),
});

const readerFunctor: <R>() => Functor<$<ReaderK, [R]>> = () => ({
  map: (fa, f) => fa.map(f),
});

interface Apply<F extends AnyK> extends Functor<F> {
  ap: <A, B>(ff: Kind<F, [(a: A) => B]>, fa: Kind<F, [A]>) => Kind<F, [B]>;
}

const listApply: Apply<ListK> = {
  ...listFunctor,
  ap: (ff, fa) => ff.flatMap(f => fa.map(a => f(a))),
};

const eitherApply: <E>() => Apply<$<EitherK, [E]>> = () => ({
  ...eitherFunctor(),
  ap: (ff, fa) => ff.flatMap(f => fa.map(a => f(a))),
});

export const readerApply: <R>() => Apply<$<ReaderK, [R]>> = () => ({
  ...readerFunctor(),
  ap: (ff, fa) => ff.flatMap(f => fa.map(a => f(a))),
});
