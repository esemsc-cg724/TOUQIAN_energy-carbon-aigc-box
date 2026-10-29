// src/pages/ppt-risk-report/report-home.tsx

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightOutlined,
  CheckOutlined,
  FileDoneOutlined,
  FilePptOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  LayoutOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, ConfigProvider, Drawer } from 'antd';

import { FileParserDesignGallery } from '@/widgets/file-parser-design-gallery';
import { LogoutMenu } from '@/features/auth';

import './report-home.css';

const workflow = [
  { title: '选择项目', description: '读取项目基础信息', icon: FolderOpenOutlined },
  { title: '资料与逐页核对', description: '上传资料，核对字段', icon: FileSearchOutlined },
  { title: '生成风控报告', description: '导出 PPTX 报告', icon: FileDoneOutlined },
];

const preparations = [
  {
    title: '立项与产权资料',
    description: '立项报告、产权证明及现场资料',
    icon: FolderOpenOutlined,
  },
  { title: '企业财务资料', description: '财务报表，支持选择报告年度', icon: FileSearchOutlined },
  {
    title: '合同与后评价',
    description: 'EMC 合同、补充协议及前序项目资料',
    icon: FileTextOutlined,
  },
];

type HomeState = { projectName: string; entered: boolean; hasOutput: boolean };
type Section = 'project' | 'review' | 'materials' | 'output';

/** The existing runtime owns all report actions; this shell observes its visible state. */
export function ReportHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLElement>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const materialsRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<HomeState>({
    projectName: '',
    entered: false,
    hasOutput: false,
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('project');
  const [isFramed] = useState(() => window.parent !== window);
  const stage = state.hasOutput ? 2 : state.entered ? 1 : 0;

  useEffect(() => {
    function sync() {
      const next = {
        projectName: window.__PPT_REPORT_FILE_WORKSPACE?.context().projectName ?? '',
        entered: Boolean(reviewRef.current && !reviewRef.current.classList.contains('is-hidden')),
        hasOutput: Boolean(outputRef.current?.querySelector('.output-list')?.childElementCount),
      };
      setState((previous) =>
        previous.projectName === next.projectName &&
        previous.entered === next.entered &&
        previous.hasOutput === next.hasOutput
          ? previous
          : next,
      );
    }

    const observer = new MutationObserver(sync);
    if (rootRef.current) {
      observer.observe(rootRef.current, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        subtree: true,
      });
    }
    window.addEventListener('ppt-report:document-context', sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('ppt-report:document-context', sync);
    };
  }, []);

  function goTo(section: Section) {
    setActiveSection(section);
    const targets = {
      project: projectRef,
      review: reviewRef,
      materials: materialsRef,
      output: outputRef,
    };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    targets[section].current?.scrollIntoView({
      behavior: reducedMotion ? 'instant' : 'smooth',
      block: 'start',
    });
    if (section === 'project') {
      projectRef.current
        ?.querySelector<HTMLInputElement>('[data-project-search]')
        ?.focus({ preventScroll: true });
    }
  }

  return (
    <ConfigProvider theme={{ token: { fontSize: 14, controlHeight: 36 } }}>
      <div
        ref={rootRef}
        className={`app-shell app-theme report-studio flex min-h-screen ${isFramed ? 'report-studio-framed' : ''}`}
        data-home-stage={stage}
      >
        <a className="studio-skip-link" href="#report-project">
          跳转到项目选择
        </a>
        <aside className="studio-sidebar flex flex-col" aria-label="报告工作台导航">
          <a
            className="studio-brand flex items-center gap-3"
            href="/"
            aria-label="投前风控工作台首页"
            onClick={(event) => {
              if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
                return;
              event.preventDefault();
              goTo('project');
            }}
          >
            <span className="studio-brand-mark">
              <SafetyCertificateOutlined />
            </span>
            <span>
              <strong>投前</strong>
              <span className="studio-brand-caption">风控工作台</span>
            </span>
          </a>

          <div className="studio-workspace-label flex items-center gap-2">
            <span className="studio-workspace-symbol">
              <LayoutOutlined />
            </span>
            <span>项目评估空间</span>
            <span className="studio-workspace-tag">PPT</span>
          </div>

          <nav className="flex flex-col gap-1">
            <p className="studio-nav-label">工作空间</p>
            <button
              className="studio-nav-item studio-nav-item-active"
              onClick={() => goTo('project')}
              type="button"
            >
              <LayoutOutlined />
              <span>报告工作台</span>
              <span className="studio-nav-indicator" />
            </button>
          </nav>

          <nav className="studio-report-nav flex flex-col gap-1" aria-label="本次报告">
            <p className="studio-nav-label">本次报告</p>
            {(
              [
                { section: 'project', label: '选择项目', number: '01', enabled: true },
                { section: 'review', label: '逐页核对', number: '02', enabled: state.entered },
                { section: 'materials', label: '资料解析', number: '03', enabled: state.entered },
                { section: 'output', label: '生成结果', number: '04', enabled: state.hasOutput },
              ] as const
            ).map((item) => (
              <button
                key={item.section}
                className="studio-nav-item studio-section-link"
                aria-current={activeSection === item.section ? 'step' : undefined}
                disabled={!item.enabled}
                onClick={() => goTo(item.section)}
                type="button"
              >
                <span className="studio-nav-number">{item.number}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="studio-sidebar-bottom mt-auto flex flex-col gap-4">
            <button className="studio-nav-item" type="button" onClick={() => setGuideOpen(true)}>
              <QuestionCircleOutlined />
              <span>使用指南</span>
              <ArrowRightOutlined />
            </button>
          </div>
        </aside>

        <div className="studio-main min-w-0 flex-1">
          <header className="studio-topbar flex items-center justify-between gap-4">
            <div className="studio-breadcrumb flex min-w-0 items-center gap-3">
              <LayoutOutlined />
              <span>工作空间</span>
              <span className="studio-breadcrumb-separator">/</span>
              <strong>{state.entered ? '报告核对' : '报告工作台'}</strong>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="studio-header-help">
                <Button
                  type="text"
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setGuideOpen(true)}
                >
                  使用指南
                </Button>
              </div>
              <LogoutMenu />
            </div>
          </header>

          <main className="studio-content">
            <div className="studio-intro flex items-end justify-between gap-6">
              <div>
                <div className="studio-eyebrow flex items-center gap-2">
                  <span />
                  投前风险评估
                </div>
                <h1>{state.entered ? '报告核对' : '风控报告'}</h1>
                <p>
                  {state.entered
                    ? state.projectName || '逐页核对项目字段，确认后生成报告。'
                    : '选择项目后，核对资料并生成 PPTX 报告。'}
                </p>
              </div>
              <span className="studio-template-badge">
                <FilePptOutlined /> 标准风控报告
              </span>
            </div>

            <ol className="studio-workflow grid" aria-label="报告生成流程">
              {workflow.map((item, index) => (
                <li
                  key={item.title}
                  data-status={index < stage ? 'done' : index === stage ? 'current' : 'upcoming'}
                  aria-current={index === stage ? 'step' : undefined}
                >
                  <span className="studio-step-number">
                    {index < stage ? <CheckOutlined /> : `0${index + 1}`}
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  {index < workflow.length - 1 && <ArrowRightOutlined />}
                </li>
              ))}
            </ol>

            <div className="studio-start-grid grid gap-6">
              <section
                ref={projectRef}
                id="report-project"
                className="studio-project-card"
                data-report-home
              >
                <div className="studio-card-heading flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="studio-section-icon">
                      <FolderOpenOutlined />
                    </span>
                    <div>
                      <h2>选择项目</h2>
                    </div>
                  </div>
                  <span className="studio-section-index">01</span>
                </div>
                <div data-input-template />
              </section>

              <aside className="studio-output-overview" aria-label="报告模板概览">
                <div className="studio-preview-heading flex items-center justify-between">
                  <span>本次报告</span>
                  <span className="studio-format-tag">PPTX</span>
                </div>
                <div className="studio-document-preview" aria-hidden="true">
                  <div className="studio-document-topline">
                    <span>报告模板</span>
                    <SafetyCertificateOutlined />
                  </div>
                  <span className="studio-document-kicker">分布式光伏项目</span>
                  <strong>
                    投前风控
                    <br />
                    评估报告
                  </strong>
                  <div className="studio-document-footer">
                    <span>项目评估 / 风险分析 / 评审意见</span>
                    <span>01</span>
                  </div>
                </div>
                <h3>模板内容</h3>
                <p>项目概况、企业资信、财务分析、合同条款及评审意见。</p>
                <div className="studio-template-meta flex items-center gap-5">
                  <span>
                    <FileTextOutlined />
                    25 页模板
                  </span>
                  <span>
                    <CheckOutlined />
                    可编辑 PPTX
                  </span>
                </div>
              </aside>
            </div>

            <section className="studio-preparation" aria-labelledby="preparation-title">
              <div className="flex items-center justify-between gap-4">
                <h2 id="preparation-title">资料清单</h2>
                <Button
                  type="link"
                  icon={<ArrowRightOutlined />}
                  iconPlacement="end"
                  onClick={() => setGuideOpen(true)}
                >
                  查看操作指南
                </Button>
              </div>
              <div className="studio-preparation-grid grid gap-5">
                {preparations.map((item) => (
                  <div className="studio-preparation-item flex gap-3" key={item.title}>
                    <span className="studio-preparation-icon">
                      <item.icon />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="studio-preparation-note flex items-center gap-2">
                <InfoCircleOutlined />
                资料可在进入工作区后上传；解析结果和 AI 分析均需人工核对。
              </p>
            </section>

            <div className="studio-report-body flex flex-col gap-6">
              <section
                ref={reviewRef}
                className="studio-review-section is-hidden"
                data-after-draft
                data-ai-draft-preview
                aria-label="报告逐页核对"
              />
              <div ref={materialsRef} className="is-hidden" data-after-draft>
                <FileParserDesignGallery />
              </div>
              <div className="studio-generate-actions actions is-hidden" data-after-draft>
                <div>
                  <strong>生成报告</strong>
                  <p>核对完成后导出 PPTX 文件。</p>
                </div>
                <button
                  className="primary"
                  data-final-generate="#schemeThreeOutput"
                  data-source="外部智能体问答系统"
                >
                  生成最终<span data-doc-label>PPT 风控报告</span>
                  <ArrowRightOutlined />
                </button>
              </div>
              <section ref={outputRef} className="studio-output-section" aria-label="报告生成结果">
                <h2>生成结果</h2>
                <div id="schemeThreeOutput" className="output-list" />
              </section>
            </div>
          </main>
        </div>

        <Drawer
          title="风控报告使用指南"
          open={guideOpen}
          onClose={() => setGuideOpen(false)}
          size={440}
        >
          <div className="studio-guide flex flex-col gap-6">
            {workflow.map((item, index) => (
              <section key={item.title}>
                <h3>
                  {`0${index + 1}`} · {item.title}
                </h3>
                <p>
                  {
                    [
                      '搜索并选择项目，核对地址、屋顶面积和装机容量，再进入报告工作区。',
                      '在逐页核对区检查字段；在资料解析区上传立项、产权、财务、EMC或后评价资料。解析结果可查看来源，核对后确认填入报告。财务文件需先确认年度；后评价资料需关联前序项目编号。',
                      '点击生成报告，完成后下载 PPTX。修改资料后需重新生成。',
                    ][index]
                  }
                </p>
              </section>
            ))}
            <div>
              <h3>核对要求</h3>
              <p>解析结果与 AI 分析需人工核对；缺失字段请补充。</p>
            </div>
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
