// src/widgets/ppt-report-workspace/index.tsx

import { useMemo, useState } from 'react';
import { DownloadOutlined, FilePptOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Input, Select, Space, Statistic, Tabs, Tag, Typography } from 'antd';

import { generatePptReport } from '@/features/generate-ppt-report';
import { requestAiReportFields } from '@/features/request-ai-report-fields';

import { DEMO_ENERGY_PROJECTS, type EnergyProjectSnapshot,findEnergyProject } from '@/entities/energy-project';
import {
  DEFAULT_PPT_REPORT_FIELDS,
  type GeneratedPptReport,
  getPptReportCompletion,
  PPT_REPORT_SLIDES,
  type PptReportFields,
} from '@/entities/ppt-report';

const { Text, Title } = Typography;
const { TextArea } = Input;

function projectToFields(project: EnergyProjectSnapshot): PptReportFields {
  return {
    ...DEFAULT_PPT_REPORT_FIELDS,
    annualGeneration: project.annualGeneration ?? '',
    annualRevenue: project.annualRevenue ?? '',
    capacity: project.capacity ?? '',
    investment: project.investment ?? '',
    irr: project.irr ?? '',
    projectCode: project.projectCode ?? '',
    projectName: project.projectName,
    roofArea: project.roofArea ?? '',
    userCompany: project.userCompany ?? '',
  };
}

/**
 * PPT 风控报告工作台。
 *
 * 它承接“大模型对话后出来的确认页”：左侧项目快照，中间字段确认和模拟 PPT，右侧输出结果。
 */
export function PptReportWorkspace() {
  const [projectId, setProjectId] = useState(DEMO_ENERGY_PROJECTS[0].id);
  const [fields, setFields] = useState<PptReportFields>(() => projectToFields(DEMO_ENERGY_PROJECTS[0]));
  const [selectedSlideId, setSelectedSlideId] = useState(PPT_REPORT_SLIDES[0].id);
  const [draftProvider, setDraftProvider] = useState<string>('等待生成');
  const [generatedReport, setGeneratedReport] = useState<GeneratedPptReport | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const selectedProject = useMemo(() => findEnergyProject(projectId), [projectId]);
  const selectedSlide = PPT_REPORT_SLIDES.find((slide) => slide.id === selectedSlideId) ?? PPT_REPORT_SLIDES[0];
  const completion = getPptReportCompletion(fields);

  async function handleDraftFields() {
    setIsDrafting(true);
    try {
      const result = await requestAiReportFields({
        project: selectedProject,
        seedFields: fields,
      });
      setFields((previousFields) => ({ ...previousFields, ...result.fields }));
      setDraftProvider(`${result.provider}${result.mock ? ' / mock' : ''}`);
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleGenerateReport() {
    setIsGenerating(true);
    try {
      const result = await generatePptReport({
        fields,
        project: selectedProject,
      });
      setGeneratedReport(result);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleProjectChange(nextProjectId: string) {
    const nextProject = findEnergyProject(nextProjectId);
    setProjectId(nextProjectId);
    setFields(projectToFields(nextProject));
    setGeneratedReport(null);
    setDraftProvider('等待生成');
  }

  function updateField(key: string, value: string) {
    setFields((previousFields) => ({ ...previousFields, [key]: value }));
  }

  return (
    <div className="ppt-report-shell">
      <section className="ppt-report-side">
        <Card title="当前项目">
          <div className="ppt-report-stack">
            <Select
              aria-label="选择能源项目"
              options={DEMO_ENERGY_PROJECTS.map((project) => ({
                label: project.projectName,
                value: project.id,
              }))}
              value={projectId}
              onChange={handleProjectChange}
            />
            <Descriptions
              column={1}
              items={[
                { key: 'code', label: '项目编号', children: selectedProject.projectCode },
                { key: 'city', label: '城市', children: selectedProject.city },
                { key: 'capacity', label: '装机容量', children: selectedProject.capacity },
                { key: 'investment', label: '预算投资', children: selectedProject.investment },
                { key: 'irr', label: 'IRR', children: selectedProject.irr },
              ]}
              size="small"
            />
          </div>
        </Card>

        <Card title="生成状态">
          <div className="ppt-report-status-grid">
            <Statistic suffix="%" title="字段完成度" value={completion} />
            <Statistic title="AI 草稿" value={draftProvider} />
          </div>
        </Card>
      </section>

      <section className="ppt-report-main">
        <Card>
          <div className="ppt-report-heading-row">
            <div>
              <Title level={3}>PPT 风控报告确认页</Title>
              <Text type="secondary">
                对话生成字段后，在这里复核关键页内容，再写入真实 PPTX 模板。
              </Text>
            </div>
            <Space>
              <Button icon={<RobotOutlined />} loading={isDrafting} onClick={handleDraftFields}>
                生成字段草稿
              </Button>
              <Button
                icon={<FilePptOutlined />}
                loading={isGenerating}
                type="primary"
                onClick={handleGenerateReport}
              >
                生成最终 PPT
              </Button>
            </Space>
          </div>
        </Card>

        <Card title="页面字段确认">
          <Tabs
            activeKey={selectedSlideId}
            items={PPT_REPORT_SLIDES.map((slide) => ({
              key: slide.id,
              label: `${slide.index} ${slide.title}`,
            }))}
            onChange={setSelectedSlideId}
          />
          <div className="ppt-report-field-grid">
            {selectedSlide.fields.map((field) => (
              <label className="ppt-report-field" key={field.key}>
                <span>
                  {field.label}
                  <Tag>{field.source}</Tag>
                </span>
                {field.type === 'textarea' ? (
                  <TextArea
                    rows={4}
                    value={fields[field.key] ?? ''}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                ) : (
                  <Input
                    value={fields[field.key] ?? ''}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        </Card>

        <Card title="模拟 PPT 预览">
          <article className="ppt-report-preview">
            <header>
              <span>{selectedSlide.index}</span>
              <strong>{selectedSlide.title}</strong>
            </header>
            <div className="ppt-report-preview-grid">
              {selectedSlide.fields.map((field) => (
                <div className="ppt-report-preview-item" key={field.key}>
                  <span>{field.label}</span>
                  <p>{fields[field.key] || '待补充'}</p>
                </div>
              ))}
            </div>
          </article>
        </Card>
      </section>

      <section className="ppt-report-output">
        <Card title="输出文件">
          {generatedReport ? (
            <div className="ppt-report-stack">
              <Alert message="PPTX 已生成" showIcon type="success" />
              <Text strong>{generatedReport.fileName}</Text>
              <Text type="secondary">{Math.round(generatedReport.bytes / 1024)} KB</Text>
              <Button
                href={generatedReport.downloadUrl}
                icon={<DownloadOutlined />}
                target="_blank"
                type="primary"
              >
                下载 PPTX
              </Button>
            </div>
          ) : (
            <Alert
              message="等待生成"
              description="字段确认后点击生成，后端会调用真实 PPTX 模板输出文件。"
              showIcon
              type="info"
            />
          )}
        </Card>
      </section>
    </div>
  );
}
