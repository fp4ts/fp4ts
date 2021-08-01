import { pipe } from '../fp/core';
// import * as S from './stream';
import * as IO from '../effect/io';
import * as IOR from '../effect/io-runtime';

// pipe(
//   S.range(1, 1_000_000),
//   // S.tap(console.log),
//   S.flatMap(x => S.pure(x)),
//   S.map(x => x * 2),
//   // S.zipWithIndex,
//   // S.tap(console.log),
//   // S.drain,
//   S.compile(0, (x, y) => x + y),
//   // S.toArray,
//   IOR.unsafeRunToPromise,
// )
//   .then(console.log)
//   .catch(e => console.log('ERROR', e));

// const doSomeWork = (n: number) => {
//   let x = n;
//   return pipe(
//     IO.suspendPromise(async () => {
//       console.log('RUNNING', n);
//       x -= 1;
//       if (x > 0) {
//         console.log(`#${n} Failing ${n - x}`);
//         throw new Error(`failure #${n} on ${n - x}`);
//       }
//       return Promise.resolve(n);
//     }),
//     S.retry(300, ms => ms * 2, 10),
//     S.map(n => console.log('succeeded', n)),
//   );
// };

// pipe(
//   S.range(5),
//   S.tap(console.log),
//   S.flatMap(doSomeWork),
//   S.drain,
//   IOR.unsafeRunToPromise,
// ).catch(console.log);

// pipe(
//   // S.range(100)
//   S.range(5),
//   S.map(x => {
//     console.log('Mapping', x);
//     return x * 2;
//   }),
//   S.take(10),
//   S.tap(console.log),
//   // S.filter(x => x % 2 === 0),
//   // S.drop(5),
//   // S.toArray,
//   S.drain,
//   IO.unsafeRunAsync,
// ).then(console.log);

const timeoutSequence = (name: string) =>
  pipe(
    [1, 2, 3, 4, 5].map(n =>
      pipe(
        IO.sleep(n * 100 + (Math.random() * 1000 + 200)),
        IO.map(() => console.log(`finished ${name} ${n}`)),
      ),
    ),
    IO.sequence,
    IO.map(() => IO.unit),
    IO.fork,
  );

pipe(
  IO.Do,
  IO.bindTo('fa', () => timeoutSequence('fa')),
  IO.bindTo('fb', () => timeoutSequence('fb')),
  IO.bind(({ fa }) => fa.join()),
  IO.bind(({ fb }) => fb.join()),
  IOR.unsafeRunToPromise,
).catch(console.log);
