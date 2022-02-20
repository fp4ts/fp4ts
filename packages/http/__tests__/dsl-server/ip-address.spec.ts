// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { forAll } from '@fp4ts/cats-test-kit';
import { IpAddress, Ipv4Address, Ipv6Address } from '@fp4ts/http-server';

describe('IP Address', () => {
  test(
    'fromString IP address',
    forAll(
      fc.oneof(fc.ipV4(), fc.ipV6()),
      ip => IpAddress.fromString(ip).nonEmpty,
    ),
  );

  describe('Ipv4', () => {
    test(
      'fromString toString identity',
      forAll(fc.ipV4(), ip => Ipv4Address.fromString(ip).get.toString() === ip),
    );
  });

  describe('Ipv6', () => {
    test(
      'decode Ipv6',
      forAll(fc.ipV6(), ip => Ipv6Address.fromString(ip).nonEmpty),
    );

    test(
      'fromString toString identity',
      forAll(
        fc.ipV6().map(ip => Ipv6Address.fromString(ip).get.toString()),
        ip => Ipv6Address.fromString(ip).get.toString() === ip,
      ),
    );
  });
});
