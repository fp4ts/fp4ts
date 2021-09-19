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
    xs.map(M.measure).reduce(M.monoid.combine_, M.monoid.empty),
});
