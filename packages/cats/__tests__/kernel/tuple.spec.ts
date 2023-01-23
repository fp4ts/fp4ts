// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Ord } from '@fp4ts/cats-kernel';
import { OrdSuite } from '@fp4ts/cats-kernel-laws';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Tuple instances', () => {
  checkAll('[]', OrdSuite(Ord.tuple()).ord(fc.tuple()));

  checkAll(
    '[string]',
    OrdSuite(Ord.tuple(Ord.fromUniversalCompare<string>())).ord(
      fc.tuple(fc.string()),
    ),
  );
  checkAll(
    '[boolean]',
    OrdSuite(Ord.tuple(Ord.fromUniversalCompare<boolean>())).ord(
      fc.tuple(fc.boolean()),
    ),
  );
  checkAll(
    '[number]',
    OrdSuite(Ord.tuple(Ord.fromUniversalCompare<number>())).ord(
      fc.tuple(fc.integer()),
    ),
  );

  checkAll(
    '[number, number]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<number>(),
      ),
    ).ord(fc.tuple(fc.integer(), fc.integer())),
  );
  checkAll(
    '[number, string]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<string>(),
      ),
    ).ord(fc.tuple(fc.integer(), fc.string())),
  );
  checkAll(
    '[string, number]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<string>(),
        Ord.fromUniversalCompare<number>(),
      ),
    ).ord(fc.tuple(fc.string(), fc.integer())),
  );

  checkAll(
    '[number, number, number]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<number>(),
      ),
    ).ord(fc.tuple(fc.integer(), fc.integer(), fc.integer())),
  );
  checkAll(
    '[number, string, boolean]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<string>(),
        Ord.fromUniversalCompare<boolean>(),
      ),
    ).ord(fc.tuple(fc.integer(), fc.string(), fc.boolean())),
  );
  checkAll(
    '[string, number, string]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<string>(),
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<string>(),
      ),
    ).ord(fc.tuple(fc.string(), fc.integer(), fc.string())),
  );

  checkAll(
    '[number, number, number, number]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<number>(),
      ),
    ).ord(fc.tuple(fc.integer(), fc.integer(), fc.integer(), fc.integer())),
  );
  checkAll(
    '[number, string, boolean, number]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<string>(),
        Ord.fromUniversalCompare<boolean>(),
        Ord.fromUniversalCompare<number>(),
      ),
    ).ord(fc.tuple(fc.integer(), fc.string(), fc.boolean(), fc.integer())),
  );
  checkAll(
    '[string, boolean, number, string]',
    OrdSuite(
      Ord.tuple(
        Ord.fromUniversalCompare<string>(),
        Ord.fromUniversalCompare<boolean>(),
        Ord.fromUniversalCompare<number>(),
        Ord.fromUniversalCompare<string>(),
      ),
    ).ord(fc.tuple(fc.string(), fc.boolean(), fc.integer(), fc.string())),
  );
});
