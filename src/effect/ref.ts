import * as IO from './io';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Ref<A> {
  // @ts-ignore
  private readonly __void: void;

  private constructor(private value: A) {}

  public readonly get: () => IO.IO<A> = () => IO.delay(() => this.value);

  public readonly set: (a: A) => IO.IO<void> = x =>
    IO.delay(() => (this.value = x));

  public readonly update: (f: (a: A) => A) => IO.IO<void> = f =>
    IO.delay(() => {
      this.value = f(this.value);
    });

  public readonly updateAndGet: (f: (a: A) => A) => IO.IO<A> = f =>
    IO.delay(() => (this.value = f(this.value)));

  public readonly modify: <B>(f: (a: A) => [A, B]) => IO.IO<B> = f =>
    IO.delay(() => {
      const [x, r] = f(this.value);
      this.value = x;
      return r;
    });

  public static readonly of = <B>(x: B): IO.IO<Ref<B>> =>
    IO.delay(() => new Ref(x));
}

// Point-free

export const of: <A>(a: A) => IO.IO<Ref<A>> = a => Ref.of(a);

export const get: <A>(ra: Ref<A>) => IO.IO<A> = ra => ra.get();

export const set: <A>(a: A) => (ra: Ref<A>) => IO.IO<void> = a => ra =>
  set_(ra, a);

export const update: <A>(f: (a: A) => A) => (ra: Ref<A>) => IO.IO<void> =
  f => ra =>
    update_(ra, f);
export const updateAndGet: <A>(f: (a: A) => A) => (ref: Ref<A>) => IO.IO<A> =
  f => ra =>
    updateAndGet_(ra, f);
export const modify: <A, B>(f: (a: A) => [A, B]) => (ra: Ref<A>) => IO.IO<B> =
  f => ra =>
    modify_(ra, f);

// Point-ful

export const set_: <A>(ra: Ref<A>, a: A) => IO.IO<void> = (ra, a) => ra.set(a);
export const update_: <A>(ra: Ref<A>, f: (a: A) => A) => IO.IO<void> = (
  ra,
  f,
) => ra.update(f);
export const updateAndGet_: <A>(ra: Ref<A>, f: (a: A) => A) => IO.IO<A> = (
  ra,
  f,
) => ra.updateAndGet(f);
export const modify_: <A, B>(ra: Ref<A>, f: (a: A) => [A, B]) => IO.IO<B> = (
  ra,
  f,
) => ra.modify(f);
