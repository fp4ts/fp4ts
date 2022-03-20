// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { BasicAuth, group, JSON, Post, ReqBody, Route } from '@fp4ts/http-dsl';
import { User } from '../../domain/auth';
import {
  ChangeUsernameDto,
  ChangePasswordDto,
  UserDto,
  RegisterUserDto,
} from './dto';

export const AuthApi = group(
  Route('register')
    [':>'](ReqBody(JSON, RegisterUserDto.Ref))
    [':>'](Post(JSON, UserDto.Ref)),
  BasicAuth('auth', User.Ref)[':>'](
    group(
      Route('change-username')[':>'](
        ReqBody(JSON, ChangeUsernameDto.Ref)[':>'](Post(JSON, UserDto.Ref)),
      ),
      Route('change-password')[':>'](
        ReqBody(JSON, ChangePasswordDto.Ref)[':>'](Post(JSON, UserDto.Ref)),
      ),
    ),
  ),
);
