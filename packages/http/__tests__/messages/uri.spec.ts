// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Monoid, None, Some, Writer } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';
import { Authority, Path, Query, Uri, uri } from '@fp4ts/http-core';

describe('URI', () => {
  describe('uri builder', () => {
    it('should build an uri', () => {
      expect(uri``).toEqual(new Uri());
    });

    it('should build a root localhost uri', () => {
      expect(uri`localhost:3000`).toEqual(
        new Uri(None, Some(new Authority('localhost', Some(3000)))),
      );
    });

    it('should build a root localhost uri with scheme', () => {
      expect(uri`http://localhost:3000`).toEqual(
        new Uri(Some('http'), Some(new Authority('localhost', Some(3000)))),
      );
      expect(uri`https://localhost:3000`).toEqual(
        new Uri(Some('https'), Some(new Authority('localhost', Some(3000)))),
      );
    });

    it('should build uri with path', () => {
      expect(uri`/my/path/to/resource`).toEqual(
        new Uri(None, None, new Path(['', 'my', 'path', 'to', 'resource'])),
      );
    });

    it('should build a localhost uri with path', () => {
      expect(uri`localhost:3000/my/path/to/resource`).toEqual(
        new Uri(
          None,
          Some(new Authority('localhost', Some(3000))),
          new Path(['', 'my', 'path', 'to', 'resource']),
        ),
      );
    });

    it('should build a uri with path and query', () => {
      expect(uri`/my/path/to/resource?prop1=true&prop2=42`).toEqual(
        new Uri(
          None,
          None,
          new Path(['', 'my', 'path', 'to', 'resource']),
          Query.fromEntries([
            ['prop1', Some('true')],
            ['prop2', Some('42')],
          ]),
        ),
      );
    });

    it('should build a uri with path and encoded query query', () => {
      expect(
        uri`/my/path/to/resource?prop=${encodeURIComponent('my prop')}`,
      ).toEqual(
        new Uri(
          None,
          None,
          new Path(['', 'my', 'path', 'to', 'resource']),
          Query.fromEntries([['prop', Some('my prop')]]),
        ),
      );
    });

    it('should build a localhost uri with path and query', () => {
      expect(
        uri`http://localhost:3000/my/path/to/resource?prop1=true&prop2=42`,
      ).toEqual(
        new Uri(
          Some('http'),
          Some(new Authority('localhost', Some(3000))),
          new Path(['', 'my', 'path', 'to', 'resource']),
          Query.fromEntries([
            ['prop1', Some('true')],
            ['prop2', Some('42')],
          ]),
        ),
      );
    });

    it('should distinguish between key-value query parameters and flags', () => {
      expect(
        uri`http://localhost:3000/my/path/to/resource?prop1&prop2=`,
      ).toEqual(
        new Uri(
          Some('http'),
          Some(new Authority('localhost', Some(3000))),
          new Path(['', 'my', 'path', 'to', 'resource']),
          Query.fromEntries([
            ['prop1', None],
            ['prop2', Some('')],
          ]),
        ),
      );
    });
  });

  it(
    'should parse rfc3986 complaint urls',
    forAll(
      fc.webUrl({
        validSchemes: ['http', 'https'],
        authoritySettings: { withPort: true },
        withQueryParameters: true,
        withFragments: false,
      }),
      url => Uri.fromString(url).isRight,
    ),
  );

  test(
    'fromString - render identity',
    forAll(
      fc
        .webUrl({
          validSchemes: ['http', 'https'],
          authoritySettings: { withPort: true },
          withQueryParameters: true,
          withFragments: false,
        })
        .map(x => Uri.fromStringUnsafe(x)),
      uri =>
        uri.render(Monoid.string).written() ===
        Uri.fromStringUnsafe(uri.render(Monoid.string).written())
          .render(Monoid.string)
          .written(),
    ),
  );
});
