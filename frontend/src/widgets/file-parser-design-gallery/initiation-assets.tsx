import { useEffect, useState } from "react";
import { Alert, Button, Image, Space, Typography } from "antd";

export type InitiationAssetSnapshot = {
  projectCode: string;
  status: "idle" | "loading" | "loaded" | "error";
  assets: { assetId: string; url: string; caption: string; sourceFileId: string | null; sourceVersion: number; sourceType: string }[];
};

export function selectInitiationAssets(snapshot: InitiationAssetSnapshot | null, projectCode: string,
  sourceFileId: string | undefined, sourceVersion: number | undefined, parserStatus: string | undefined) {
  if (!projectCode || snapshot?.projectCode !== projectCode || !sourceFileId || !sourceVersion || parserStatus !== "READY") return [];
  return snapshot.assets.filter(asset => asset.sourceType === "PROJECT_INITIATION_REPORT" &&
    asset.sourceFileId === sourceFileId && asset.sourceVersion === sourceVersion);
}

export function InitiationAssets({ projectCode, sourceFileId, sourceVersion, sourceFileName, parserStatus }: {
  projectCode: string;
  sourceFileId?: string;
  sourceVersion?: number;
  sourceFileName?: string;
  parserStatus?: string;
}) {
  const [snapshot, setSnapshot] = useState<InitiationAssetSnapshot | null>(null);
  useEffect(() => {
    if (!sourceFileId || !sourceVersion || parserStatus !== "READY") return;
    let active = true;
    const unsubscribe = window.__PPT_REPORT_FILE_WORKSPACE?.subscribeAssets?.(next => {
      if (active) setSnapshot(next);
    });
    return () => { active = false; unsubscribe?.(); };
  }, [projectCode, sourceFileId, sourceVersion, parserStatus]);

  const ready = Boolean(sourceFileId && sourceVersion && sourceFileName && parserStatus === "READY");
  const current = ready && snapshot?.projectCode === projectCode ? snapshot : null;
  const assets = ready ? selectInitiationAssets(current, projectCode, sourceFileId, sourceVersion, parserStatus) : [];
  const loading = current?.status === "loading";
  const message = !projectCode ? "请先选择项目。"
    : !sourceFileId ? "尚未读取本项目的立项报告。请上传报告，或点击左侧“刷新结果”读取服务器已保存的资料。"
    : loading ? "正在读取立项报告图片…"
    : current?.status === "error" ? "图片读取失败，请点击“刷新图片”重试。"
    : parserStatus === "FAILED" ? "立项报告解析失败，请先完成解析后查看图片。"
    : parserStatus !== "READY" ? "立项报告解析完成后，这里会显示提取的图片。"
    : "当前立项报告未提取到屋顶、厂区或资信截图。";

  return (
    <section className="initiation-asset-panel" aria-label="立项报告提取图片">
      <Space wrap style={{ marginBottom: 8 }}>
        <Typography.Text strong>立项报告提取图片（{assets.length}）</Typography.Text>
        <Button size="small" disabled={!projectCode || !ready || loading} loading={loading}
          onClick={() => void window.__PPT_REPORT_FILE_WORKSPACE?.refreshAssets?.()}>
          刷新图片
        </Button>
      </Space>
      {sourceFileName && <Typography.Paragraph type="secondary">来源文件：{sourceFileName}（版本 {sourceVersion}）</Typography.Paragraph>}
      <Typography.Paragraph type="secondary">与上方PPT预览使用同一批图片，点击图片可放大核对。</Typography.Paragraph>
      {assets.length ? (
        <Image.PreviewGroup key={`${projectCode}:${sourceFileId}:${sourceVersion}`}>
          <div className="initiation-asset-grid">
            {assets.map(asset => (
              <figure key={asset.assetId}>
                {asset.url
                  ? <Image src={asset.url} alt={asset.caption} width="100%" />
                  : <Alert type="warning" showIcon title="此图片读取失败，请刷新图片重试。" />}
                <figcaption>{asset.caption}</figcaption>
              </figure>
            ))}
          </div>
        </Image.PreviewGroup>
      ) : <Alert type={current?.status === "error" ? "warning" : "info"} showIcon title={message} />}
    </section>
  );
}
