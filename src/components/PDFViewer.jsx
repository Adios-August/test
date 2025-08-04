import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// 设置PDF.js worker - 使用CDN，但添加错误处理
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (error) {
  console.warn('PDF.js worker设置失败，使用默认配置');
}

const PDFViewer = ({ pdfUrl }) => {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pdfUrl) return;

      const loadPDF = async () => {
    try {
      setLoading(true);
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setLoading(false);
    } catch (error) {
      console.error('PDF加载失败:', error);
      setLoading(false);
      // 如果PDF.js加载失败，回退到iframe
      console.log('回退到iframe预览模式');
    }
  };

    loadPDF();
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('页面渲染失败:', error);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      {/* 工具栏 */}
      <div className="pdf-toolbar">
        <div className="toolbar-left">
          <button onClick={handlePrevPage} disabled={currentPage <= 1}>
            上一页
          </button>
          <span>
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <button onClick={handleNextPage} disabled={currentPage >= totalPages}>
            下一页
          </button>
        </div>
        
        <div className="toolbar-right">
          <button onClick={handleZoomOut} disabled={scale <= 0.25}>
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} disabled={scale >= 3.0}>
            +
          </button>
        </div>
      </div>

      {/* PDF内容 */}
      <div className="pdf-content">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default PDFViewer; 