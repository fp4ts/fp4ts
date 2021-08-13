import { ExecutionContext } from '../execution-context';

class Task {
  public constructor(
    public readonly id: number,
    public readonly runsAt: number,
    public readonly thunk: () => void,
  ) {}
}

interface State {
  readonly lastFailure?: Error;
  readonly clock: number;
  readonly lastId: number;
  readonly tasks: Task[];
}

export class TestExecutionContext implements ExecutionContext {
  private lastFailure?: Error;
  private clock: number = 0;
  private lastId: number = 0;
  private _tasks: Task[] = [];

  public get state(): State {
    const { lastFailure, clock, lastId, tasks } = this;
    return Object.freeze({ lastFailure, clock, lastId, tasks: tasks.sorted() });
  }

  public executeAsync(thunk: () => void): void {
    this.tasks.push(new Task(++this.lastId, this.clock, thunk));
  }

  public sleep(ms: number, thunk: () => void): () => void {
    const task = new Task(++this.lastId, this.clock + ms, thunk);
    const cancel = () => this.tasks.remove(task);
    this.tasks.push(task);
    return cancel;
  }

  public currentTimeMillis(): number {
    return this.clock;
  }

  public reportFailure(e: Error): void {
    this.lastFailure = e;
  }

  public tickOne(): boolean {
    const t = this.tasks.head();
    if (!t) return false;

    this.tasks.remove(t);
    try {
      t.thunk();
    } catch (e) {
      this.reportFailure(e as Error);
    }
    return true;
  }

  public tick(ms: number): void {
    this.clock += ms;
    let t: Task | undefined;

    while ((t = this.tasks.head())) {
      this.tasks.remove(t);
      try {
        t.thunk();
      } catch (e) {
        this.reportFailure(e as Error);
      }
    }
  }

  public tickAll(untilTime: number = Infinity): void {
    this.tick(untilTime);
    if (!this.tasks.isEmpty()) {
      this.tickAll(untilTime);
    }
  }

  private get tasks() {
    return {
      isEmpty: (): boolean => {
        return !this._tasks.length;
      },
      push: (t: Task): void => {
        this._tasks.push(t);
      },
      remove: (t: Task): void => {
        this._tasks = this._tasks.filter(tt => tt !== t);
      },
      sorted: (): Task[] =>
        this._tasks.sort((a, b) =>
          a.runsAt === b.runsAt ? a.id - b.id : a.runsAt - b.runsAt,
        ),
      head: (): Task | undefined => {
        const { runsAt: firstTick } =
          this.tasks.sorted().find(({ runsAt }) => runsAt <= this.clock) ?? {};
        if (firstTick == null) return undefined;

        const forTaking = arrayTakeWhile(
          this._tasks,
          ({ runsAt }) => runsAt === firstTick,
        );

        const nextTaskIdx = Math.floor(Math.random() * forTaking.length);
        return forTaking[nextTaskIdx];
      },
    };
  }
}

function arrayTakeWhile<A>(xs: A[], p: (a: A) => boolean): A[] {
  const results: A[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (!p(xs[i])) break;
    results.push(xs[i]);
  }
  return results;
}
