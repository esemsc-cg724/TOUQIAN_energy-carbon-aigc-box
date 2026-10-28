#!/usr/bin/env python3
"""Extract a browser-renderable preview manifest from the real PPTX template.

TRACE[PPT-CHAT-008]: The chatbot iframe preview must be based on the PPTX
template itself, not a hand-built mock. This script converts slide OOXML into a
bounded JSON manifest and copies referenced PPTX media files into public assets.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import posixpath
import shutil
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

SLIDE_PIXEL_WIDTH = 1280
SLIDE_PIXEL_HEIGHT = 720


@dataclass(frozen=True)
class GroupTransform:
    x: float
    y: float
    cx: float
    cy: float
    ch_x: float
    ch_y: float
    ch_cx: float
    ch_cy: float


def ns_attr(node: ET.Element, namespace: str, name: str) -> str | None:
    return node.attrib.get(f"{{{NS[namespace]}}}{name}")


def int_attr(node: ET.Element | None, name: str, default: int = 0) -> int:
    if node is None:
        return default
    value = node.attrib.get(name)
    return int(value) if value is not None else default


def safe_float(value: float) -> float:
    return round(value, 3)


def map_rect(transform: GroupTransform, off: ET.Element, ext: ET.Element) -> dict[str, float]:
    scale_x = transform.cx / transform.ch_cx if transform.ch_cx else 1
    scale_y = transform.cy / transform.ch_cy if transform.ch_cy else 1
    x = transform.x + (int_attr(off, "x") - transform.ch_x) * scale_x
    y = transform.y + (int_attr(off, "y") - transform.ch_y) * scale_y
    w = int_attr(ext, "cx") * scale_x
    h = int_attr(ext, "cy") * scale_y
    return {"x": safe_float(x), "y": safe_float(y), "w": safe_float(w), "h": safe_float(h)}


def scale_rect(rect: dict[str, float], slide_cx: int, slide_cy: int) -> dict[str, float]:
    return {
        "x": safe_float(rect["x"] / slide_cx * SLIDE_PIXEL_WIDTH),
        "y": safe_float(rect["y"] / slide_cy * SLIDE_PIXEL_HEIGHT),
        "w": safe_float(rect["w"] / slide_cx * SLIDE_PIXEL_WIDTH),
        "h": safe_float(rect["h"] / slide_cy * SLIDE_PIXEL_HEIGHT),
    }


def first_child(node: ET.Element | None, path: str) -> ET.Element | None:
    return node.find(path, NS) if node is not None else None


def parse_theme_colors(pptx: zipfile.ZipFile) -> dict[str, str]:
    theme_names = [name for name in pptx.namelist() if name.startswith("ppt/theme/theme") and name.endswith(".xml")]
    if not theme_names:
        return {}

    root = ET.fromstring(pptx.read(sorted(theme_names)[0]))
    scheme = root.find(".//a:clrScheme", NS)
    colors: dict[str, str] = {}
    if scheme is None:
        return colors

    for child in list(scheme):
        key = child.tag.rsplit("}", 1)[-1]
        srgb = child.find(".//a:srgbClr", NS)
        sysclr = child.find(".//a:sysClr", NS)
        if srgb is not None and srgb.attrib.get("val"):
            colors[key] = srgb.attrib["val"].upper()
        elif sysclr is not None and sysclr.attrib.get("lastClr"):
            colors[key] = sysclr.attrib["lastClr"].upper()
    return colors


def adjust_luminance(hex_value: str, color_node: ET.Element) -> str:
    lum_mod = 100000
    lum_off = 0
    for child in list(color_node):
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "lumMod":
            lum_mod = int(child.attrib.get("val", lum_mod))
        elif tag == "lumOff":
            lum_off = int(child.attrib.get("val", lum_off))

    if lum_mod == 100000 and lum_off == 0:
        return f"#{hex_value}"

    channels = [int(hex_value[index : index + 2], 16) for index in (0, 2, 4)]
    adjusted = [
        max(0, min(255, round(channel * lum_mod / 100000 + 255 * lum_off / 100000)))
        for channel in channels
    ]
    return "#" + "".join(f"{channel:02X}" for channel in adjusted)


def color_from_node(node: ET.Element | None, theme_colors: dict[str, str]) -> str | None:
    if node is None:
        return None

    srgb = node.find("a:srgbClr", NS)
    if srgb is not None and srgb.attrib.get("val"):
        return adjust_luminance(srgb.attrib["val"].upper(), srgb)

    scheme = node.find("a:schemeClr", NS)
    if scheme is not None:
        key = scheme.attrib.get("val", "")
        hex_value = theme_colors.get(key)
        if hex_value:
            return adjust_luminance(hex_value, scheme)

    return None


def extract_fill(node: ET.Element | None, theme_colors: dict[str, str]) -> str | None:
    if node is None or node.find("a:noFill", NS) is not None:
        return None
    return color_from_node(node.find("a:solidFill", NS), theme_colors)


def extract_line(node: ET.Element | None, theme_colors: dict[str, str]) -> dict[str, Any] | None:
    line = first_child(node, "a:ln")
    if line is None or line.find("a:noFill", NS) is not None:
        return None
    color = color_from_node(line.find("a:solidFill", NS), theme_colors)
    width = int(line.attrib.get("w", "0")) if line.attrib.get("w") else 0
    return {
        "color": color,
        "width": safe_float(width / 914400 * 96) if width else 1,
    }


def text_runs(node: ET.Element) -> list[str]:
    paragraphs = []
    for paragraph in node.findall(".//a:p", NS):
        chunks = [text.text or "" for text in paragraph.findall(".//a:t", NS)]
        paragraphs.append("".join(chunks))
    return paragraphs


def extract_text_style(shape: ET.Element, theme_colors: dict[str, str]) -> dict[str, Any]:
    body = shape.find("p:txBody", NS)
    body_pr = first_child(body, "a:bodyPr")
    first_rpr = first_child(body, ".//a:rPr")
    def_rpr = first_child(body, ".//a:defRPr")
    first_ppr = first_child(body, ".//a:pPr")
    style_node = first_rpr or def_rpr

    font_size = 16
    if style_node is not None and style_node.attrib.get("sz"):
        font_size = int(style_node.attrib["sz"]) / 100 * 96 / 72

    return {
        "fontSize": safe_float(font_size),
        "bold": (style_node.attrib.get("b") == "1") if style_node is not None else False,
        "color": color_from_node(first_child(style_node, "a:solidFill"), theme_colors) if style_node is not None else None,
        "align": first_ppr.attrib.get("algn", "left") if first_ppr is not None else "left",
        "verticalAlign": body_pr.attrib.get("anchor", "top") if body_pr is not None else "top",
        "insets": {
            "left": safe_float(int(body_pr.attrib.get("lIns", "91440")) / 914400 * 96) if body_pr is not None else 9.6,
            "right": safe_float(int(body_pr.attrib.get("rIns", "91440")) / 914400 * 96) if body_pr is not None else 9.6,
            "top": safe_float(int(body_pr.attrib.get("tIns", "45720")) / 914400 * 96) if body_pr is not None else 4.8,
            "bottom": safe_float(int(body_pr.attrib.get("bIns", "45720")) / 914400 * 96) if body_pr is not None else 4.8,
        },
    }


def shape_name(shape: ET.Element, kind: str) -> dict[str, str]:
    path = "./p:nvSpPr/p:cNvPr" if kind == "shape" else "./p:nvPicPr/p:cNvPr"
    node = shape.find(path, NS)
    return dict(node.attrib) if node is not None else {}


def transform_for(node: ET.Element) -> tuple[ET.Element, ET.Element] | None:
    xfrm = node.find(".//a:xfrm", NS)
    off = first_child(xfrm, "a:off")
    ext = first_child(xfrm, "a:ext")
    if off is None or ext is None:
        return None
    return off, ext


def group_transform(parent: GroupTransform, group: ET.Element) -> GroupTransform | None:
    xfrm = first_child(group.find("p:grpSpPr", NS), "a:xfrm")
    off = first_child(xfrm, "a:off")
    ext = first_child(xfrm, "a:ext")
    ch_off = first_child(xfrm, "a:chOff")
    ch_ext = first_child(xfrm, "a:chExt")
    if off is None or ext is None or ch_off is None or ch_ext is None:
        return None

    rect = map_rect(parent, off, ext)
    return GroupTransform(
        rect["x"],
        rect["y"],
        rect["w"],
        rect["h"],
        int_attr(ch_off, "x"),
        int_attr(ch_off, "y"),
        int_attr(ch_ext, "cx", 1),
        int_attr(ch_ext, "cy", 1),
    )


def normalize_target(base: str, target: str) -> str:
    return posixpath.normpath(posixpath.join(posixpath.dirname(base), target))


def parse_part_rels(pptx: zipfile.ZipFile, part_name: str) -> dict[str, str]:
    rel_name = posixpath.join(
        posixpath.dirname(part_name),
        "_rels",
        f"{posixpath.basename(part_name)}.rels",
    )
    if rel_name not in pptx.namelist():
        return {}
    root = ET.fromstring(pptx.read(rel_name))
    rels = {}
    for rel in root.findall("rel:Relationship", NS):
        rel_id = rel.attrib.get("Id")
        target = rel.attrib.get("Target")
        if rel_id and target:
            rels[rel_id] = normalize_target(part_name, target)
    return rels


def has_placeholder(node: ET.Element) -> bool:
    return node.find(".//p:ph", NS) is not None


def collect_elements(
    node: ET.Element,
    transform: GroupTransform,
    slide_cx: int,
    slide_cy: int,
    theme_colors: dict[str, str],
    rels: dict[str, str],
    media_files: set[str],
    elements: list[dict[str, Any]],
    skip_placeholders: bool = False,
) -> None:
    for child in list(node):
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "grpSp":
            nested = group_transform(transform, child)
            if nested is not None:
                collect_elements(
                    child,
                    nested,
                    slide_cx,
                    slide_cy,
                    theme_colors,
                    rels,
                    media_files,
                    elements,
                    skip_placeholders,
                )
            continue

        if tag not in {"sp", "pic"}:
            continue

        if skip_placeholders and has_placeholder(child):
            continue

        xfrm = transform_for(child)
        if xfrm is None:
            continue
        off, ext = xfrm
        rect = scale_rect(map_rect(transform, off, ext), slide_cx, slide_cy)

        if tag == "pic":
            blip = child.find(".//a:blip", NS)
            embed = ns_attr(blip, "r", "embed") if blip is not None else None
            media = rels.get(embed or "")
            if media:
                media_files.add(media)
            elements.append(
                {
                    "type": "image",
                    "name": shape_name(child, "image"),
                    "rect": rect,
                    "src": f"media/{Path(media).name}" if media else None,
                }
            )
            continue

        text = "\n".join(text_runs(child)).strip()
        sp_pr = child.find("p:spPr", NS)
        geom = first_child(sp_pr, "a:prstGeom")
        element_type = "text" if text else "shape"
        elements.append(
            {
                "type": element_type,
                "name": shape_name(child, "shape"),
                "rect": rect,
                "text": text,
                "geometry": geom.attrib.get("prst", "rect") if geom is not None else "rect",
                "style": {
                    "fill": extract_fill(sp_pr, theme_colors),
                    "line": extract_line(sp_pr, theme_colors),
                    "text": extract_text_style(child, theme_colors) if text else None,
                },
            }
        )


def build_manifest(pptx_path: Path, output_dir: Path) -> dict[str, Any]:
    with zipfile.ZipFile(pptx_path) as pptx:
        presentation = ET.fromstring(pptx.read("ppt/presentation.xml"))
        size = presentation.find("p:sldSz", NS)
        slide_cx = int(size.attrib["cx"])
        slide_cy = int(size.attrib["cy"])
        theme_colors = parse_theme_colors(pptx)
        media_files: set[str] = set()
        slides = []

        slide_names = sorted(
            [
                name
                for name in pptx.namelist()
                if name.startswith("ppt/slides/slide") and name.endswith(".xml")
            ],
            key=lambda value: int(Path(value).stem.replace("slide", "")),
        )

        for slide_name in slide_names:
            slide_no = int(Path(slide_name).stem.replace("slide", ""))
            root = ET.fromstring(pptx.read(slide_name))
            elements: list[dict[str, Any]] = []

            # TRACE[PPT-CHAT-008]: Layout/master non-placeholder elements are part
            # of the real PPTX visual system, so copy them before slide-local items.
            slide_rels = parse_part_rels(pptx, slide_name)
            layout_name = next((target for target in slide_rels.values() if target.startswith("ppt/slideLayouts/")), None)
            if layout_name and layout_name in pptx.namelist():
                layout_rels = parse_part_rels(pptx, layout_name)
                master_name = next(
                    (target for target in layout_rels.values() if target.startswith("ppt/slideMasters/")),
                    None,
                )
                if master_name and master_name in pptx.namelist():
                    master_root = ET.fromstring(pptx.read(master_name))
                    master_tree = master_root.find(".//p:spTree", NS)
                    if master_tree is not None:
                        collect_elements(
                            master_tree,
                            GroupTransform(0, 0, slide_cx, slide_cy, 0, 0, slide_cx, slide_cy),
                            slide_cx,
                            slide_cy,
                            theme_colors,
                            parse_part_rels(pptx, master_name),
                            media_files,
                            elements,
                            skip_placeholders=True,
                        )

                layout_root = ET.fromstring(pptx.read(layout_name))
                layout_tree = layout_root.find(".//p:spTree", NS)
                if layout_tree is not None:
                    collect_elements(
                        layout_tree,
                        GroupTransform(0, 0, slide_cx, slide_cy, 0, 0, slide_cx, slide_cy),
                        slide_cx,
                        slide_cy,
                        theme_colors,
                        layout_rels,
                        media_files,
                        elements,
                        skip_placeholders=True,
                    )

            sp_tree = root.find(".//p:spTree", NS)
            if sp_tree is not None:
                collect_elements(
                    sp_tree,
                    GroupTransform(0, 0, slide_cx, slide_cy, 0, 0, slide_cx, slide_cy),
                    slide_cx,
                    slide_cy,
                    theme_colors,
                    slide_rels,
                    media_files,
                    elements,
                )
            slides.append(
                {
                    "slideNo": slide_no,
                    "id": f"slide{slide_no:02d}",
                    "elements": elements,
                }
            )

        media_dir = output_dir / "media"
        media_dir.mkdir(parents=True, exist_ok=True)
        for media in sorted(media_files):
            if not media.startswith("ppt/media/"):
                continue
            target = media_dir / Path(media).name
            with pptx.open(media) as source, target.open("wb") as destination:
                shutil.copyfileobj(source, destination)

    return {
        "version": 1,
        "trace": "TRACE[PPT-CHAT-008]",
        "source": pptx_path.name,
        "slideSize": {
            "emu": {"cx": slide_cx, "cy": slide_cy},
            "px": {"width": SLIDE_PIXEL_WIDTH, "height": SLIDE_PIXEL_HEIGHT},
        },
        "mediaMimeTypes": {
            Path(media).name: mimetypes.guess_type(media)[0] or "application/octet-stream"
            for media in sorted(media_files)
        },
        "slides": slides,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract PPTX template preview manifest.")
    parser.add_argument("--pptx", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)
    manifest = build_manifest(args.pptx, args.out_dir)
    manifest_path = args.out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"manifest": str(manifest_path), "slides": len(manifest["slides"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
