# fp4ts

[![Node.js CI](https://github.com/mattapet/fp4ts/actions/workflows/build.yml/badge.svg)](https://github.com/fp4ts/fp4ts/actions/workflows/build.yml)

[![Publish Nightly](https://github.com/fp4ts/fp4ts/actions/workflows/publish-nightly.yml/badge.svg?branch=master)](https://github.com/fp4ts/fp4ts/actions/workflows/publish-nightly.yml)

[![codecov](https://codecov.io/gh/fp4ts/fp4ts/branch/master/graph/badge.svg?token=wXOEoz3yOm)](https://codecov.io/gh/fp4ts/fp4ts)

Welcome to fp4ts! Fp4ts is a zero-dependency, purely functional library that
attempts to port portion of the [Typelevel](https://typelevel.org/) ecosystem
to Typescript.

_The project is currently under development and is not intended to be used in
production._

## Project Structure

Fp4ts is fairly large and offers multiple packages:

- `@fp4ts/core` The library implementing basic building blocks and utilities
used across the rest of the packages, namely the HKT abstraction.

- `@fp4ts/cats` Port of the [Cats](https://github.com/typelevel/cats) library
providing basic data types, collections and fundamental abstraction (e.g.,
Functor, Monad) used for functional programming. It also provides a set of laws,
to verify correctness of those implementations.

  - `@fp4ts/cats-kernel` Small set of basic types and type classes (_included_)
  - `@fp4ts/cats-core` Majority of the type classes and basic data types (_included_) 
  - `@fp4ts/cats-laws` Laws for testing type class instances/implementations
  - `@fp4ts/cats-profunctor` Profunctor type classes, data type, and instances for core types
  - `@fp4ts/cats-profunctor-laws` Laws for testing profunctor type classes
  - `@fp4ts/cats-arrow` Arrow type classes, data type, and instances for core types
  - `@fp4ts/cats-arrow-laws` Laws for testing arrow type classes
  - `@fp4ts/cats-test-kit` Jest integration for testing type class instances and collection of builtin arbitraries for provided data types
  - `@fp4ts/free` Free structures


- `@fp4ts/mtl` Monad Transformer Library

 - `@fp4ts/mtl-core` Set of type classes and transformer data types (_included_)
 - `@fp4ts/mtl-laws` Set of laws for testing monad transformer implementations


- `@fp4ts/effect` Port of the [Cats Effect](https://github.com/typelevel/cats-effect)
library providing data types, fundamental abstraction (e.g., MonadCancel, Async)
used for effectful and async functional programming. It also provides a set of
laws, to verify correctness of those implementations.

  - `@fp4ts/effect-kernel` Set of type classes for describing effectful computations/data types (_included_)
  - `@fp4ts/effect-core` Implementations of the `IO` and `SyncIO` data types (_included_)
  - `@fp4ts/effect-std` Implementations of the standard effectful data types such as `Queue` or `Semaphore` (_included_)
  - `@fp4ts/effect-laws` Laws for testing type class instances/implementations
  - `@fp4ts/effect-test-kit` Jest integration for testing type class instances and collection of builtin arbitraries for provided data types

- `@fp4ts/fused` Partial port of the [fused-effects](https://hackage.haskell.org/package/fused-effects) providing algebraic, higher-order, extensible effects with a standard library compatible with `@fp4ts/cats-mtl`.

  - `@fp4ts/fused-kernel` Set of type classes and primitives for defining effect carriers as well as interpreters (_included_)
  - `@fp4ts/fused-core` Definition of standard effect types (_included_)
  - `@fp4ts/fused-std` Library of standard effect carriers using `@fp4ts/cats-mtl` (_included_)

- `@fp4ts/http` Port of the [http4s](https://github.com/http4s/http4s) library,
providing minimal functional interface for building HTTP services. In addition
to the http4s, this port also includes [Servant](https://haskell-servant.github.io/)-like [dsl](./packages/http/dsl) for API declaration.

  - `@fp4ts/http-core` Implementation of the basic data types for building HTTP services, such as `Request<F>`, `Response<F>`, and more (_included_)
  - `@fp4ts/http-client` Definition of the `Client<F>` type and its default implementation
  - `@fp4ts/http-server` Definition of the `Server<F>` type and a set of middlewares
  - `@fp4ts/dsl` Servant-like library for defining APIs
  - `@fp4ts/dsl-client` Derivation of the clients for APIs defined using `@fp4ts/dsl`
  - `@fp4ts/dsl-server` Derivation of the servers for APIs defined using `@fp4ts/dsl`
  - `@fp4ts/node-client` Node.js bindings for the HTTP clients
  - `@fp4ts/node-server` Node.js bindings for the HTTP servers
  - `@fp4ts/test-kit` Library for testing HTTP services and clients
  - `@fp4ts/test-kit-node` Node bindings for testing HTTP services and clients


- `@fp4ts/logging` Logging library inspired by [log4cats](https://github.com/typelevel/log4cats),
[purescript-logging](https://github.com/rightfold/purescript-logging),
and [zio-logging](https://github.com/zio/zio-logging). The library provides
brackets using `Writer`, `WriterT` and `Console` type classes.

  - `@fp4ts/logging-kernel` Set of type classes and default implementation for logging (_included_)
  - `@fp4ts/logging-core` Implementation for standard loggers (_included_)


- `@fp4ts/optics` Port of the [Monocle](https://github.com/optics-dev/Monocle) library,
a Scala optics library for easy data access and transformation built on the profunctor optics.

  - `@fp4ts/optics-kernel` Set of mainly profunctor type classes (_included_)
  - `@fp4ts/optics-core` Implementation of the common optics and indexed optics (_included_)
  - `@fp4ts/optics-derivation` Binding for deriving common optics from `@fp4ts/schema` definitions (_included_)
  - `@fp4ts/optics-laws` Set of laws to verify properties of the optics


- `@fp4ts/parse` Adaptation of the [Parsec](https://hackage.haskell.org/package/parsec-3.1.15.0/docs/Text-Parsec.html) library,
a parser combinator library with polymorphic input and evaluation effect type.
By default, the library provides tools for text parsing. Parsec was chosen instead
of the [cats-parse](https://github.com/typelevel/cats-parse/) existing in the Typelevel
ecosystem for the simplicity of the implementation, support for polymorphic input types
and contrary to the decision made in cats-pase, unification of parsers guaranteed
to consume input and ones that do not.

  - `@fp4ts/prase-kernel` Type classes for defining tokens and streams of values (_included_)
  - `@fp4ts/parse-core` Implementation of the parse and its default combinators (_included_)
  - `@fp4ts/parse-text` Implementation of the text-parses and helpers for their usage (_included_)


- `@fp4ts/schema` The library for describing types of Kind-0 and Kind-1, with
derivation capabilities for common typeclasses such as `Eq`, `Functor`, `Foldable`, and more.
Inspired by [io-ts](https://github.com/gcanti/io-ts), [shapeless](https://github.com/milessabin/shapeless), and [kittens](https://github.com/typelevel/kittens).

  - `@fp4ts/schema-kernel` Type classes for describing types for derivations of Kind-0 and Kind-1 types (_included_)
  - `@fp4ts/schema-core` Derivable data types for validation, encoding and decoding of types (_included_)
  - `@fp4ts/schema-derivation` Derivation of data type constructors (_included_)
  - `@fp4ts/schema-json` JSON-specific encoders and decoders
  - `@fp4ts/schema-laws` Set of laws for codable data types
  - `@fp4ts/schema-test-kit` Set of arbitraries for testing schemable types


- `@fp4ts/sql` Partial port of the [doobie](https://github.com/tpolecat/doobie) library
providing functional interface for SQL databases.

  - `@fp4ts/sql-core` Core data types for describing communication with RDMS (_included_)
  - `@fp4ts/sql-mariadb` Driver for MariaDB
  - `@fp4ts/sql-pg` Driver for Postgres
  - `@fp4ts/sql-sqlite` Driver for SQLite


- `@fp4ts/stream` Port of the [FS2](https://github.com/typelevel/fs2) library
for purely functional, effect-ful, and polymorphic stream processing.

  - `@fp4ts/stream-core` Definition of basic `Stream`, `Pull` and `Chunk` types, and related type classes for compiling the effectful streams (_included_)
  - `@fp4ts/stream-io` Node.js interop providing bindings for `Readable`, `Writable` and console IO

Each of the listed packages is released separately. However, packages which are
marked as _included_ can be consumed by installing the root module. For example,
for consuming anything from `@fp4ts/cats-kernel` or `@fp4ts/cats-core` one can
just install `@fp4ts/cats` and:

```typescript
import { List, Map, Ord } from '@fp4ts/cats';

const xs = List<[string, number]>(['a', 42], ['b', 43]);
const ms = Map.fromList(Ord.primitive)(xs);

...
```

### Versioning

As the project is under development and not intended to be used in production,
_all_ of the packages are versioned as `0.0.x` without _any_ API stability guarantees.

## Examples

- John De Goes' [FP to the Max](./packages/examples/fp-to-the-max/src/program.ts)
- [Todo API](./packages/examples/todo-api/) implemented using the [Servant-style
API dsl](./packages/examples/todo-api/src/api)

## License

```
The MIT License (MIT)

Copyright (c) 2021-2022 Peter Matta.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

The full license with all references to ported projects can be found in [LICENSE](/LICENSE) file.
