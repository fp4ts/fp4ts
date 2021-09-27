import { Some } from '../data';
import { Eval, Memoize, Now, view } from './algebra';

export const evaluate = <A>(e: Eval<A>): A => {
  type Frame = (u: unknown) => Eval<unknown>;
  const stack: Frame[] = [];
  let _cur: Eval<unknown> = e;

  const addToMemo =
    <A1>(m: Memoize<A1>) =>
    (x: A1): Eval<A1> => {
      m.result = Some(x);
      return new Now(x);
    };

  while (true) {
    const cur = view(_cur);
    if (!cur) throw new Error();

    switch (cur.tag) {
      case 'now':
      case 'later':
      case 'always': {
        const a = cur.value;
        const next = stack.pop()!;
        if (!next) return a as A;
        _cur = next(a);
        continue;
      }

      case 'defer':
        _cur = cur.thunk();
        continue;

      case 'flatMap':
        stack.push(cur.run);
        _cur = cur.self;
        continue;

      case 'memoize': {
        const m = cur;
        m.result.fold(
          () => {
            _cur = m.self;
            stack.push(addToMemo(m));
          },
          x => {
            _cur = new Now(x);
          },
        );
        continue;
      }
    }
  }
};
