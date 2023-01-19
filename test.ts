import { List, Seq, View } from '@fp4ts/cats';
import { Eval } from '@fp4ts/core';

const zs = [...new Array(5_000_000).keys()];

// const ys = Seq.fromArray(xs);
const start = Date.now();
console.log(
  Seq(1, 2, 3, 4, 1, 2, 3, 4)
    .spanRight(x => x > 3)
    .map(xs => xs.toArray),
);
// List.range(0, 20_000)
//   .tails()
//   .map(xs => xs.size).size;
console.log(Date.now() - start);
