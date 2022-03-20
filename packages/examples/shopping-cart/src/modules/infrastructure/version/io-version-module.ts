import { IO, IOF } from '@fp4ts/effect';
import { VersionApiService } from '../../application/version';

export class IOVersionModule {
  public static make(): IO<IOVersionModule> {
    return IO.pure(new IOVersionModule(new VersionApiService(IO.Concurrent)));
  }

  private constructor(public readonly apiService: VersionApiService<IOF>) {}
}
