import { IdentityF, NonEmptyList } from '@fp4ts/cats';
import { Header, RawHeader, SelectHeader, SingleSelectHeader } from '../header';
import { Method } from '../messages';

export class AccessControlAllowMethod {
  public constructor(public readonly method: Method) {}

  public toRaw(): NonEmptyList<RawHeader> {
    return AccessControlAllowMethod.Select.toRaw(this);
  }

  public static readonly Header: Header<AccessControlAllowMethod, 'single'> = {
    headerName: 'Access-Control-Request-Method',
    value: h => h.method.methodName,
    parse: s => Method.fromString(s).map(m => new AccessControlAllowMethod(m)),
  };

  public static readonly Select: SelectHeader<
    IdentityF,
    AccessControlAllowMethod
  > = new SingleSelectHeader(AccessControlAllowMethod.Header);
}
