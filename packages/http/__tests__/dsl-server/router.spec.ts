// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { booleanType, numberType, stringType } from '@fp4ts/core';
import { IO } from '@fp4ts/effect';
import { InternalServerErrorFailure } from '@fp4ts/http-core';
import {
  group,
  Capture,
  GetNoContent,
  QueryParam,
  Raw,
  Route,
} from '@fp4ts/http-dsl';
import { builtins } from '@fp4ts/http-dsl-server/lib/builtin-codables';

import { route } from '@fp4ts/http-dsl-server/lib/internal';
import { EmptyContext } from '@fp4ts/http-dsl-server/lib/internal/context';
import { Delayed } from '@fp4ts/http-dsl-server/lib/internal/delayed';
import { RouteResult } from '@fp4ts/http-dsl-server/lib/internal/route-result';
import { sameStructure } from '@fp4ts/http-dsl-server/lib/internal/router';

describe('Choice', () => {
  it('should redistribute endpoints through static paths', () => {
    expectToHaveTheSameStructureAs(endpoint, endpointRef);
  });
  it('distributes nested routes through static paths', () => {
    expectToHaveTheSameStructureAs(static_, staticRef);
  });
  it('distributes nested routes through dynamic paths', () => {
    expectToHaveTheSameStructureAs(dynamic, dynamicRef);
  });
  it('properly reorders permuted static paths', () => {
    expectToHaveTheSameStructureAs(permute, permuteRef);
  });
  it('properly reorders permuted static paths in the presence of QueryParams', () => {
    expectToHaveTheSameStructureAs(permuteQuery, permuteRef);
  });
  it('properly reorders permuted static paths in the presence of Raw in end', () => {
    expectToHaveTheSameStructureAs(permuteRawEnd, permuteRawEndRef);
  });
  it('properly reorders permuted static paths in the presence of Raw in beginning', () => {
    expectToHaveTheSameStructureAs(permuteRawBegin, permuteRawBeginRef);
  });
  it('properly reorders permuted static paths in the presence of Raw in middle', () => {
    expectToHaveTheSameStructureAs(permuteRawMiddle, permuteRawMiddleRef);
  });
  it('properly reorders permuted static paths in the presence of a root endpoint in end', () => {
    expectToHaveTheSameStructureAs(permuteEndEnd, permuteEndRef);
  });
  it('properly reorders permuted static paths in the presence of a root endpoint in beginning', () => {
    expectToHaveTheSameStructureAs(permuteEndBegin, permuteEndRef);
  });
  it('properly reorders permuted static paths in the presence of a root endpoint in middle', () => {
    expectToHaveTheSameStructureAs(permuteEndMiddle, permuteEndRef);
  });
  it('properly handles mixing static paths at different levels', () => {
    expectToHaveTheSameStructureAs(level, levelRef);
  });
});

const End = GetNoContent;

// prettier-ignore
const endpoint = group(
  Route('a')[':>'](End),
  Route('a')[':>'](End),
);
const endpointRef = Route('a')[':>'](group(End, End));

const static_ = group(
  Route('a')[':>']('b')[':>'](End),
  Route('a')[':>']('c')[':>'](End),
);
const staticRef = Route('a')[':>'](
  group(Route('b')[':>'](End), Route('c')[':>'](End)),
);

// prettier-ignore
const dynamic = group(
  Route('a')[':>'](Capture('foo', numberType))[':>']('b')[':>'](End),
  Route('a')[':>'](Capture('bar', booleanType))[':>']('c')[':>'](End),
  Route('a')[':>'](Capture('baz', stringType))[':>']('d')[':>'](End),
);
// prettier-ignore
const dynamicRef =
  Route('a')[':>'](Capture('anything', stringType))[':>'](
    group(Route('b')[':>'](End), Route('c')[':>'](End), Route('d')[':>'](End)),
  );

const permute = group(
  Route('a')[':>']('b')[':>']('c')[':>'](End),
  Route('b')[':>']('a')[':>']('c')[':>'](End),
  Route('a')[':>']('c')[':>']('b')[':>'](End),
  Route('c')[':>']('a')[':>']('b')[':>'](End),
  Route('b')[':>']('c')[':>']('a')[':>'](End),
  Route('c')[':>']('b')[':>']('a')[':>'](End),
);
// prettier-ignore
const permuteRef = group(
  Route('a')[':>'](group(
    Route('b')[':>']('c')[':>'](End),
    Route('c')[':>']('b')[':>'](End),
  )),
  Route('b')[':>'](group(
    Route('a')[':>']('c')[':>'](End),
    Route('c')[':>']('a')[':>'](End),
  )),
  Route('c')[':>'](group(
    Route('a')[':>']('b')[':>'](End),
    Route('b')[':>']('a')[':>'](End),
  )),
);

const permuteQuery = group(
  QueryParam('1', numberType)[':>']('a')[':>']('b')[':>']('c')[':>'](End),
  QueryParam('2', numberType)[':>']('b')[':>']('a')[':>']('c')[':>'](End),
  QueryParam('3', numberType)[':>']('a')[':>']('c')[':>']('b')[':>'](End),
  QueryParam('4', numberType)[':>']('c')[':>']('a')[':>']('b')[':>'](End),
  QueryParam('5', numberType)[':>']('b')[':>']('c')[':>']('a')[':>'](End),
  QueryParam('6', numberType)[':>']('c')[':>']('b')[':>']('a')[':>'](End),
);

const permuteRawEnd = group(
  Route('a')[':>']('b')[':>']('c')[':>'](End),
  Route('b')[':>']('a')[':>']('c')[':>'](End),
  Route('a')[':>']('c')[':>']('b')[':>'](End),
  Route('c')[':>']('a')[':>']('b')[':>'](End),
  Route('b')[':>']('c')[':>']('a')[':>'](End),
  Route('c')[':>']('b')[':>']('a')[':>'](End),
  Raw,
);
const permuteRawEndRef = group(permuteRef, Raw);

const permuteRawMiddle = group(
  Route('a')[':>']('b')[':>']('c')[':>'](End),
  Route('b')[':>']('a')[':>']('c')[':>'](End),
  Route('a')[':>']('c')[':>']('b')[':>'](End),
  Raw,
  Route('c')[':>']('a')[':>']('b')[':>'](End),
  Route('b')[':>']('c')[':>']('a')[':>'](End),
  Route('c')[':>']('b')[':>']('a')[':>'](End),
);
// prettier-ignore
const permuteRawMiddleRef = group(
  Route('a')[':>'](group(
    Route('b')[':>']('c')[':>'](End),
    Route('c')[':>']('b')[':>'](End),
  )),
  Route('b')[':>']('a')[':>']('c')[':>'](End),
  Raw,
  Route('b')[':>']('c')[':>']('a')[':>'](End),
  Route('c')[':>'](group(
    Route('a')[':>']('b')[':>'](End),
    Route('b')[':>']('a')[':>'](End),
  )),
);

const permuteRawBegin = group(
  Raw,
  Route('a')[':>']('b')[':>']('c')[':>'](End),
  Route('b')[':>']('a')[':>']('c')[':>'](End),
  Route('a')[':>']('c')[':>']('b')[':>'](End),
  Route('c')[':>']('a')[':>']('b')[':>'](End),
  Route('b')[':>']('c')[':>']('a')[':>'](End),
  Route('c')[':>']('b')[':>']('a')[':>'](End),
);
const permuteRawBeginRef = group(Raw, permuteRef);

const permuteEndEnd = group(
  Route('a')[':>']('b')[':>']('c')[':>'](End),
  Route('b')[':>']('a')[':>']('c')[':>'](End),
  Route('a')[':>']('c')[':>']('b')[':>'](End),
  Route('c')[':>']('a')[':>']('b')[':>'](End),
  Route('b')[':>']('c')[':>']('a')[':>'](End),
  Route('c')[':>']('b')[':>']('a')[':>'](End),
  End,
);
const permuteEndBegin = group(
  End,
  Route('a')[':>']('b')[':>']('c')[':>'](End),
  Route('b')[':>']('a')[':>']('c')[':>'](End),
  Route('a')[':>']('c')[':>']('b')[':>'](End),
  Route('c')[':>']('a')[':>']('b')[':>'](End),
  Route('b')[':>']('c')[':>']('a')[':>'](End),
  Route('c')[':>']('b')[':>']('a')[':>'](End),
);
const permuteEndMiddle = group(
  Route('a')[':>']('b')[':>']('c')[':>'](End),
  Route('b')[':>']('a')[':>']('c')[':>'](End),
  Route('a')[':>']('c')[':>']('b')[':>'](End),
  End,
  Route('c')[':>']('a')[':>']('b')[':>'](End),
  Route('b')[':>']('c')[':>']('a')[':>'](End),
  Route('c')[':>']('b')[':>']('a')[':>'](End),
);
const permuteEndRef = group(permuteRef, End);

const levelFragment1 = group(
  Route('a')[':>']('b')[':>'](End),
  Route('a')[':>'](End),
);
const levelFragment2 = group(
  Route('b')[':>'](End),
  Route('a')[':>']('c')[':>'](End),
  End,
);
const level = group(levelFragment1, levelFragment2);
const levelRef = group(
  Route('a')[':>'](group(Route('b')[':>'](End), Route('c')[':>'](End), End)),
  Route('b')[':>'](End),
  End,
);

function expectToHaveTheSameStructureAs<rec, exp>(rec: rec, exp: exp) {
  const recr = makeTrivialRouter(rec);
  const expr = makeTrivialRouter(exp);
  if (!sameStructure(recr, expr)) {
    const msg = `Expected:\n${expr}\nbut got:\n${recr}`;
    throw new Error(msg);
  }
}

function makeTrivialRouter<api>(api: api) {
  return route(IO.Async)(
    api,
    EmptyContext,
    Delayed.empty(IO.Monad)(
      RouteResult.fatalFail(new InternalServerErrorFailure(new Error())),
    ),
    builtins as any,
  );
}
