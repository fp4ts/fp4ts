import { _ } from './hole';
import { URItoKind } from './hkt';
import { AnyK, TyK } from './ctor';

// prettier-ignore
export type Kind<K extends AnyK, Tys extends unknown[]> =
  [K] extends [TyK<infer F, infer Tvs>] ? URItoKind<ApplyKind<Tvs, Tys>>[F] : never;

// prettier-ignore
type ApplyKind<Tvs extends unknown[], Tys extends unknown[]> =
  Tys extends { length: infer L }
    ? L extends keyof ApplyTailTypeTable<any, any>
      ? ApplyTailTypeTable<Tvs, Tys>[L]
      : never
    : never;

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
