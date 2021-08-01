import { PassThrough, Readable, Stream } from 'stream';

export const empty: () => Stream = () =>
  new Readable({
    read() {
      setImmediate(() => this.push(null));
    },
  });

export const concat: (ys: Stream) => (xs: Stream) => Stream = ys => xs =>
  concat_(xs, ys);

export const concat_: (xs: Stream, ys: Stream) => Stream = (xs, ys) => {
  const pass = new PassThrough();
  xs.pipe(pass);
  xs.on('end', () => ys.pipe(pass));
  ys.on('end', () => pass.end());
  return pass;
};

// - Stream Sinks

export const toString: (xs: Stream) => Promise<string> = xs =>
  new Promise((resolve, reject) => {
    const chunks: string[] = [];
    xs.on('data', chunk => chunks.push(chunk.toString()));
    xs.on('error', reject);
    xs.on('end', () => resolve(chunks.join('')));
  });

export const toBuffer: (xs: Stream) => Promise<Buffer> = xs =>
  toString(xs).then(Buffer.from);
