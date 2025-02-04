/*
 * Copyright 2020 ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { HTTP_STATUS } from 'core/enums/HttpStatus';
import { login, renewToken } from '../auth';
import { getRefreshToken, isIDMEnabled } from 'core/utils/auth';
import { redirectTo } from 'core/utils/routes';
import routes from 'core/constants/routes';

export interface ResponseError extends Error {
  status?: number;
  code?: string;
}

interface FetchData<T> {
  response: T;
  error: Response;
  loading: boolean;
}

export interface FetchProps {
  responseAdd?: unknown;
  responseAll?: unknown;
  responseRemove?: unknown;
  responseArchive?: unknown;
  responseSave?: unknown;
  responseUpdate?: unknown;
  responseTest?: unknown;
  response?: unknown;
  loadingAdd?: boolean;
  loadingAll?: boolean;
  loadingRemove?: boolean;
  loadingSave?: boolean;
  loadingUpdate?: boolean;
  loadingTest?: boolean;
  loading?: boolean;
  test?: Function;
  errorTest?: unknown;
  getAll?: Function;
  findUserGroupByName?: Function;
  getById?: Function;
  save?: Function;
  update?: Function;
  remove?: Function;
  status?: FetchStatuses;
}

const renewTokenByCb = (fn: () => Promise<Response>, isLoginRequest: boolean) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn().catch(async (error: any) => {
    if (HTTP_STATUS.unauthorized === error.status) {
      try {
        if (!isLoginRequest && !isIDMEnabled()) {
          await renewToken(getRefreshToken())({});
        }
        return fn();
      } catch (error) {
        redirectTo(routes.login);
        return error;
      }
    } else {
      return Promise.reject(error);
    }
  });

const getResponse = async (response: Response) => {
  try {
    return await response.json();
  } catch (e) {
    if (response.status >= 400) {
      throw Error(e);
    } else {
      return response.status;
    }
  }
};

export type FetchParams = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any
) => (options: RequestInit) => Promise<Response>;

export const useFetchData = <T>(
  req: FetchParams
): ((...args: unknown[]) => Promise<T>) => {
  const isLoginRequest = login === req;

  return useCallback(
    async (...args: unknown[]) => {
      const response = await renewTokenByCb(
        () => req(...args)({}),
        isLoginRequest
      );
      const data = await getResponse(response);
      return data;
    },
    [isLoginRequest, req]
  );
};

export const useFetch = <T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: (...args: any) => (options: RequestInit) => Promise<Response>
): [
  FetchData<T>,
  (...args: unknown[]) => void,
  (...args: unknown[]) => Promise<T>
] => {
  const [response, setResponse] = useState<T>();
  const [error, setError] = useState<Response>(null);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const isLoginRequest = login === req;

  const promise = async (...args: unknown[]) => {
    setLoading(true);
    const response = await renewTokenByCb(
      () => req(...args)({}),
      isLoginRequest
    );
    const data = await getResponse(response);
    setLoading(false);
    return data;
  };

  const trigger = useCallback(
    async (...args: unknown[]) => {
      setLoading(true);
      try {
        const response = await renewTokenByCb(
          () => req(...args)({}),
          isLoginRequest
        );
        const data = await getResponse(response);

        if (mounted.current) setResponse(data);
      } catch (error) {
        if (mounted.current) setError(error);
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [req, mounted, isLoginRequest]
  );

  useEffect(() => {
    return () => {
      mounted.current = false
    };
  }, []);

  return [{ response, error, loading }, trigger, promise];
};

export interface FetchStatus {
  idle: () => void;
  pending: () => void;
  resolved: () => void;
  rejected: () => void;
  isIdle: boolean;
  isPending: boolean;
  isResolved: boolean;
  isRejected: boolean;
}
export type FetchStatuses = 'idle' | 'pending' | 'resolved' | 'rejected';

export const useFetchStatus = (): FetchStatus => {
  const [status, setStatus] = useState<FetchStatuses>('idle');

  const idle = useCallback(() => setStatus('idle'), []);
  const pending = useCallback(() => setStatus('pending'), []);
  const resolved = useCallback(() => setStatus('resolved'), []);
  const rejected = useCallback(() => setStatus('rejected'), []);

  const isIdle = status === 'idle';
  const isPending = status === 'pending';
  const isResolved = status === 'resolved';
  const isRejected = status === 'rejected';

  return {
    idle,
    pending,
    resolved,
    rejected,
    isIdle,
    isPending,
    isResolved,
    isRejected
  };
};
