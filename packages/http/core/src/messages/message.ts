// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EntityEncoder } from '../codec';
import { EntityBody } from '../entity-body';
import { ToRaw } from '../header';
import { ContentLength, Headers } from '../headers_';
import { HttpVersion } from '../http-version';
import { Media } from '../media';
import { Attributes } from './attributes';

export abstract class Message<F, Self> extends Media<F> {
  public abstract readonly httpVersion: HttpVersion;
  public abstract readonly attributes: Attributes;

  protected abstract copy(props?: Partial<Props<F>>): Self;

  public withAttributes(attributes: Attributes): Self {
    return this.copy({ attributes });
  }

  public withHeaders(...hs: ToRaw[]): Self {
    return this.copy({ headers: Headers.fromToRaw(...hs) });
  }

  public putHeaders(hs: Headers): Self;
  public putHeaders(...hs: ToRaw[]): Self;
  public putHeaders(...xs: any[]): Self {
    if (xs[0] instanceof Headers)
      return this.copy({ headers: this.headers['+++'](xs[0]) });
    else
      return this.copy({
        headers: this.headers['+++'](Headers.fromToRaw(...xs)),
      });
  }

  public transformHeaders(f: (hs: Headers) => Headers): Self {
    return this.copy({ headers: f(this.headers) });
  }

  public withHttpVersion(httpVersion: HttpVersion): Self {
    return this.copy({ httpVersion });
  }

  public withEntity<A>(a: A, e: EntityEncoder<F, A>): Self {
    const entity = e.toEntity(a);
    const hs = entity.length.fold(
      () => e.headers,
      l =>
        ContentLength.fromNumber(l).fold(
          () => e.headers,
          cl => e.headers.put(cl),
        ),
    );
    return this.copy({ body: entity.body, headers: this.headers['+++'](hs) });
  }

  public withBodyStream(body: EntityBody<F>): Self {
    return this.copy({ body });
  }
}
type Props<F> = {
  readonly httpVersion: HttpVersion;
  readonly headers: Headers;
  readonly body: EntityBody<F>;
  readonly attributes: Attributes;
};
