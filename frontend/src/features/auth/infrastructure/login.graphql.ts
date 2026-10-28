// src/features/auth/infrastructure/login.graphql.ts

import { executeGraphQL } from '@/shared/graphql';

import type { AuthSession } from './auth-session-storage';

export type LoginWithPasswordRequest = Readonly<{
  loginName: string;
  loginPassword: string;
}>;

type LoginWithPasswordVariables = Readonly<{
  input: Readonly<{
    audience: 'DESKTOP';
    loginName: string;
    loginPassword: string;
    type: 'PASSWORD';
  }>;
}>;

type LoginWithPasswordData = Readonly<{
  login: AuthSession;
}>;

const LOGIN_WITH_PASSWORD_MUTATION = `
  mutation LoginWithPassword($input: AuthLoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      accountId
      role
    }
  }
`;

export async function requestLoginWithPassword(
  request: LoginWithPasswordRequest,
): Promise<AuthSession> {
  const data = await executeGraphQL<LoginWithPasswordData, LoginWithPasswordVariables>(
    LOGIN_WITH_PASSWORD_MUTATION,
    {
      input: {
        audience: 'DESKTOP',
        loginName: request.loginName,
        loginPassword: request.loginPassword,
        type: 'PASSWORD',
      },
    },
    {
      allowAuthRetry: false,
      authMode: 'none',
    },
  );

  return data.login;
}
