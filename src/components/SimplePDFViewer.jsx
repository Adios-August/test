import React, { useState } from 'react';
import { Button, Space, Spin } from 'antd';


const SimplePDFViewer = ({ pdfUrl }) => {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(0.5);

 

 

  return (
    <div className="simple-pdf-viewer">
   

      {/* PDF内容 */}
      <div className="pdf-content">
        {loading && (
          <div className="loading-container">
            <Spin size="large" />
            <p>PDF加载中...</p>
          </div>
        )}
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&statusbar=1&messages=1&view=FitH&pagemode=thumbs`}
          className="pdf-iframe"
          title="PDF Preview"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${100 / scale}%`,
            height: `${100 / scale}%`
          }}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </div>
    </div>
  );
};

export default SimplePDFViewer; 