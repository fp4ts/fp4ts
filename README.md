# fp4ts

[![Node.js CI](https://github.com/mattapet/fp4ts/actions/workflows/build.yml/badge.svg)](https://github.com/mattapet/fp4ts/actions/workflows/build.yml)

[![codecov](https://codecov.io/gh/mattapet/fp4ts/branch/master/graph/badge.svg?token=XW0VJ6NPTZ)](https://codecov.io/gh/mattapet/fp4ts)

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

- `@fp4ts/effect` Port of the [Cats Effect](https://github.com/typelevel/cats-effect)
library providing data types, fundamental abstraction (e.g., MonadCancel, Async)
used for effectful and async functional programming. It also provides a set of
laws, to verify correctness of those implementations.

- `@fp4ts/http` Port of the [http4s](https://github.com/http4s/http4s) library,
providing minimal functional interface for building HTTP services. In addition
to the http4s, this port also includes [Servant](https://haskell-servant.github.io/)-like [dsl](./packages/http/dsl) for API declaration.

- `@fp4ts/logging` Logging library inspired by [log4cats](https://github.com/typelevel/log4cats),
[purescript-logging](https://github.com/rightfold/purescript-logging),
and [zio-logging](https://github.com/zio/zio-logging). The library provides
brackets using `Writer`, `WriterT` and `Console` type classes.

- `@fp4ts/optics` Port of the [Monocle](https://github.com/optics-dev/Monocle) library,
a Scala optics library for easy data access and transformation built on the profunctor optics.

- `@fp4ts/parse` Adaptation of the [Parsec](https://hackage.haskell.org/package/parsec-3.1.15.0/docs/Text-Parsec.html) library,
a parser combinator library with polymorphic input and evaluation effect type.
By default, the library provides tools for text parsing. Parsec was chosen instead
of the [cats-parse](https://github.com/typelevel/cats-parse/) existing in the Typelevel
ecosystem for the simplicity of the implementation, support for polymorphic input types
and contrary to the decision made in cats-pase, unification of parsers guaranteed
to consume input and ones that do not.

- `@fp4ts/stream` Port of the [FS2](https://github.com/typelevel/fs2) library
for purely functional, effect-ful, and polymorphic stream processing.

- `@fp4ts/schema` The library for describing types of Kind-0 and Kind-1, with
derivation capabilities for common typeclasses such as `Eq`, `Functor`, `Foldable`, and more.
Inspired by [io-ts](https://github.com/gcanti/io-ts), [shapeless](https://github.com/milessabin/shapeless), and [kittens](https://github.com/typelevel/kittens).


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

The full license with all references to ported projects can be found in [LICENCE](/LICENSE) file.
