import { Hashable } from '../../../hashable';
import { List } from '../list';
import { Empty, Map } from './algebra';
import { insert_ } from './operators';

export const empty: Map<never, never> = Empty;

export const of =
  <K2>(H: Hashable<K2>) =>
  <K extends K2, V>(...xs: [K, V][]): Map<K2, V> =>
    fromArray(H)(xs);

export const fromArray =
  <K2>(H: Hashable<K2>) =>
  <K extends K2, V>(xs: [K, V][]): Map<K2, V> =>
    xs.reduce((m, [k, v]) => insert_(H, m, k, v), empty as Map<K2, V>);

export const fromList =
  <K2>(H: Hashable<K2>) =>
  <K extends K2, V>(xs: List<[K, V]>): Map<K2, V> =>
    xs.foldLeft(empty as Map<K2, V>, (m, [k, v]) => insert_(H, m, k, v));

export const m: Map<number, number> = empty;
