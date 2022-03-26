// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { Right } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { BasicCredentials, Request } from '@fp4ts/http';

import { auth, loginUser, registerUser } from '../../client';
import { withApp } from '../../with-app';

describe('Authentication', () => {
  it.M('should change password after logging in', () =>
    withApp(server =>
      IO.Monad.do(function* (_) {
        const req = new Request<IOF>({ uri: server.baseUri });
        const credentials = new BasicCredentials('fp4ts', '12345678');
        yield* _(auth(registerUser(credentials))(req).value);

        const [changeUsername] = loginUser(credentials);
        const resp = yield* _(
          auth(changeUsername({ username: 'new_fp4ts' }))(req).value,
        );

        expect(resp).toEqual(
          Right({ username: 'new_fp4ts', id: expect.any(String) }),
        );
      }),
    ),
  );
});
