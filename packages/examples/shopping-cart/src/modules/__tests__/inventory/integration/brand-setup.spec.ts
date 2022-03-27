// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { Right } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { BasicCredentials, Request } from '@fp4ts/http';
import { withApp } from '../../with-app';
import {
  auth,
  brandOwner,
  inventory,
  loginBrand,
  registerBrandOwner,
  registerUser,
} from '../../client';

describe('Brand setup', () => {
  const credentials = new BasicCredentials('fp4ts', '12345678');

  it.M('should create a brand', () =>
    withApp(server =>
      IO.Monad.do(function* (_) {
        const req = new Request<IOF>({ uri: server.baseUri });
        yield* _(auth(registerUser(credentials))(req).value);
        const owner = yield* _(
          inventory(brandOwner(registerBrandOwner(credentials)))(req).value,
        );

        const [[createBrand]] = loginBrand(credentials);
        const brand = yield* _(
          inventory(createBrand({ name: 'brand-name' }))(req).value,
        );

        expect(brand).toEqual(
          Right({
            name: 'brand-name',
            id: expect.any(String),
            active: true,
            owner: owner.get.id,
          }),
        );
      }),
    ),
  );
});
