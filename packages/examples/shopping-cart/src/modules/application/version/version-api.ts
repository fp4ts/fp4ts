import { Get, JSON } from '@fp4ts/http-dsl';
import { Version } from './version-dto';

export const VersionApi = Get(JSON, Version.Ref);
