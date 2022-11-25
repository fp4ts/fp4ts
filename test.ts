type X = 1 | 2 | 3 | 4;

type Y = X extends any ? [X] : never;
