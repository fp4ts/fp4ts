import { $ } from '@fp4ts/core';
import { OptionTK } from '@fp4ts/cats';
import { Http } from './http';

export type HttpRoutes<F> = Http<$<OptionTK, [F]>, F>;
