import { AnyK, Kind } from '@cats4ts/core';
import { Sync } from './sync';

export class Ref<F extends AnyK, A> {
  private readonly __void!: void;

  private constructor(private readonly F: Sync<F>, private value: A) {}

  public readonly get: () => Kind<F, [A]> = () =>
    this.F.delay(() => this.value);

  public readonly set: (a: A) => Kind<F, [void]> = x =>
    this.F.delay(() => {
      this.value = x;
    });

  public readonly update: (f: (a: A) => A) => Kind<F, [void]> = f =>
    this.F.delay(() => {
      this.value = f(this.value);
    });

  public readonly updateAndGet: (f: (a: A) => A) => Kind<F, [A]> = f =>
    this.F.delay(() => (this.value = f(this.value)));

  public readonly modify: <B>(f: (a: A) => [A, B]) => Kind<F, [B]> = f =>
    this.F.delay(() => {
      const [x, r] = f(this.value);
      this.value = x;
      return r;
    });

  public static readonly of =
    <F extends AnyK>(F: Sync<F>) =>
    <B>(x: B): Kind<F, [Ref<F, B>]> =>
      F.delay(() => new Ref(F, x));
}

// Point-free

export const of: <F extends AnyK>(
  F: Sync<F>,
) => <A>(a: A) => Kind<F, [Ref<F, A>]> = F => Ref.of(F);

export const get: <F extends AnyK, A>(ra: Ref<F, A>) => Kind<F, [A]> = ra =>
  ra.get();

export const set: <A>(
  a: A,
) => <F extends AnyK>(ra: Ref<F, A>) => Kind<F, [void]> = a => ra =>
  set_(ra, a);

export const update: <A>(
  f: (a: A) => A,
) => <F extends AnyK>(ra: Ref<F, A>) => Kind<F, [void]> = f => ra =>
  update_(ra, f);

export const updateAndGet: <A>(
  f: (a: A) => A,
) => <F extends AnyK>(ref: Ref<F, A>) => Kind<F, [A]> = f => ra =>
  updateAndGet_(ra, f);

export const modify: <A, B>(
  f: (a: A) => [A, B],
) => <F extends AnyK>(ra: Ref<F, A>) => Kind<F, [B]> = f => ra =>
  modify_(ra, f);

// Point-ful

export const set_: <F extends AnyK, A>(ra: Ref<F, A>, a: A) => Kind<F, [void]> =
  (ra, a) => ra.set(a);
export const update_: <F extends AnyK, A>(
  ra: Ref<F, A>,
  f: (a: A) => A,
) => Kind<F, [void]> = (ra, f) => ra.update(f);
export const updateAndGet_: <F extends AnyK, A>(
  ra: Ref<F, A>,
  f: (a: A) => A,
) => Kind<F, [A]> = (ra, f) => ra.updateAndGet(f);
export const modify_: <F extends AnyK, A, B>(
  ra: Ref<F, A>,
  f: (a: A) => [A, B],
) => Kind<F, [B]> = (ra, f) => ra.modify(f);
