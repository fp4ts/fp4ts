import { TracingEvent } from './tracing-event';
import { StackFrame } from './stack-frame';

type TracingMode = 'off' | 'full';
const tracingMode: TracingMode =
  (process.env.FP4TS_TRACING_MODE as TracingMode) ??
  (process.env.NODE_ENV === 'production' ? 'off' : 'full');

export const Tracing = Object.freeze({
  buildEvent(): TracingEvent | undefined {
    switch (tracingMode) {
      case 'off':
        return undefined;
      case 'full':
        return new TracingEvent();
      default:
        console.error(`Unsupported FP4TS_TRACING_MODE '${tracingMode}'`);
        return undefined;
    }
  },

  augmentError(e: Error, trace: TracingEvent[]): void {
    const tracingEvents = [...trace, e]
      .flatMap(e => e.stack?.split(/\r?\n/).slice(1) ?? [])
      .map(e => e.replace(/^\s+at /, ''))
      .filter(e => !excluded.some(p => p.test(e)))
      .map(parseOpName)
      .filter(Boolean);

    const formattedTracingEvents = tracingEvents
      .reverse()
      .map(te => `    at ${te}`);

    const ss = e.stack
      ?.split(/\r?\n/)
      .slice(0, 1)
      .concat(formattedTracingEvents as any)
      .join('\n');

    e.stack = ss;
  },
});

const excluded = [
  /\/fp4ts\/([a-zA-Z0-9\/_-]*)\/effect\/\w+\/(src|lib)\//,
  /\/fp4ts\/([a-zA-Z0-9\/_-]*)\/cats\/\w+\/(src|lib)\//,
  /\/fp4ts\/([a-zA-Z0-9\/_-]*)\/core\/(src|lib)\//,
  /node:internal\//,
];

const noMethodName = /^([a-zA-Z0-9.\/_-]*\.(j|t)s):(\d+):(\d+)$/;
const methodName = /^(.+) \(([a-zA-Z0-9.\/_-]*\.(j|t)s):(\d+):(\d+)\)$/;

const parseOpName = (ste: string): StackFrame | undefined => {
  const r1 = ste.match(noMethodName);
  if (r1) return new StackFrame(undefined, r1[1], r1[3], r1[4]);
  const r2 = ste.match(methodName);
  if (r2) return new StackFrame(r2[1], r2[2], r2[4], r2[5]);
  return undefined;
};
