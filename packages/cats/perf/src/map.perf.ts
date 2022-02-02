import { suite, add, cycle, configure } from 'benny';
import { Ord } from '@fp4ts/cats-core';
import { Map } from '@fp4ts/cats-core/lib/data';

function makeSuite(size: number) {
  const nums = [...new Array(size).keys()].map((_, i) => i);
  const perm = nums.map(() => (Math.random() * size) | 0);

  const numPs = nums.map(x => [x, x] as [number, number]);
  const permPs = nums.map(x => [x, x] as [number, number]);
  const map = Map.fromArray(Ord.primitive)(numPs);
  const mapr = Map.fromArray(Ord.primitive)(permPs);

  return [
    add(`fromArray (${size})`, () => {
      Map.fromArray(Ord.primitive)(numPs);
    }),

    add(`fromArray random (${size})`, () => {
      Map.fromArray(Ord.primitive)(numPs);
    }),

    add(`lookup identity (${size})`, () => {
      for (let i = 0; i < size; i++) {
        map.lookup(i);
      }
    }),

    add(`lookup random (${size})`, () => {
      for (let i = 0; i < size; i++) {
        map.lookup(perm[i]);
      }
    }),

    add(`insert (${size})`, () => {
      let m: Map<number, number> = Map.empty;
      for (let i = 0; i < size; i++) {
        m = m.insert(i, i);
      }
    }),
    add(`insert random (${size})`, () => {
      let m: Map<number, number> = Map.empty;
      for (let i = 0; i < size; i++) {
        m = m.insert(perm[i], perm[i]);
      }
    }),

    add(`forEach (${size})`, () => {
      let x = 0;
      map.forEach(y => (x += y));
    }),

    add(`filter keep (${size})`, () => {
      map.filter(() => true);
    }),
    add(`filter drop (${size})`, () => {
      map.filter(() => false);
    }),
    add(`filter partial (${size})`, () => {
      map.filter(x => x % 2 === 0);
    }),

    add(`union identity (${size})`, () => {
      map.union(map);
    }),
    add(`union random (${size})`, () => {
      map.union(mapr);
    }),
    add(`intersect identity (${size})`, () => {
      map.intersect(map);
    }),
    add(`intersect random (${size})`, () => {
      map.intersect(mapr);
    }),
    add(`difference identity (${size})`, () => {
      map.difference(map);
    }),
    add(`difference random (${size})`, () => {
      map.difference(mapr);
    }),
  ];
}

suite(
  'Map',
  ...[0, 1, 10, 100, 1_000, 10_000].flatMap(makeSuite),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
