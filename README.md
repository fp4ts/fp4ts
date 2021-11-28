# fp4ts

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

- `@fp4ts/stream` Port of the [FS2](https://github.com/typelevel/fs2) library
for purely functional, effectul, and polymorphic stream processing.


## License

```
The MIT License (MIT)

Copyright (c) 2021 Peter Matta.

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
