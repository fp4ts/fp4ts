// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Measured } from './measured';
import { FingerTree, Node, view } from './algebra';

export const fingerTreeMeasured = <A, V>(
  M: Measured<A, V>,
): Measured<FingerTree<V, A>, V> => ({
  monoid: M.monoid,
  measure: v => {
    const ft = view(v);

    switch (ft.tag) {
      case 'empty':
        return M.monoid.empty;

      case 'single':
        return M.measure(ft.value);

      case 'deep':
        return ft.annotation;
    }
  },
});

export const nodeMeasured = <A, V>(
  M: Measured<A, V>,
): Measured<Node<V, A>, V> => ({
  monoid: M.monoid,

  measure: ([v]) => v,
});

export const listMeasured = <V, A>(M: Measured<A, V>): Measured<A[], V> => ({
  monoid: M.monoid,
  measure: (xs: A[]): V =>
    xs
      .map(M.measure)
      .reduce((x, y) => M.monoid.combine_(x, () => y), M.monoid.empty),
});
