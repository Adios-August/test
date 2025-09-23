import React, { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { authenticatedFetch } from "../utils/request";

// 配置 pdf.js worker（使用 CDN，避免本地路径问题）
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const containerStyle = { position: "relative", width: "100%" };

const highlightStyleBase = {
  position: "absolute",
  border: "2px solid rgba(0, 162, 255, 0.8)",
  background: "rgba(195, 239, 245, 0.19)",
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
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageWrapRef = useRef(null);

  // 同步外部页码
  useEffect(() => {
    if (pageNum && pageNum !== currentPage) setCurrentPage(pageNum);
    console.log('PdfPreview: pageNum changed', pageNum);
  }, [pageNum]);

  // 获取PDF文件
  useEffect(() => {
    if (!fileUrl) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    // 如果已经是blob URL，直接使用
    if (fileUrl.startsWith('blob:')) {
      setBlobUrl(fileUrl);
      setError(null);
      return;
    }

    // 如果是相对路径或需要认证的URL，使用authenticatedFetch
    const fetchPdf = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let fetchUrl = fileUrl;
        
        // 如果是相对路径，转换为完整URL
        if (fileUrl.startsWith('/api/')) {
          fetchUrl = `${window.location.origin}${fileUrl}`;
        }
        
        const response = await authenticatedFetch(fetchUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        
      } catch (err) {
        console.error('Failed to fetch PDF:', err);
        setError(err.message || '加载PDF失败');
        setBlobUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    // 清理函数
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [fileUrl]);

  // 清理blob URL
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

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

  const shouldShowHighlights = useMemo(() => {
    const target = Math.max(1, pageNum || 1);
    return (currentPage || 1) === target;
  }, [currentPage, pageNum]);

  // 显示错误状态
  if (error) {
    return (
      <div style={{ width: "100%", padding: "20px", textAlign: "center", color: "#ff4d4f" }}>
        <div>PDF加载失败</div>
        <div style={{ fontSize: "12px", marginTop: "8px" }}>{error}</div>
      </div>
    );
  }

  // 显示加载状态
  if (loading || (!blobUrl && fileUrl)) {
    return (
      <div style={{ width: "100%", padding: "20px", textAlign: "center" }}>
        <span>正在加载PDF...</span>
      </div>
    );
  }

  // 没有文件URL
  if (!blobUrl) {
    return (
      <div style={{ width: "100%", padding: "20px", textAlign: "center", color: "#999" }}>
        <span>暂无PDF文件</span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <button disabled={!blobUrl || currentPage <= 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>上一页</button>
          <button style={{ marginLeft: 8 }} disabled={!blobUrl || (numPages && currentPage >= numPages)} onClick={() => setCurrentPage(Math.min(numPages || currentPage + 1, (numPages || currentPage + 1)))}>下一页</button>
        </div>
        <div>{currentPage}{numPages ? ` / ${numPages}` : ""}</div>
      </div>
      <div ref={pageWrapRef} style={containerStyle}>
        <Document file={blobUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<span>加载文档...</span>}>
          <Page
            pageNumber={Math.max(1, currentPage || 1)}
            width={containerWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onRenderSuccess={onPageRenderSuccess}
          />
        </Document>
        {shouldShowHighlights ? highlightRects : null}
      </div>
    </div>
  );
}


