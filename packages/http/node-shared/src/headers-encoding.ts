// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List } from '@fp4ts/cats';
import { Headers, RawHeader } from '@fp4ts/http-core';
import http from 'http';

export const incomingHeadersToHeaders = (
  hs: http.IncomingHttpHeaders,
): Headers => {
  const rawHeaders: RawHeader[] = [];
  for (const [k, val] of Object.entries(hs)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      rawHeaders.push(...val.map(v => new RawHeader(k, v)));
    } else {
      rawHeaders.push(new RawHeader(k, val));
    }
  }
  return new Headers(List.fromArray(rawHeaders));
};

export const headersToOutgoingHeaders = (
  hs: Headers,
): http.OutgoingHttpHeaders => {
  const outgoingHeaders: http.OutgoingHttpHeaders = {};
  for (const { headerName, headerValue } of hs.headers.toArray) {
    if (Array.isArray(outgoingHeaders[headerName])) {
      (outgoingHeaders[headerName] as any).push(headerValue);
    }
    if (typeof outgoingHeaders[headerName] === 'string') {
      outgoingHeaders[headerName] = [
        outgoingHeaders[headerName] as any,
        headerValue,
      ];
    }
    outgoingHeaders[headerName] = headerValue;
  }
  return outgoingHeaders;
};
