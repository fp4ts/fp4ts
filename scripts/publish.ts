// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';
import path from 'path';
import cp from 'child_process';

import { tupled } from '@fp4ts/core';
import { List, None, Option, Some, Try } from '@fp4ts/cats';
import { IO, unsafeRunMain } from '@fp4ts/effect';
import { Stream, text } from '@fp4ts/stream';
import { toposort } from './toposort';

const cwd = IO.delay(() => process.cwd());
const arg = (idx: number): IO<string> =>
  IO.delay(() => Option(process.argv[idx]))
    .map(opt => opt.toRight(() => new Error(`Missing argument ${idx}`)))
    .flatMap(IO.fromEither);

const readFile = (path: string): IO<string> =>
  IO.deferPromise(() => fs.promises.readFile(path)).map(buf => buf.toString());

const writeFile = (path: string, content: string): IO<void> =>
  IO.deferPromise(() => fs.promises.writeFile(path, content));

const exec = (cmd: string, options: cp.ExecOptions = {}): IO<string> =>
  IO.deferPromise(
    () =>
      new Promise((resolve, reject) =>
        cp.exec(
          cmd,
          options,
          (err, out, stderr) => (
            console.error(stderr), err ? reject(err) : resolve(out)
          ),
        ),
      ),
  );

interface Workspace {
  readonly location: string;
  readonly name: string | null;
  readonly workspaceDependencies: string;
}

interface PackageJson extends Record<string, any> {
  readonly version?: string;
  readonly name?: string;
  readonly private?: boolean;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

interface PublicWorkspace {
  readonly location: string;
  readonly name: string;
  readonly workspaceDependencies: string;
  readonly pkgJson: PackageJson & { name: string; version: string };
}

const loadPackageJson = (cwd: string, workspace: Workspace): IO<PackageJson> =>
  IO.pure(path.join(cwd, workspace.location, 'package.json'))
    .flatMap(readFile)
    .flatMap(buf => IO.fromEither(Try(() => JSON.parse(buf)).toEither));

const readWorkspaces = (cwd: string): IO<List<PublicWorkspace>> =>
  Stream.evalF(exec('yarn workspaces list --json -v'))
    .through(text.lines())
    .filter(line => line.length !== 0)
    .collect(line => Try(() => JSON.parse(line) as Workspace).toOption)
    .evalMap(w => IO.pure(w).product(loadPackageJson(cwd, w)))
    .collect(([w, pkg]) =>
      w.name && !pkg.private
        ? Some({ ...w, pkgJson: pkg } as PublicWorkspace)
        : None,
    )
    .compileConcurrent().toList;

const sortWorkspaces = (
  ws: List<PublicWorkspace>,
): Option<List<PublicWorkspace>> =>
  toposort((x, y) => y.workspaceDependencies.includes(x.location), ws);

const releaseWorkspace =
  (cwd: string, version: string) =>
  (w: PublicWorkspace): IO<void> =>
    IO.Monad.do(function* (_) {
      const refName = `${w.name}@${version}`;
      console.log('PREPARING WORKSPACE', refName);

      const dependencies = Object.fromEntries(
        Object.entries(w.pkgJson.dependencies ?? {}).map(([k, v]) =>
          k.startsWith('@fp4ts/') ? tupled(k, version) : tupled(k, v),
        ),
      );
      const devDependencies = Object.fromEntries(
        Object.entries(w.pkgJson.devDependencies ?? {}).map(([k, v]) =>
          k.startsWith('@fp4ts/') ? tupled(k, version) : tupled(k, v),
        ),
      );

      const pkgJson = {
        ...w.pkgJson,
        files: ['lib', '!**/__tests__', '!**/*.tsbuildinfo'],
        homepage: 'https://github.com/fp4ts/fp4ts#readme',
        repository: {
          type: 'git',
          url: 'https://github.com/fp4ts/fp4ts',
          directory: w.location,
        },
        version,
        dependencies,
        devDependencies,
      };

      yield* _(
        writeFile(
          path.join(cwd, w.location, 'package.json'),
          `${JSON.stringify(pkgJson, null, 2)}\n`,
        ),
      );

      console.log('UPLOADING...', refName);

      yield* _(
        exec(`npm publish --access public`, {
          cwd: path.join(cwd, w.location),
        }),
      );

      console.log('DONE', refName);
    });

unsafeRunMain(
  arg(2)
    .product(cwd)
    .flatMap(([version, cwd]) =>
      readWorkspaces(cwd)
        .map(sortWorkspaces)
        .flatMap(opt =>
          opt.fold(
            () => IO.throwError(new Error('ERROR')),
            xs => xs.traverse(IO.Applicative)(releaseWorkspace(cwd, version)),
          ),
        ),
    ),
);
