import { _ } from './hole';
import { URIS } from './hkt';

export interface TyK<F extends URIS, Tvs extends unknown[]> {
  TypeConstructor: {
    _F: F;
    _Tvs: Tvs;
  };
}

export type AnyK = TyK<any, any>;

// prettier-ignore
export type $<K extends AnyK, Tys extends unknown[]> = TCtor<K, Tys>

// prettier-ignore
export type TCtor<K extends AnyK, Tys extends unknown[]> =
  [K] extends [TyK<infer F, infer Tvs>] ? TyK<F, ApplyTyK<Tvs, Tys>> : never;

// prettier-ignore
type ApplyTyK<Tvs extends unknown[], Tys extends unknown[]> =
  Tvs extends [_, ...unknown[]]
    ? Tys extends { length: infer L }
      ? L extends keyof ApplyHeadTypeTable<any, any>
        ? ApplyHeadTypeTable<Tvs, Tys>[L]
        : never
      : never
    : Tvs extends [infer A, ...infer Tvs2]
      ? [A, ...ApplyTyK<Tvs2, Tys>]
      : never;

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
