import React, { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// 配置 pdf.js worker（使用 CDN，避免本地路径问题）
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const containerStyle = { position: "relative", width: "100%" };

const highlightStyleBase = {
  position: "absolute",
  border: "2px solid rgba(255, 0, 0, 0.8)",
  background: "rgba(255, 0, 0, 0.15)",
  pointerEvents: "none",
  boxSizing: "border-box",
};

/**
 * PdfPreview: 渲染 PDF 并根据 bbox 高亮
 * props:
 * - fileUrl: Blob URL 或远程 URL
 * - pageNum: 要显示的页码（从 1 开始）
 * - bboxes: Array<[x1,y1,x2,y2]>
 */
export default function PdfPreview({ fileUrl, pageNum, bboxes = [] }) {
  const [numPages, setNumPages] = useState(null);
  const [pageSize, setPageSize] = useState({ width: 1, height: 1 });
  const [containerWidth, setContainerWidth] = useState(600);
  const [currentPage, setCurrentPage] = useState(pageNum || 1);
  const pageWrapRef = useRef(null);

  // 同步外部页码
  useEffect(() => {
    if (pageNum && pageNum !== currentPage) setCurrentPage(pageNum);
  }, [pageNum]);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const onPageRenderSuccess = async (page) => {
    try {
      const viewport = page.getViewport({ scale: 1 });
      setPageSize({ width: viewport.width, height: viewport.height });
    } catch {}
  };

  // 自适应宽度
  useEffect(() => {
    const el = pageWrapRef.current;
    if (!el) return;
    const resize = () => setContainerWidth(el.clientWidth || 600);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const highlightRects = useMemo(() => {
    if (!pageSize.width || !pageSize.height) return [];
    return bboxes
      .filter((bb) => Array.isArray(bb) && bb.length === 4)
      .map(([x1, y1, x2, y2], idx) => {
        const leftPct = (x1 / pageSize.width) * 100;
        const topPct = (y1 / pageSize.height) * 100;
        const widthPct = ((x2 - x1) / pageSize.width) * 100;
        const heightPct = ((y2 - y1) / pageSize.height) * 100;
        return (
          <div
            key={idx}
            style={{
              ...highlightStyleBase,
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
            }}
          />
        );
      });
  }, [bboxes, pageSize]);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <button disabled={!fileUrl || currentPage <= 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>上一页</button>
          <button style={{ marginLeft: 8 }} disabled={!fileUrl || (numPages && currentPage >= numPages)} onClick={() => setCurrentPage(Math.min(numPages || currentPage + 1, (numPages || currentPage + 1)))}>下一页</button>
        </div>
        <div>{currentPage}{numPages ? ` / ${numPages}` : ""}</div>
      </div>
      <div ref={pageWrapRef} style={containerStyle}>
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<span>加载文档...</span>}>
          <Page
            pageNumber={Math.max(1, currentPage || 1)}
            width={containerWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onRenderSuccess={onPageRenderSuccess}
          />
        </Document>
        {highlightRects}
      </div>
    </div>
  );
}


