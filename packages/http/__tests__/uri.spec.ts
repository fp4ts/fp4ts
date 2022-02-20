import fc from 'fast-check';
import { List, Map, None, Some } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';
import { path, uri, Authority, Path, Uri, Query } from '@fp4ts/http-core';

describe('Uri', () => {
  describe('fromString', () => {
    it('should not URL Decode query string', () => {
      expect(uri`http://localhost:3000/blah?x=abc&y=ijk`.query).toEqual(
        Query.fromPairs(['x', 'abc'], ['y', 'ijk']),
      );
    });

    it('should parse valid scheme', () => {
      expect(uri`http://localhost:3000/`.scheme).toEqual(Some('http'));
      expect(uri`https://localhost:3000/`.scheme).toEqual(Some('https'));
    });

    it('should parse the authority with a trailing slash', () => {
      expect(uri`http://localhost/`.authority.get.host).toEqual('localhost');
    });

    it('should parse the authority without a trailing slash', () => {
      expect(uri`http://localhost`.authority.get.host).toEqual('localhost');
    });

    it('should not have an authority when not provided', () => {
      expect(uri`/bar/baz`.authority).toEqual(None);
    });

    it('should parse a non-negative integer value as port', () => {
      fc.assert(
        fc.property(
          fc.integer().filter(x => x >= 0),
          port =>
            expect(uri`http://localhost:${port}/`.authority.get.port).toEqual(
              Some(port),
            ),
        ),
      );
    });

    it('should have no port when no port provided', () => {
      expect(uri`http://localhost/`.authority.get.port).toEqual(None);
    });

    it('should parse an empty string port to be None', () => {
      expect(uri`http://localhost:/`.authority.get.port).toEqual(None);
    });

    it('should parse both authority and and port', () => {
      const x = uri`http://localhost:3000/`.authority.get;
      expect(x.host).toBe('localhost');
      expect(x.port).toEqual(Some(3000));
    });

    it(
      'should fail to parse port if its negative',
      forAll(
        fc.integer({ min: Number.MIN_SAFE_INTEGER, max: -1 }),
        port => Uri.fromString(`http://localhost:${port}/`).isLeft,
      ),
    );

    it(
      'should fail to parse port if its decimal',
      forAll(
        fc.float().filter(x => x % 1 !== 0),
        port => Uri.fromString(`http://localhost:${port}/`).isLeft,
      ),
    );

    it(
      'should fail to parse port if its not a number and not an empty string',
      forAll(
        fc
          .string()
          .filter(x => /^\w+$/.test(x))
          .filter(x => !/^\d+$/.test(x)),
        port => Uri.fromString(`http://localhost:${port}/`).isLeft,
      ),
    );
  });

  it('should support `/` operator for appending segments with a trailing slash', () => {
    const url = uri`http://localhost:3000/`;
    const newUrl = url['/']('echo');
    expect(newUrl).toEqual(uri`http://localhost:3000/echo`);
  });

  it('should support `/` operator for appending segments without a trailing slash', () => {
    const url = uri`http://localhost:3000`;
    const newUrl = url['/']('echo');
    expect(newUrl).toEqual(uri`http://localhost:3000/echo`);
  });

  it('should parse both, query and fragment', () => {
    const url = uri`http://localhost:300/blah?x=abc#y=ijk`;
    expect(url.query).toEqual(Query.fromPairs(['x', 'abc']));
    expect(url.fragment).toEqual(Some('y=ijk'));
  });

  describe('Query decoding', () => {
    const getQueryParams = (uri: Uri): Record<string, string> =>
      Object.fromEntries(uri.query.params.toArray);

    it('should parse query properties without spaces', () => {
      expect(
        getQueryParams(uri`http://localhost:3000/blah?x=abc&y=ijk`),
      ).toEqual({ x: 'abc', y: 'ijk' });
      expect(getQueryParams(uri`http://localhost:3000/blah?`)).toEqual({});
      expect(getQueryParams(uri`http://localhost:3000/blah`)).toEqual({});
    });

    it('should parse query properties with spaces', () => {
      // TODO: decide how to approach
      // expect(
      //   getQueryParams(uri`http://localhost:3000/blah?x=a+bc&y=ijk`),
      // ).toEqual({ x: 'a bc', y: 'ijk' });
      expect(
        getQueryParams(uri`http://localhost:3000/blah?x=a%20bc&y=ijk`),
      ).toEqual({ x: 'a bc', y: 'ijk' });
    });
  });

  describe('copy', () => {
    it('should update the schema', () => {
      expect(uri`http://example.com/`.copy({ scheme: Some('https') })).toEqual(
        uri`https://example.com/`,
      );
    });

    it('should add authority and scheme to the uri', () => {
      expect(
        uri`/route/`.copy({
          scheme: Some('https'),
          authority: Some(new Authority('example.com')),
        }),
      ).toEqual(uri`https://example.com/route/`);
    });

    it('should add authority, scheme and port to the uri', () => {
      expect(
        uri`/route/`.copy({
          scheme: Some('https'),
          authority: Some(new Authority('example.com', Some(8843))),
        }),
      ).toEqual(uri`https://example.com:8843/route/`);
    });
  });

  describe('toString', () => {
    it('should default to an empty string', () => {
      expect(new Uri().toString()).toEqual('');
    });

    it('should add a leading / when path replaced with path without it', () => {
      expect(
        uri`http://localhost:3000/foo/bar/baz`.withPath(path`bar`).toString(),
      ).toEqual('http://localhost:3000/bar');
    });

    // TODO: add IPv6 and Ipv4 tests

    it('should render URL with parameters', () => {
      expect(
        new Uri(
          Some('http'),
          Some(new Authority('www.example.com')),
          path`/foo`,
          Query.fromPairs(['bar', 'baz']),
        ).toString(),
      ).toEqual('http://www.example.com/foo?bar=baz');
    });

    it('should render URL without port', () => {
      expect(
        new Uri(
          Some('http'),
          Some(new Authority('www.example.com')),
          path`/foo`,
        ).toString(),
      ).toEqual('http://www.example.com/foo');
    });

    it('should render URL with port', () => {
      expect(
        new Uri(
          Some('http'),
          Some(new Authority('www.example.com', Some(80))),
          path`/foo`,
        ).toString(),
      ).toEqual('http://www.example.com:80/foo');
    });

    it('should not append `/` unless present in the path', () => {
      expect(uri`http://example.com`.toString()).toEqual('http://example.com');
    });

    // TODO: tests for user info

    it('should render a relative URI with an empty query string', () => {
      expect(
        new Uri()
          .copy({
            path: path`/`,
            query: Query.unsafeFromString(''),
            fragment: None,
          })
          .toString(),
      ).toEqual('/?');
    });

    it('should render a relative URI with an empty query string and an empty fragment', () => {
      expect(
        new Uri()
          .copy({
            path: path`/`,
            query: Query.unsafeFromString(''),
            fragment: Some(''),
          })
          .toString(),
      ).toEqual('/?#');
    });

    it('should render a relative URI with an empty fragment', () => {
      expect(
        new Uri()
          .copy({
            path: Path.Root,
            query: Query.empty,
            fragment: Some(''),
          })
          .toString(),
      ).toEqual('/#');
    });

    it('should render a relative URI with a fragment', () => {
      expect(
        new Uri()
          .copy({
            path: path`/foo/bar`,
            query: Query.empty,
            fragment: Some('an_anchor'),
          })
          .toString(),
      ).toEqual('/foo/bar#an_anchor');
    });

    it('should render a relative URI with a query string and a fragment', () => {
      expect(
        new Uri()
          .copy({
            path: path`/foo/bar`,
            query: Query.unsafeFromString('foo=bar&ding=dong'),
            fragment: Some('an_anchor'),
          })
          .toString(),
      ).toEqual('/foo/bar?foo=bar&ding=dong#an_anchor');
    });

    it('should render a path without parameters', () => {
      expect(new Uri().copy({ path: path`/foo/bar` }).toString()).toEqual(
        '/foo/bar',
      );
      expect(uri`/foo/bar`.toString()).toEqual('/foo/bar');
    });

    it('should render an absolute path without parameters', () => {
      expect(new Uri().copy({ path: path`/` }).toString()).toEqual('/');
      expect(uri`/`.toString()).toEqual('/');
    });

    it('should render an absolute path with a colon', () => {
      expect(new Uri().withPath(path`/foo/bar:baz`).toString()).toEqual(
        '/foo/bar:baz',
      );
      expect(uri`/foo/bar:baz`.toString()).toEqual('/foo/bar:baz');
    });

    it('should render a query string without a path and an empty parameter', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('param1=test')).toString(),
      ).toEqual('?param1=test');
    });

    it('should render a string with a multiple values in a parameter', () => {
      expect(
        new Uri()
          .withQuery(Query.unsafeFromString('param1=3&param2=2&param2=foo'))
          .toString(),
      ).toEqual('?param1=3&param2=2&param2=foo');
    });
  });

  test(
    'fromString toString identity',
    forAll(
      fc
        .webUrl({
          validSchemes: ['http', 'https'],
          authoritySettings: { withPort: true },
          withQueryParameters: true,
          withFragments: true,
        })
        .map(x => Uri.unsafeFromString(x)),
      uri => uri.toString() === Uri.unsafeFromString(uri.toString()).toString(),
    ),
  );

  describe('query params', () => {
    it('should find a first value with multi parameter query', () => {
      const u = new Uri().withQuery(
        Query.unsafeFromString(
          'param1=value1&param1=value2&param1=value3&param2=value4&param2=value5',
        ),
      );
      expect(u.query.params.lookup('param1')).toEqual(Some('value1'));
      expect(u.query.params.lookup('param2')).toEqual(Some('value4'));
    });

    it('should find parameter with empty key and a value', () => {
      const u = new Uri().withQuery(
        Query.unsafeFromString('param1=&=valueWithEmptyKey&param2=value2'),
      );
      expect(u.query.params.lookup('')).toEqual(Some('valueWithEmptyKey'));
    });
  });

  describe('query multi params', () => {
    it('should parse empty query string', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('')).query.multiParams,
      ).toEqual(Map(['', List.empty]));
    });
    it('should parse parameter without key or value', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('=')).query.multiParams,
      ).toEqual(Map(['', List('')]));
    });

    it('should parse parameter without key and but with a value', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('=value')).query.multiParams,
      ).toEqual(Map(['', List('value')]));
    });

    it('should parse parameter with key and but without a value', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('key=')).query.multiParams,
      ).toEqual(Map(['key', List('')]));
    });

    it('should parse parameter with single key and single value', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('key=value')).query
          .multiParams,
      ).toEqual(Map(['key', List('value')]));
    });

    it('should parse a single parameter without value', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('parameter')).query
          .multiParams,
      ).toEqual(Map(['parameter', List.empty]));
    });

    it('should parse many parameters with value', () => {
      expect(
        new Uri().withQuery(
          Query.unsafeFromString(
            'param1=value&param2=value1&param2=value2&param3=value',
          ),
        ).query.multiParams,
      ).toEqual(
        Map(
          ['param1', List('value')],
          ['param2', List('value1', 'value2')],
          ['param3', List('value')],
        ),
      );
    });

    it('should parse many parameter without value', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('param1&param2&param3'))
          .query.multiParams,
      ).toEqual(
        Map(
          ['param1', List.empty],
          ['param2', List.empty],
          ['param3', List.empty],
        ),
      );
    });

    it('should parse empty key-value pairs', () => {
      expect(
        new Uri().withQuery(Query.unsafeFromString('&&&&')).query.multiParams,
      ).toEqual(Map(['', List.empty]));
    });
  });
});
