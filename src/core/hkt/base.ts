import { AnyK } from './ty-ctor';

export interface Base<F extends AnyK> {
  _F: F;
}
