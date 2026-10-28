// src/app/router/index.tsx

import {
  createBrowserRouter,
  isRouteErrorResponse,
  redirect,
  RouterProvider,
  useRouteError,
} from 'react-router';

import { AppLayout } from '@/app/layout';

import { ErrorPreviewPage } from '@/pages/error-preview';
import { LoginPage } from '@/pages/login';
import {
  PptRiskReportChatbotEmbedPage,
  PptRiskReportEmbedPage,
  PptRiskReportPage,
} from '@/pages/ppt-risk-report';
import { ProjectStructurePage } from '@/pages/project-structure';
import { getAuthSession, isAuthenticated } from '@/features/auth';
import { Error403, Error404, Error500, ErrorRouteCrash } from '@/features/error-feedback';

import { getAppEnv } from '@/shared/env';

import { canAccessGame2048Lab, Game2048LabPage } from '@/labs/game-2048';
import { canAccessSandboxPlayground, SandboxPlaygroundPage } from '@/sandbox/playground';

function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 403) {
      return <Error403 />;
    }

    if (error.status === 404) {
      return <Error404 />;
    }

    if (error.status >= 500) {
      return <Error500 />;
    }
  }

  return <ErrorRouteCrash />;
}

function RouteErrorBoundary() {
  return (
    <AppLayout>
      <RouteErrorPage />
    </AppLayout>
  );
}

function game2048LabLoader() {
  if (!canAccessGame2048Lab(getAppEnv())) {
    throw redirect('/');
  }

  return null;
}

function sandboxPlaygroundLoader() {
  if (!canAccessSandboxPlayground(getAppEnv())) {
    throw redirect('/');
  }

  return null;
}

function createAuthLoader(redirectPath: string) {
  return () => {
    const hadSession = Boolean(getAuthSession());
    if (!isAuthenticated()) {
      throw redirect(`/login?redirect=${encodeURIComponent(redirectPath)}${hadSession ? '&reason=session-expired' : ''}`);
    }

    return null;
  };
}

const router = createBrowserRouter([
  {
    element: <LoginPage />,
    path: '/login',
  },
  {
    // 能碳 PPT 风控报告完整迁入页：保留原 energy-carbon-ppt-minimal 页面，不套 AIGC 顶部壳层。
    element: <PptRiskReportPage />,
    loader: createAuthLoader('/ppt-risk-report'),
    path: '/ppt-risk-report',
  },
  {
    // iframe 嵌入测试页：给外部大模型窗口使用，保留完整 PPT 工作区并开启 postMessage 通信。
    element: <PptRiskReportEmbedPage />,
    // loader: createAuthLoader('/ppt-risk-report/embed'),
    path: '/ppt-risk-report/embed',
  },
  {
    // TRACE[PPT-CHAT-001]: chatbot 专用 iframe 页，只保留 PPT 生成主流程，舍弃独立平台外壳。
    element: <PptRiskReportChatbotEmbedPage />,
    loader: createAuthLoader('/ppt-risk-report/chatbot-embed'),
    path: '/ppt-risk-report/chatbot-embed',
  },
  {
    children: [
      {
        loader: () => redirect('/ppt-risk-report/chatbot-embed'),
        index: true,
      },
      {
        element: <ProjectStructurePage />,
        path: 'project-structure',
      },
      {
        element: <ErrorPreviewPage />,
        path: 'error-preview',
      },
      {
        element: <Game2048LabPage />,
        loader: game2048LabLoader,
        path: 'labs/game-2048',
      },
      {
        element: <SandboxPlaygroundPage />,
        loader: sandboxPlaygroundLoader,
        path: 'sandbox/playground',
      },
      {
        element: <Error404 />,
        path: '*',
      },
    ],
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    path: '/',
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
