export interface HKT<F, A> {
  _F: F;
  _A: A;
}

export interface HKT2<F, E, A> extends HKT<F, A> {
  _E: E;
}

export interface HKT3<F, R, E, A> extends HKT2<F, E, A> {
  _R: R;
}

export interface HKT4<F, S, R, E, A> extends HKT3<F, R, E, A> {
  _S: S;
}

export interface URItoKind<Tys extends unknown[]> {
  ['HKT1']: HKT<'HKT1', Tys[0]>;
  ['HKT2']: HKT2<'HKT2', Tys[0], Tys[1]>;
  ['HKT3']: HKT3<'HKT3', Tys[0], Tys[1], Tys[2]>;
  ['HKT4']: HKT4<'HKT4', Tys[0], Tys[1], Tys[2], Tys[3]>;
}

export type URIS = keyof URItoKind<any>;
