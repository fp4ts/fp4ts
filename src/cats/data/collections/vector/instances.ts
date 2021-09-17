import { Monoid } from '../../../monoid';
import { FingerTree } from '../finger-tree';
import { fingerTreeMeasured } from '../finger-tree/instances';
import { Measured } from '../finger-tree/measured';

import { Size } from './algebra';

export const sizeMonoid: Monoid<Size> = {
  empty: 0,
  combine: y => x => x + y,
  combine_: (x, y) => x + y,
};

export const sizeMeasured: Measured<any, Size> = {
  monoid: sizeMonoid,
  measure: () => 1,
};

export const fingerTreeSizeMeasured: Measured<
  FingerTree<Size, any>,
  Size
> = fingerTreeMeasured(sizeMeasured);
