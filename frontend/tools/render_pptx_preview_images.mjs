#!/usr/bin/env node

/**
 * Render real PPTX slides into browser preview images.
 *
 * TRACE[PPT-CHAT-009]: Pixel-accurate iframe preview baseline.
 * HTML reconstruction of PPTX text, grouping, master layouts, and fonts is not
 * precise enough for production review, so the visible preview uses rendered
 * PPTX pages. The extracted element manifest remains the coordinate/tracing
 * layer, while these PNG files are the visual source of truth.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key.slice(2)] = true;
      continue;
    }
    args[key.slice(2)] = value;
    index += 1;
  }
  return args;
}

function runtimeNodeModulePath(packagePath) {
  return path.join(
    process.env.HOME || process.cwd(),
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "node",
    "node_modules",
    ...packagePath
  );
}

async function importRuntimeModule(packagePath) {
  const entrypoint = runtimeNodeModulePath(packagePath);
  return import(pathToFileURL(entrypoint).href);
}

function roundRectNumber(value) {
  return Number(value.toFixed(3));
}

function tableCellElements(slide, slideIndex) {
  const elements = [];

  // TRACE[PPT-TEMPLATE-NEW-012]: 新模板大量字段在 PPT 表格里。
  // artifact-tool 能读取表格结构，这里把单元格坐标写入 manifest，供浏览器预览做字段覆盖层。
  for (const [tableIndex, table] of (slide.tables?.items || []).entries()) {
    const frame = table.frame;
    if (!frame) continue;

    const columnWidths = table.columnWidths || [];
    const rowHeights = (table.rows || []).map((row) => row.height || 0);
    const rawWidth = columnWidths.reduce((sum, width) => sum + width, 0) || frame.width;
    const rawHeight = rowHeights.reduce((sum, height) => sum + height, 0) || frame.height;
    const scaleX = frame.width / rawWidth;
    const scaleY = frame.height / rawHeight;

    let top = frame.top;
    for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
      let left = frame.left;
      const height = (rowHeights[rowIndex] || rawHeight / table.rowCount) * scaleY;
      for (let columnIndex = 0; columnIndex < table.columnCount; columnIndex += 1) {
        const width = (columnWidths[columnIndex] || rawWidth / table.columnCount) * scaleX;
        const cell = table.getCell(rowIndex, columnIndex);
        elements.push({
          type: "tableCell",
          tableIndex,
          rowIndex,
          columnIndex,
          text: String(cell?.value ?? ""),
          rect: {
            x: roundRectNumber(left),
            y: roundRectNumber(top),
            w: roundRectNumber(width),
            h: roundRectNumber(height)
          }
        });
        left += width;
      }
      top += height;
    }
  }

  return elements.map((element) => ({
    ...element,
    id: `slide${String(slideIndex + 1).padStart(2, "0")}-table${element.tableIndex}-r${element.rowIndex}-c${element.columnIndex}`
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pptxPath = path.resolve(args.pptx || "");
  const outputDir = path.resolve(args["out-dir"] || "public/ppt-report/rendered-preview");
  const width = Number(args.width || 1280);
  const height = Number(args.height || 720);

  if (!pptxPath) throw new Error("--pptx is required");

  const { Canvas } = await importRuntimeModule([
    "@oai",
    "artifact-tool",
    "node_modules",
    "skia-canvas",
    "lib",
    "index.js"
  ]);
  const { FileBlob, PresentationFile, drawSlideToCtx } = await importRuntimeModule([
    "@oai",
    "artifact-tool",
    "dist",
    "artifact_tool.mjs"
  ]);

  let existingManifest = null;
  try {
    existingManifest = JSON.parse(await fs.readFile(path.join(outputDir, "manifest.json"), "utf8"));
  } catch {
    existingManifest = null;
  }
  const shouldReuseExistingElements = existingManifest?.source === path.basename(pptxPath);

  const presentation = await PresentationFile.importPptx(await FileBlob.load(pptxPath));
  await fs.mkdir(outputDir, { recursive: true });

  const slides = [];
  for (let index = 0; index < presentation.slides.count; index += 1) {
    const slide = presentation.slides.getItem(index);
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.scale(width / slide.frame.width, height / slide.frame.height);
    await drawSlideToCtx(
      slide,
      presentation.styles,
      ctx,
      [],
      null,
      null,
      null,
      null,
      null,
      null,
      { clearBeforeDraw: true }
    );

    const fileName = `slide-${String(index + 1).padStart(2, "0")}.png`;
    await canvas.toFile(path.join(outputDir, fileName));
    const existingSlide = shouldReuseExistingElements
      ? existingManifest?.slides?.find((item) => item.slideNo === index + 1)
      : null;
    const existingElements = Array.isArray(existingSlide?.elements) ? existingSlide.elements : [];
    slides.push({
      slideNo: index + 1,
      id: `slide${String(index + 1).padStart(2, "0")}`,
      image: fileName,
      // TRACE[PPT-TEMPLATE-NEW-012]: 文本框元素来自 extract_pptx_template_preview.py；
      // 表格单元格来自本脚本的 artifact-tool 读取结果，两者合并后供前端做字段覆盖。
      elements: [
        ...existingElements,
        ...tableCellElements(slide, index)
      ]
    });
  }

  const manifest = {
    version: 1,
    trace: "TRACE[PPT-CHAT-009]",
    source: path.basename(pptxPath),
    slideSize: { width, height },
    slides
  };
  await fs.writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(JSON.stringify({ manifest: path.join(outputDir, "manifest.json"), slides: slides.length }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
