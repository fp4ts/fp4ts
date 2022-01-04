import { Kleisli } from '@fp4ts/cats';
import { Request } from './messages/request';
import { Response } from './messages/response';

export type Http<F, G> = Kleisli<F, Request<G>, Response<G>>;
