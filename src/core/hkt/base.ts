import { AnyK } from './ctor';

export interface Base<F extends AnyK> {
  _F: F;
}
