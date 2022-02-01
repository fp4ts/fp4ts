import { Set, Map } from '@fp4ts/cats-core/lib/data';

describe.skip('set', () => {
  it('should convert values from array to array', () => {
    expect(Set.fromArray([1, 2, 3, 4, 5]).toArray).toEqual([1, 2, 3, 4, 5]);
  });

  it('should omit duplicate elements', () => {
    let xs = Set.empty as Set<number>;
    for (let i = 0; i < 10; i++) {
      xs = xs.insert(i);
    }
    for (let i = 0; i < 10; i++) {
      xs = xs.remove(i);
    }
    expect(xs.toArray).toEqual([]);
  });

  // it('should insert 100k elements', () => {
  //   let xs: Set<number> = Set.empty;
  //   for (let i = 0; i < 100_000; i++) {
  //     xs = xs.insert(i);
  //   }
  // });

  // it('should insert 1M elements', () => {
  //   let xs: Set<number> = Set.empty;
  //   for (let i = 0; i < 1_000_000; i++) {
  //     xs = xs.insert(i);
  //   }
  // });

  it('should insert 10M elements', () => {
    let xs: Set<string> = Set.empty;
    for (let i = 0; i < 10_000_000; i++) {
      xs = xs.insert(`${i}`.repeat(5));
    }
  });

  it('should insert 10M elements', () => {
    const xs = new global.Set<string>();
    for (let i = 0; i < 10_000_000; i++) {
      xs.add(`${i}`.repeat(5));
    }
  });
});
