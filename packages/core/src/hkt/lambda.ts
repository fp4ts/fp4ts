/* eslint-disable @typescript-eslint/ban-types */
import { _, α, β, TParam } from './hole';
import { AnyK, TyK } from './ctor';
import { Kind } from './kind';

// prettier-ignore
export type λ<Args extends TParam[], R extends AnyK> =
  Args extends { length: infer L }
    ? L extends keyof ArgumentsToTypeVariables
      ? TyK<LambdaURI, [Lambda<Args, R>, ...ArgumentsToTypeVariables[L]]>
      : never
    : never;

type ArgumentsToTypeVariables = {
  0: [];
  1: [_];
  2: [_, _];
};

type Lambda<Args extends TParam[], R extends AnyK> = {
  Lambda: {
    _Args: Args;
    _R: R;
  };
};

// prettier-ignore
type ApplyLambda<L extends Lambda<any, any>, Tys extends unknown[]> =
  [L] extends [Lambda<infer Args, infer Result>]
    ? Args extends { length: infer L }
      ? L extends keyof BuildArgsTable<Args>
        ? ApplyArgs<Result, BuildArgsTable<Tys>[L]>
        : never
      : never
    : never;

// prettier-ignore
type BuildArgsTable<Tys extends unknown[]> = {
  0: {},
  1: Tys extends [infer A] ? { [α]: A } : never;
  2: Tys extends [infer A, infer B] ? { [α]: A, [β]: B } : never;
};

type ArgsTable = {} | { [α]: any } | { [α]: any; [β]: any };

// https://github.com/pelotom/hkts/blob/master/src/index.ts
// prettier-ignore
type ApplyArgs<Result, Args extends ArgsTable> = (
  Result extends keyof Args
    ? { [indirect]: Args[Result] }
  : Result extends TyK<infer F, infer Tvs>
    ? Tvs extends { length: infer L }
      ? L extends keyof TupleTable<Tvs, Args>
        ? { [indirect]: Kind<TyK<F, TupleTable<Tvs, Args>[L]>, []> }
        : never
  : Result extends unknown[] & { length: infer L }
    ? L extends keyof TupleTable<Result, Args>
      ? { [indirect]: TupleTable<Result, Args>[L] }
      : never
  : Result extends (infer A)[]
    ? { [indirect]: ApplyArgs<A, Args>[] }
    : never
  : Result extends object
    ? { [indirect]: { [k in keyof Result]: ApplyArgs<Result[k], Args> } }
  : { [indirect]: Result }
)[typeof indirect];

declare const indirect: unique symbol;

// prettier-ignore
type TupleTable<T extends unknown[], Args extends ArgsTable> = {
  0: T;
  1: T extends [infer A0] ? [ApplyArgs<A0, Args>] : never;
  2: T extends [infer A0, infer A1] ? [ApplyArgs<A0, Args>, ApplyArgs<A1, Args>] : never;
  3: T extends [infer A0, infer A1, infer A2] ? [ApplyArgs<A0, Args>, ApplyArgs<A1, Args>, ApplyArgs<A2, Args>] : never;
}

// Make Lambda a HKT

const LambdaURI = 'core/hkt/lambda-type';
type LambdaURI = typeof LambdaURI;

declare module './hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [LambdaURI]: Tys extends [Lambda<any, any>, ...infer Rest]
      ? ApplyLambda<Tys[0], Rest>
      : any;
  }
}
