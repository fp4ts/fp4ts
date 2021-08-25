import { pipe } from '../fp/core';
// import * as S from './stream';
import { IO } from '../effect/io';
import * as IOR from '../effect/unsafe/io-runtime';

// pipe(
//   S.range(1, 10_000),
//   // S.tap(console.log),
//   S.flatMap(x => S.of(x)),
//   S.map(x => x * 2),
//   S.zipWithIndex,
//   // S.tap(console.log),
//   // S.drain,
//   // S.take(10000),
//   S.fold(0, (x, [y]) => x + y),
//   S.drain,
//   // S.toArray,
// )
//   .unsafeRunToPromise()
//   .then(console.log)
//   .catch(e => console.log('ERROR', e));

// const doSomeWork = (n: number) => {
//   let x = n;
//   return pipe(
//     IO(() => {
//       console.log('RUNNING', n);
//       x -= 1;
//       if (x > 0) {
//         console.log(`#${n} Failing ${n - x}`);
//         throw new Error(`failure #${n} on ${n - x}`);
//       }
//       return n;
//     }),
//     S.retry(300, ms => ms * 2, 10),
//     S.map(n => console.log('succeeded', n)),
//   );
// };

// const doSomeWork = (n: number) =>
//   pipe(
//     IO(() => console.log('STARTING', n)).flatMap(() =>
//       pipe(IO(() => console.log('FINISHED', n)).delayBy((5 - n) * 1_000)),
//     ),
//     S.fromIO,
//   );

// pipe(S.range(5), S.flatMap(doSomeWork), S.drain).unsafeRunToPromise().catch(
//   console.log,
// );

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
// )
//   .unsafeRunToPromise()
//   .then(console.log);

// const timeoutSequence = (name: string) =>
//   pipe(
//     [1, 2, 3, 4, 5].map(n =>
//       IO.sleep(n * 100 + (Math.random() * 1000 + 200)).map(() =>
//         console.log(`finished ${name} ${n}`),
//       ),
//     ),
//     IO.sequence,
//     seq => seq.map(() => IO.unit).fork,
//   );

// pipe(
//   IO.Do,
//   IO.bindTo('fa', () => timeoutSequence('fa')),
//   IO.bindTo('fb', () => timeoutSequence('fb')),
//   IO.bind(({ fa }) => fa.join),
//   IO.bind(({ fb }) => fb.join),
// )
//   .unsafeRunToPromise()
//   .catch(console.log);

// pipe(
//   IO.Do,
//   IO.bindTo('result', () => {
//     const perform = (name: string, ms: number) =>
//       pipe(
//         IO.pure(name)
//           .delayBy(ms)
//           .onCancel(IO(() => console.log(`Canceled ${name}`))),
//       );

//     return IO.race(perform('A', 500), perform('B', 1000));
//   }),
// )
//   .unsafeRunToPromise()
//   .then(console.log)
//   .catch(console.log);

// pipe(
//   [5, 2, 7, 4, 8, 1, 4].map((n, idx) => [n, idx] as [number, number]),
//   IO.parTraverse(([n, idx]) =>
//     IO(() => {
//       if (idx < 1) throw new Error();
//       console.log(`${idx} completed in ${n} seconds`);
//     })
//       .delayBy(n * 1_000)
//       // .flatTap(() => IO(() => console.log('EXECUTING', idx)))
//       .onCancel(IO(() => console.log(`${n} canceled`))),
//   ),
// )
//   .timeout(2000)
//   .unsafeRunToPromise()
//   .then(console.log)
//   .catch(console.log);

// pipe(
//   IO(() => 2)
//     .map(x => x * 2)
//     .flatMap(x => IO(() => console.log('result', x)))
//     // .flatTap(() => IO.sleep(1_000))
//     // .onCancel(IO(() => console.log('being canceled')))
//     .timeout(2000),
//   IOR.unsafeRunMain,
// );

pipe(
  pipe(
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    IO.parTraverseN(
      n =>
        IO(() => console.log('EXECUTING', n))
          .flatMap(() =>
            IO.sleep(1_000 * (5 - n)).flatMap(() =>
              IO(() => console.log('COMPLETED', n)),
            ),
          )
          .onCancel(IO(() => console.log('CANCELED', n))),
      4,
    ),
  ).timeout(1_500),
  IOR.unsafeRunMain,
);

// const doSomeWork = (n: number) =>
//   IO(() => console.log('STARTING', n)).flatMap(() =>
//     IO.defer(() => IO.pure(undefined))
//       .delayBy((5 - n) * 1_000)
//       .flatMap(() => IO(() => console.log('FINISHED', n)))
//       .onCancel(IO(() => console.log('CANCELED', n)))
//       .flatMap(() => IO.throwError(new Error('Erooor'))),
//   );

// pipe([1, 2, 3, 4, 5].map(doSomeWork), IO.parSequence, IOR.unsafeRunMain);

// IO.readExecutionContext
//   .flatMap(ec =>
//     IO.both(
//       IO.sleep(50).onCancel(IO(() => console.log('CANCELED 1'))),
//       IO.sleep(5000).onCancel(IO(() => console.log('CANCELED 2'))),
//     ).executeOn(ec),
//   )
//   .timeout(200)
//   .unsafeRunToPromise()
//   .then(console.log)
//   .catch(console.log);

// pipe(
//   [...new Array(1000000)].map((_, idx) => IO.pure(idx)),
//   xs =>
//     xs
//       .reduce(
//         (fz, fx) =>
//           pipe(
//             IO.Do,
//             IO.bindTo('z', () => fz),
//             IO.bindTo('x', () => fx),
//           ).map(({ z, x }) => z + x),
//         IO.pure(0),
//       )
//       .tap(console.log),
//   IOR.unsafeRunMain,
// );
