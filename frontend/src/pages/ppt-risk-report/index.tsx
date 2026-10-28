// src/pages/ppt-risk-report/index.tsx

import { useEffect, useState } from 'react';

import { FileParserDesignGallery } from '@/widgets/file-parser-design-gallery';

import { fetchWithSession, getAccessToken, LogoutMenu } from '@/features/auth';

import { getGraphQLEndpoint, getPptDocumentParseEndpoint } from '@/shared/env';

import {
  type PptReportEmbedContext,
  readPptReportEmbedContext,
} from './infrastructure/embed-context';

declare global {
  interface Window {
    __PPT_REPORT_EMBED_CONTEXT?: PptReportEmbedContext;
    __PPT_REPORT_DOCUMENT_PARSE_ENDPOINT?: string;
    __PPT_REPORT_GRAPHQL_ENDPOINT?: string;
    __PPT_REPORT_ACCESS_TOKEN?: () => string | null;
    __PPT_REPORT_FETCH?: typeof fetch;
    __PPT_OA_PROJECT_CLIENT_LOADED?: boolean;
    __PPT_REPORT_LEGACY_SCRIPT_LOADED?: boolean;
    __PPT_REPORT_SETUP_PAGE?: () => void;
  }
}

type PptRiskReportPageProps = {
  readonly embedMode?: boolean;
};

type PptReportRuntimeOptions = {
  readonly bodyClassName: string;
  readonly embedMode: boolean;
};

function notifyEmbedReady(context: PptReportEmbedContext) {
  // TRACE[PPT-IFR-003]: 第一阶段本地测试只需要确认 iframe 已加载，并让父窗口能收到 READY 消息。
  if (window.parent === window) {
    return;
  }

  window.parent.postMessage(
    {
      projectId: context.projectId,
      sessionId: context.sessionId,
      type: 'PPT_REPORT_READY',
    },
    context.parentOrigin || '*',
  );
}

function ensurePptReportStylesheet() {
  const linkId = 'ppt-report-legacy-stylesheet';
  if (document.getElementById(linkId)) {
    return;
  }

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = '/ppt-report/document-generation-prototypes.css?v=20261026-7';
  document.head.appendChild(link);
}

function ensurePptOaProjectClientScript(): Promise<void> {
  if (window.__PPT_OA_PROJECT_CLIENT_LOADED) {
    return Promise.resolve();
  }

  const scriptId = 'ppt-oa-project-client-script';
  const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (existingScript) {
    // TRACE[PPT-FE-OA-006]: 热更新时可能已有脚本标签但全局对象还没注册完成，这里等 load 事件即可。
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('OA 项目客户端脚本加载失败。')),
        {
          once: true,
        },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = '/ppt-report/ppt-oa-project-client.js';
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('OA 项目客户端脚本加载失败。')), {
      once: true,
    });
    document.body.appendChild(script);
  });
}

function ensurePptReportScript() {
  if (window.__PPT_REPORT_LEGACY_SCRIPT_LOADED) {
    window.__PPT_REPORT_SETUP_PAGE?.();
    return;
  }

  const scriptId = 'ppt-report-legacy-script';
  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    // TRACE[PPT-CHAT-001]: 开发热更新或 iframe 重挂载时避免重复插入 legacy JS，防止全局 const 重复声明。
    return;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.src = '/ppt-report/document-generation-prototypes.js?v=20261026-8';
  script.defer = true;
  document.body.appendChild(script);
}

function usePptReportLegacyRuntime({ bodyClassName, embedMode }: PptReportRuntimeOptions) {
  useEffect(() => {
    const previousClassName = document.body.className;

    // TRACE[PPT-IFR-001]: 嵌入版会把 session/project/token 暴露给 legacy JS，用于 GraphQL 鉴权和 postMessage 回传。
    const embedContext = embedMode ? readPptReportEmbedContext() : undefined;
    window.__PPT_REPORT_EMBED_CONTEXT = embedContext;
    window.__PPT_REPORT_ACCESS_TOKEN = getAccessToken;
    window.__PPT_REPORT_FETCH = fetchWithSession;
    window.__PPT_REPORT_GRAPHQL_ENDPOINT = getGraphQLEndpoint();
    // TRACE[PPT-DOC-021]: legacy JS 通过全局运行时配置读取上传解析接口，避免把客户后端地址写死在 public JS。
    window.__PPT_REPORT_DOCUMENT_PARSE_ENDPOINT = getPptDocumentParseEndpoint();
    document.body.className = bodyClassName;
    ensurePptReportStylesheet();
    // TRACE[PPT-FE-OA-006]: legacy PPT 页面需要先拿到 OA GraphQL client，再绑定项目下拉读取后端字段。
    void ensurePptOaProjectClientScript()
      .catch((error) => {
        console.warn(
          '[PPT-FE-OA-006] OA 项目客户端脚本加载失败，legacy 页面会使用 fetch 兜底。',
          error,
        );
      })
      .finally(() => {
        ensurePptReportScript();
      });
    if (embedContext) {
      notifyEmbedReady(embedContext);
    }

    return () => {
      // TRACE[PPT-IFR-001]: 路由离开时恢复 body，避免嵌入页样式污染 AIGC 其他页面。
      window.__PPT_REPORT_EMBED_CONTEXT = undefined;
      window.__PPT_REPORT_ACCESS_TOKEN = undefined;
      window.__PPT_REPORT_FETCH = undefined;
      window.__PPT_REPORT_DOCUMENT_PARSE_ENDPOINT = undefined;
      document.body.className = previousClassName;
    };
  }, [bodyClassName, embedMode]);
}

/**
 * PPT 风控报告完整页面。
 *
 * 这里不是重新设计页面，而是把 energy-carbon-ppt-minimal 的方案三完整迁入 AIGC 大盒子：
 * - 页面结构保留原 doc-gen-scheme-3.html
 * - 视觉样式保留原 document-generation-prototypes.css
 * - 交互逻辑保留原 document-generation-prototypes.js
 * - 后端调用改为 AIGC backend GraphQL
 */
export function PptRiskReportPage({ embedMode = false }: PptRiskReportPageProps) {
  const [projectSummary, setProjectSummary] = useState({ projectName: '请选择项目', city: '', roofArea: '', capacity: '' });
  useEffect(() => {
    const sync = () => {
      const context = window.__PPT_REPORT_FILE_WORKSPACE?.context();
      if (context) setProjectSummary({projectName: context.projectName, city: context.city ?? '', roofArea: context.roofArea ?? '', capacity: context.capacity ?? ''});
    };
    sync();
    window.addEventListener('ppt-report:document-context', sync);
    return () => window.removeEventListener('ppt-report:document-context', sync);
  }, []);
  usePptReportLegacyRuntime({
    bodyClassName: embedMode
      ? 'platform-prototype scheme-three-desktop ppt-report-embed'
      : 'platform-prototype scheme-three-desktop',
    embedMode,
  });

  return (
    <main className="scheme3-page">
      <header className="scheme3-topbar">
        <div className="scheme3-title">
          <div className="assistant-orb small" />
          <div>
            <strong>风控报告生成平台</strong>
            <span>独立网页平台 · PPT 风控报告生成</span>
          </div>
        </div>
      </header>

      <section className="scheme3-shell">
        <aside className="scheme3-side">
          <section className="side-card">
            <span>当前项目</span>
            <strong>{projectSummary.projectName}</strong>
            <dl>
              <dt>城市</dt>
              <dd>{projectSummary.city || '待填写'}</dd>
              <dt>屋顶面积</dt>
              <dd>{projectSummary.roofArea && projectSummary.roofArea !== '待填写' ? `${projectSummary.roofArea} 平方米` : '待填写'}</dd>
              <dt>装机容量</dt>
              <dd>{projectSummary.capacity && projectSummary.capacity !== '待填写' ? `${projectSummary.capacity} MW` : '待填写'}</dd>
            </dl>
          </section>
          <section className="side-card">
            <span>输出文件</span>
            <div className="side-file">PPT 风控报告</div>
          </section>
        </aside>

        <section className="scheme3-workspace">
          <div className="feature-title">
            <span>方案三</span>
            <h2>风控报告生成</h2>
          </div>
          <div className="draft-stack">
            <section className="phase-card">
              <h3 className="block-title">输入模板</h3>
              <div data-input-template />
            </section>
            <section className="phase-card is-hidden" data-after-draft data-ai-draft-preview />
            <div className="is-hidden" data-after-draft>
              <FileParserDesignGallery />
            </div>
            <div className="actions is-hidden" data-after-draft>
              <button
                className="primary"
                data-final-generate="#schemeThreeOutput"
                data-source="独立投前文档平台"
              >
                生成最终<span data-doc-label>PPT 风控报告</span>
              </button>
            </div>
          </div>
        </section>

        <aside className="scheme3-insight">
          <div id="schemeThreeOutput" className="output-list" />
        </aside>
      </section>
    </main>
  );
}

export function PptRiskReportEmbedPage() {
  // TRACE[PPT-IFR-001]: iframe 版本复用完整页面，只额外开启嵌入上下文和父窗口通信。
  return <PptRiskReportPage embedMode />;
}

export function PptRiskReportChatbotEmbedPage() {
  usePptReportLegacyRuntime({
    bodyClassName:
      'platform-prototype scheme-three-desktop ppt-report-embed ppt-report-chatbot-embed',
    embedMode: true,
  });

  return (
    <main className="scheme3-page ppt-chatbot-page">
      <div className="ppt-chatbot-auth-menu">
        <LogoutMenu />
      </div>
      <section className="scheme3-shell ppt-chatbot-shell">
        <section className="scheme3-workspace ppt-chatbot-workspace">
          <div className="feature-title">
            <span>智能体调用</span>
            <h2>PPT 风控报告生成</h2>
          </div>
          <div className="draft-stack">
            <section className="phase-card">
              <h3 className="block-title">输入模板</h3>
              <div data-input-template />
            </section>
            <section className="phase-card is-hidden" data-after-draft data-ai-draft-preview />
            <div className="is-hidden" data-after-draft>
              <FileParserDesignGallery />
            </div>
            <div className="actions is-hidden" data-after-draft>
              <button
                className="primary"
                data-final-generate="#schemeThreeOutput"
                data-source="外部智能体问答系统"
              >
                生成最终<span data-doc-label>PPT 风控报告</span>
              </button>
            </div>
            <section className="phase-card ppt-chatbot-output-card">
              <h3 className="block-title">生成结果</h3>
              <div id="schemeThreeOutput" className="output-list" />
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
