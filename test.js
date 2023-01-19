"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cats_1 = require("@fp4ts/cats");
// let ys = V.empty as V<number>;
// for (let i = 0; i < 10_000_000; i++) {
//   ys = ys.prepend(i);
// }
const start = Date.now();
let xs = cats_1.List.empty;
for (let i = 0; i < 10000000; i++) {
    xs = xs.prepend(i);
}
console.log(Date.now() - start);
