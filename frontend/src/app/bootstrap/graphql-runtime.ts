// src/app/bootstrap/graphql-runtime.ts

import { getAccessToken } from '@/features/auth';

import { configureGraphQLRuntime } from '@/shared/graphql';

export function bootstrapGraphQLRuntime() {
  configureGraphQLRuntime({
    getAccessToken,
  });
}
