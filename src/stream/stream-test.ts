import { pipe } from '../fp/core';
// import * as S from './stream';
import * as IO from '../effect/io';
import * as IOR from '../effect/io-runtime';

// pipe(
//   S.range(1, 100_000),
//   // S.tap(console.log),
//   S.flatMap(x => S.of(x)),
//   S.map(x => x * 2),
//   // S.zipWithIndex,
//   // S.tap(console.log),
//   // S.drain,
//   // S.take(10000),
//   S.compile(0, (x, y) => x + y),
//   // S.toArray,
//   IOR.unsafeRunToPromise,
// )
//   .then(console.log)
//   .catch(e => console.log('ERROR', e));

// const doSomeWork = (n: number) => {
//   let x = n;
//   return pipe(
//     IO.delay(() => {
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
//     IO.delay(() => console.log('STARTING', n)),
//     IO.flatMap(() =>
//       pipe(
//         IO.delay(() => console.log('FINISHED', n)),
//         IO.delayBy((5 - n) * 1_000),
//       ),
//     ),
//     S.fromIO,
//   );

// pipe(S.range(5), S.flatMap(doSomeWork), S.drain, IOR.unsafeRunToPromise).catch(
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
//   IO.unsafeRunAsync,
// ).then(console.log);

// const timeoutSequence = (name: string) =>
//   pipe(
//     [1, 2, 3, 4, 5].map(n =>
//       pipe(
//         IO.sleep(n * 100 + (Math.random() * 1000 + 200)),
//         IO.map(() => console.log(`finished ${name} ${n}`)),
//       ),
//     ),
//     IO.sequence,
//     IO.map(() => IO.unit),
//     IO.fork,
//   );

// pipe(
//   IO.Do,
//   IO.bindTo('fa', () => timeoutSequence('fa')),
//   IO.bindTo('fb', () => timeoutSequence('fb')),
//   IO.bind(({ fa }) => fa.join),
//   IO.bind(({ fb }) => fb.join),
//   IOR.unsafeRunToPromise,
// ).catch(console.log);

// pipe(
//   IO.Do,
//   IO.bindTo('result', () => {
//     const onCancel = (name: string) =>
//       IO.onCancel(IO.delay(() => console.log(`Canceled ${name}`)));

//     const perform = (name: string, ms: number) =>
//       pipe(IO.pure(name), IO.delayBy(ms), onCancel(name));

//     return IO.race_(perform('A', 500), perform('B', 1000));
//   }),
//   IOR.unsafeRunToPromise,
// )
//   .then(console.log)
//   .catch(console.log);

// pipe(
//   [5, 2, 7, 4, 8, 1, 4].map((n, idx) => [n, idx] as [number, number]),
//   IO.parTraverseOutcome(([n, idx]) =>
//     pipe(
//       IO.delay(() => {
//         if (idx < 1) throw new Error();
//         console.log(`${idx} completed in ${n} seconds`);
//       }),
//       IO.delayBy(n * 1_000),
//       // IO.flatTap(() => IO.delay(() => console.log('EXECUTING', idx))),
//       IO.onCancel(IO.delay(() => console.log(`${n} canceled`))),
//     ),
//   ),
//   IO.timeout(2000),
//   IOR.unsafeRunToPromise,
// )
//   .then(console.log)
//   .catch(console.log);

// pipe(
//   IO.delay(() => 2),
//   IO.map(x => x * 2),
//   IO.flatMap(x => IO.delay(() => console.log('result', x))),
//   // IO.flatTap(() => IO.sleep(1_000)),
//   // IO.onCancel(IO.delay(() => console.log('being canceled'))),
//   IO.timeout(2000),
//   IOR.unsafeRunToPromise,
// )
//   .then(e => console.log('result', e))
//   .catch(console.log);

pipe(
  [1, 2, 3, 4, 5],
  IO.parTraverseN(
    n =>
      pipe(
        IO.delay(() => console.log('EXECUTING', n)),
        IO.flatMap(() =>
          pipe(
            IO.sleep(1_000 * (5 - n)),
            IO.flatMap(() => IO.delay(() => console.log('COMPLETED', n))),
          ),
        ),
        IO.onCancel(IO.delay(() => console.log('CANCELED', n))),
      ),
    4,
  ),
  IO.timeout(1_500),
  IOR.unsafeRunMain,
);

// const doSomeWork = (n: number) =>
//   pipe(
//     IO.delay(() => console.log('STARTING', n)),
//     IO.flatMap(() =>
//       pipe(
//         // IO.pure(undefined),
//         IO.defer(() =>
//           n % 2 ? IO.throwError(new Error()) : IO.pure(undefined),
//         ),
//         IO.delayBy((5 - n) * 1_000),
//         IO.flatMap(() => IO.delay(() => console.log('FINISHED', n))),
//         IO.onCancel(IO.delay(() => console.log('CANCELED', n))),
//       ),
//     ),
//   );

// pipe([1, 2, 3, 4, 5].map(doSomeWork), IO.parSequence, IOR.unsafeRunToPromise)
//   .then(() => console.log('DONE'))
//   .catch(e => console.log('Errorred:', e));

// pipe(
//   IO.both_(
//     pipe(
//       IO.sleep(5000),
//       IO.onCancel(IO.delay(() => console.log('CANCELED 1'))),
//     ),
//     pipe(
//       IO.sleep(5000),
//       IO.onCancel(IO.delay(() => console.log('CANCELED 2'))),
//     ),
//   ),
//   IO.timeout(200),
//   IOR.unsafeRunToPromise,
// )
//   .then(console.log)
//   .catch(console.log);
