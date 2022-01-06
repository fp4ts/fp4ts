import { Http } from '@fp4ts/http-core';

export type Handler<F> = Http<F, F>;
