import { FromHttpApiData } from '@fp4ts/http-dsl-shared';
import { boolean as b, string as s, number as n } from './plain-text';

export const boolean: FromHttpApiData<boolean> = FromHttpApiData.fromUniversal(
  b.decode,
);
export const number: FromHttpApiData<number> = FromHttpApiData.fromUniversal(
  n.decode,
);
export const string: FromHttpApiData<string> = FromHttpApiData.fromUniversal(
  s.decode,
);
