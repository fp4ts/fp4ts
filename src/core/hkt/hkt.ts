export interface HKT<F, A> {
  _F: F;
  _A: A;
}

export interface HKT2<F, E, A> extends HKT<F, E> {
  _E: E;
}

export interface HKT3<F, R, E, A> extends HKT2<F, E, A> {
  _R: R;
}

export interface HKT4<F, S, R, E, A> extends HKT3<F, R, E, A> {
  _S: S;
}

export interface URItoKind<FC, S, R, E, A> {
  ['HKT1']: HKT<FC, A>;
  ['HKT2']: HKT2<FC, E, A>;
  ['HKT3']: HKT3<FC, R, E, A>;
  ['HKT4']: HKT4<FC, S, R, E, A>;
}

export type CoercedURIS = keyof URItoKind<any, any, any, any, any>;
