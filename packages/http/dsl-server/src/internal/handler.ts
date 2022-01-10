import { EitherK, EitherT } from '@fp4ts/cats';
import { $type, Fix, TyK, TyVar, α, β, λ } from '@fp4ts/core';
import { MessageFailure } from '@fp4ts/http-core';

export type Handler<F, A> = EitherT<F, MessageFailure, A>;

export interface HandlerK extends TyK<[unknown, unknown]> {
  [$type]: Handler<TyVar<this, 0>, TyVar<this, 1>>;
}
