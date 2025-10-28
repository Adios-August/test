import React, { useState, useEffect, useMemo, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { authenticatedFetch } from "../utils/request";

// 配置 pdf.js worker（使用 CDN，避免本地路径问题）
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const containerStyle = { position: "relative", width: "100%", overflow: "auto" };

const highlightStyleBase = {
  position: "absolute",
  border: "2px solid rgba(255, 0, 0, 0.9)",
  background: "rgba(198, 65, 65, 0.19)",
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
  // 新增：下载文件名
  const [downloadName, setDownloadName] = useState("document.pdf");
  // 新增：缩放状态
  const [zoom, setZoom] = useState(1);
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.1;

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
      // 设定默认下载名
      setDownloadName('document.pdf');
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
        
        // 推断下载名：优先 Content-Disposition，其次 URL
        let name = 'document.pdf';
        const cd = response.headers.get('Content-Disposition') || response.headers.get('content-disposition');
        if (cd) {
          const matchStar = cd.match(/filename\*=(?:UTF-8''|)([^;\n\r]+)/i);
          const match = cd.match(/filename=\"?([^\";\n\r]+)\"?/i);
          const raw = (matchStar && matchStar[1]) || (match && match[1]);
          if (raw) {
            try { name = decodeURIComponent(raw.replace(/^\"|\"$/g, '')); } catch { name = raw; }
          }
        } else {
          try {
            const u = new URL(fetchUrl);
            const byParam = u.searchParams.get('fileName') || u.searchParams.get('filename') || u.searchParams.get('name');
            if (byParam) {
              name = byParam;
            } else {
              const segs = u.pathname.split('/').filter(Boolean);
              const last = segs[segs.length - 1] || '';
              if (last) name = decodeURIComponent(last);
            }
          } catch {}
        }
        setDownloadName(name || 'document.pdf');
        
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

  // 新增：计算缩放后的宽度与容器尺寸（保证高亮百分比正确映射）
  const displayWidth = useMemo(() => Math.max(100, Math.round((containerWidth || 600) * zoom)), [containerWidth, zoom]);
  const pageContainerStyle = useMemo(() => ({
    position: 'relative',
    width: displayWidth,
    height: pageSize && pageSize.width ? Math.round(displayWidth * (pageSize.height / pageSize.width)) : 'auto',
  }), [displayWidth, pageSize]);

  // 新增：缩放控制函数
  const handleZoomIn = () => setZoom(z => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(2))));
  const handleZoomReset = () => setZoom(1);

  // 新增：下载处理
  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = downloadName || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="pdf-preview" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          {/* 翻页按钮 */}
          <button disabled={!blobUrl || currentPage <= 1} onClick={() => setCurrentPage(1)}>首页</button>
          <button style={{ marginLeft: 8 }} disabled={!blobUrl || currentPage <= 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>上一页</button>
          <button style={{ marginLeft: 8 }} disabled={!blobUrl || (numPages && currentPage >= numPages)} onClick={() => setCurrentPage(currentPage + 1)}>下一页</button>
          <button style={{ marginLeft: 8 }} disabled={!blobUrl || !numPages || currentPage >= numPages} onClick={() => setCurrentPage(numPages)}>最后一页</button>
        </div>
        {/* 页码与缩放显示 */}
        <div>
          <span style={{ marginRight: 12 }}>{currentPage}{numPages ? ` / ${numPages}` : ""}</span>
          <span>缩放：{Math.round(zoom * 100)}%</span>
        </div>
        {/* 缩放控制 */}
        <div>
          <button style={{ marginLeft: 8 }} disabled={!blobUrl || zoom <= MIN_ZOOM} onClick={handleZoomOut}>缩小</button>
          <button style={{ marginLeft: 8 }} disabled={!blobUrl || zoom >= MAX_ZOOM} onClick={handleZoomIn}>放大</button>
          <button style={{ marginLeft: 8 }} disabled={!blobUrl} onClick={handleZoomReset}>重置</button>
        </div>
      </div>

      {/* 外层滚动容器 + 内层相对定位容器，保证高亮与页面同步缩放 */}
      <div ref={pageWrapRef} style={containerStyle}>
        <div style={pageContainerStyle}>
          <Document file={blobUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<span>加载文档...</span>}>
            <Page
              pageNumber={Math.max(1, currentPage || 1)}
              width={displayWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={onPageRenderSuccess}
            />
          </Document>
          {shouldShowHighlights ? highlightRects : null}
        </div>
      </div>
    </div>
  );
}


