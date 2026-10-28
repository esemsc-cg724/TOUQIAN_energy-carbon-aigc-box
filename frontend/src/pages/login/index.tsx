// src/pages/login/index.tsx

import { useMemo, useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router';

import { loginWithPassword } from '@/features/auth';

import { isGraphQLIngressError } from '@/shared/graphql';

type LoginFormValues = Readonly<{
  loginName: string;
  loginPassword: string;
}>;

function normalizeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/ppt-risk-report';
  }

  return value;
}

function getLoginErrorMessage(error: unknown): string {
  if (isGraphQLIngressError(error)) {
    if (error.type === 'network') {
      return error.userMessage;
    }

    return '账号或密码错误，请重新输入。';
  }

  return error instanceof Error ? error.message : '登录失败，请稍后重试。';
}

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectPath = useMemo(
    () => normalizeRedirectPath(searchParams.get('redirect')),
    [searchParams],
  );

  async function handleFinish(values: LoginFormValues) {
    setErrorMessage(null);

    try {
      await loginWithPassword(values);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Card variant="outlined">
          <div className="mb-6 text-center">
            <Typography.Title level={3}>账号登录</Typography.Title>
            <Typography.Text type="secondary">登录后进入 PPT 风控报告生成平台</Typography.Text>
          </div>

          {errorMessage ? (
            <div className="mb-4">
              <Alert message={errorMessage} showIcon type="error" />
            </div>
          ) : null}

          {searchParams.get('reason') === 'session-expired' ? (
            <div className="mb-4">
              <Alert message="登录已过期或失效，请重新登录，登录后将返回原页面。" showIcon type="info" />
            </div>
          ) : null}

          <Form<LoginFormValues> layout="vertical" onFinish={handleFinish} requiredMark={false}>
            <Form.Item
              label="账号"
              name="loginName"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input
                autoComplete="username"
                prefix={<UserOutlined />}
                placeholder="请输入账号或邮箱"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="loginPassword"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Button block htmlType="submit" type="primary">
              登录
            </Button>
          </Form>
        </Card>
      </div>
    </main>
  );
}
