import React, { useState, useEffect, useRef } from 'react';
import { Button, Avatar, Select, Input, message, Tooltip, Card, Spin, Modal } from 'antd';
import {
  FilePdfOutlined, FileExcelOutlined, TagOutlined,
  SendOutlined, UserOutlined, ArrowLeftOutlined, HistoryOutlined,
} from '@ant-design/icons';
import { knowledgeAPI } from '../api/knowledge';
import { useFeedbackTypes } from '../hooks/useFeedbackTypes';
import { feedbackAPI } from '../api/feedback';
import FeedbackMailButton from './FeedbackMailButton';
import FavoriteButton from './FavoriteButton';
import { useAuthStore } from '../stores';
import { sanitizeHtmlLinks } from '../utils/htmlUtils';

import PdfPreview from './PdfPreview';
import KnowledgeTable from './KnowledgeTable';
import './KnowledgeDetailContent.scss';

import KnowledgeHistory from './KnowledgeHistory';
import KnowledgeDiff from './KnowledgeDiff';

const KnowledgeDetailContent = ({ knowledgeDetail, loading = false, showBackButton = true, showFeedback = true, showEmailButton = true }) => {
  const { feedbackTypes, loading: feedbackTypesLoading } = useFeedbackTypes();
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;
  
  // Feedback状态
  const [selectedFeedbackType, setSelectedFeedbackType] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // 历史与差异视图状态
  const [showHistory, setShowHistory] = useState(false);
  const [historyVersions, setHistoryVersions] = useState([]);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState({ fromVersion: '', toVersion: '', fromContent: '', toContent: '', htmlDiff: '', summary: '' });
  const favoriteStatusInitRef = useRef(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  // 查看指定版本内容的弹窗状态
  const [versionViewVisible, setVersionViewVisible] = useState(false);
  const [versionViewLoading, setVersionViewLoading] = useState(false);
  const [versionViewData, setVersionViewData] = useState({ version: '', content: '', tableData: null, attachments: [], tags: [], editor: '', date: '', effectiveDate: '' });

  // 当feedbackTypes加载完成后，自动选中第一条
  useEffect(() => {
    if (feedbackTypes && feedbackTypes.length > 0 && !selectedFeedbackType) {
      setSelectedFeedbackType(feedbackTypes[0].value);
    }
  }, [feedbackTypes, selectedFeedbackType]);

  // 打开历史记录
  const handleOpenHistory = () => {
    const knowledgeId = knowledgeDetail?.id;
    if (!knowledgeId) {
      message.info('暂可用历史记录');
      return;
    }

    setHistoryLoading(true);
    knowledgeAPI.getKnowledgeVersions(knowledgeId)
      .then((response) => {
        let list = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (Array.isArray(response?.versions)) {
          list = response.versions;
        } else if (Array.isArray(response?.data?.versions)) {
          list = response.data.versions;
        } else if (Array.isArray(response?.data)) {
          list = response.data;
        } else if (Array.isArray(response?.records)) {
          list = response.records;
        } else if (response?.code === 200 && Array.isArray(response?.data)) {
          list = response.data;
        }

        if (!list || list.length === 0) {
          setHistoryVersions([]);
          setShowHistory(true);
          return;
        }

        const mapped = list.map((item, idx) => ({
          version: item.version ?? item.versionNo ?? item.version_no ?? item.no ?? (list.length - idx),
          editor: item.editor ?? item.updatedBy ?? item.lastEditor ?? knowledgeDetail?.createdBy ?? '未知',
          date: item.date ?? item.updatedTime ?? item.updatedAt ?? item.createdTime ?? '',
          content: item.content ?? item.description ?? '',
        }));
        setHistoryVersions(mapped);
        setShowHistory(true);
      })
      .catch((err) => {
        console.error('获取版本列表失败:', err);
        message.error('获取版本列表失败');
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setShowDiff(false);
  };

  const handleViewVersion = async (versionNumber) => {
    const knowledgeId = knowledgeDetail?.id;
    if (!knowledgeId) {
      message.warning('缺少知识ID，无法查看版本内容');
      return;
    }

    setVersionViewVisible(true);
    setVersionViewLoading(true);
    try {
      const resp = await knowledgeAPI.getKnowledgeVersion(knowledgeId, String(versionNumber));
      const data = resp?.data ?? resp;
      const content = typeof data === 'string' ? data : (data?.content || data?.description || data?.htmlContent || data?.html || '');
      const versionMeta = historyVersions.find(v => String(v.version) === String(versionNumber));
      const tableData = data?.tableData || data?.table || null;
      const attachments = Array.isArray(data?.attachments) ? data.attachments : (knowledgeDetail?.attachments || []);
      const tags = Array.isArray(data?.tags) ? data.tags : (knowledgeDetail?.tags || []);
      const effectiveDate = data?.effectiveStartTime || data?.effectiveDate || knowledgeDetail?.effectiveStartTime || knowledgeDetail?.effectiveDate || '';
      setVersionViewData({ version: versionNumber, content, tableData, attachments, tags, editor: versionMeta?.editor || '', date: versionMeta?.date || '', effectiveDate });
    } catch (err) {
      console.error('获取版本内容失败:', err);
      message.error('获取版本内容失败');
    } finally {
      setVersionViewLoading(false);
    }
  };

  const handleCompareVersions = (fromVersion, toVersion) => {
    const knowledgeId = knowledgeDetail?.id;
    if (!knowledgeId) {
      message.warning('缺少知识ID，无法获取差异');
      return;
    }

    // 初始化diff数据并立即展示视图
    const from = historyVersions.find(v => String(v.version) === String(fromVersion));
    const to = historyVersions.find(v => String(v.version) === String(toVersion));
    setDiffData({
      fromVersion,
      toVersion,
      fromContent: from?.content || '',
      toContent: to?.content || '',
      htmlDiff: '',
      summary: '',
    });
    setShowDiff(true);

    // 先加载HTML差异（较快）
    setDiffLoading(true);
-    knowledgeAPI.getKnowledgeDiffHtml(knowledgeId, String(toVersion), String( fromVersion))
       .then((resp) => {
         const data = resp?.data ?? resp;
         const htmlDiff = typeof data === 'string' ? data : (data?.htmlDiff || data?.html_diff || data?.html || '');
         setDiffData(prev => ({ ...prev, htmlDiff }));
       })
       .catch((err) => {
         console.error('获取HTML差异失败:', err);
         message.error('获取HTML差异失败');
       })
       .finally(() => {
         setDiffLoading(false);
       });

    // 并行加载AI摘要（较慢，显示loading）
    setSummaryLoading(true);
    knowledgeAPI.getKnowledgeDiffSummary(knowledgeId, String(fromVersion), String(toVersion))
      .then((resp) => {
        const data = resp?.data ?? resp;
        const summary = typeof data === 'string' ? data : (data?.summary || data?.text || '');
        setDiffData(prev => ({ ...prev, summary }));
      })
      .catch((err) => {
        console.error('获取AI摘要失败:', err);
        // 不阻断用户查看HTML差异，只提示或静默
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  };

  const handleCloseDiff = () => {
    setShowDiff(false);
  };

  // 处理收藏状态变化（页面初始化不弹提示）
  const handleFavoriteStatusChange = (isFavorited) => {
     
  };

  // 处理feedback提交（恢复原有逻辑）
  const handleSubmitFeedback = async () => {
    if (!knowledgeDetail?.id) {
      message.error('知识详情不存在');
      return;
    }

    if (!selectedFeedbackType) {
      message.warning('请选择反馈类型');
      return;
    }

    if (!feedbackContent.trim()) {
      message.warning('请输入反馈内容');
      return;
    }

    if (!currentUserId) {
      message.error('请先登录');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const response = await feedbackAPI.submitFeedback(
        knowledgeDetail.id,
        feedbackContent.trim(),
        selectedFeedbackType,
        currentUserId
      );

      if (response?.code === 200 || response?.success) {
        message.success('反馈提交成功');
        setFeedbackContent('');
      } else {
        message.error(response?.message || '反馈提交失败');
      }
    } catch (e) {
      console.error('提交反馈失败:', e);
      message.error(e?.message || '提交反馈失败，请稍后重试');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="knowledge-detail-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!knowledgeDetail) {
    return (
      <div className="knowledge-detail-content">
        <div className="empty-state">
          <h3>暂无知识详情</h3>
          <p>请稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-detail-content">
      <Spin spinning={historyLoading || diffLoading} tip={historyLoading ? '加载历史记录...' : (diffLoading ? '加载差异...' : undefined)}>
        <Card className="document-detail">
          <div className="document-header">
            <div className="header-left">
              <div className="author-info">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="author-name">{knowledgeDetail.createdBy || knowledgeDetail.author || '未知作者'}</span>
                <span className="date">{knowledgeDetail.createdTime || knowledgeDetail.date || '未知日期'}</span>
                <FavoriteButton 
                  knowledgeId={knowledgeDetail.id}
                  onStatusChange={handleFavoriteStatusChange}
                  style={{ marginLeft: '16px', fontSize: '16px' }}
                />
              </div>
              <div className="tags">
                {(knowledgeDetail.tags || []).map((tag, index) => (
                  <div key={index} className="custom-tag">
                    <span className="tag-icon">
                      <TagOutlined />
                    </span>
                    <span className="tag-text">{tag}</span>
                  </div>
                ))}
              </div>
            </div>
            {!showHistory && (
              <div className="header-right">
                {showBackButton && (
                  <Button 
                    type="primary" 
                    icon={<ArrowLeftOutlined />} 
                    size="large"
                    onClick={() => window.history.back()}
                    style={{ fontSize: '16px' }}
                  >
                    返回
                  </Button>
                )}
                <Button 
                  type="default" 
                  icon={<HistoryOutlined />} 
                  size="large"
                  loading={historyLoading}
                  onClick={handleOpenHistory}
                  style={{ marginLeft: '8px', fontSize: '16px' }}
                >
                  History
                </Button>
              </div>
            )}
          </div>

        {!showHistory ? (
          <div className="document-content">
            {/* 数据表格区域 - 当tableData存在且有数据时才显示 */}
            {knowledgeDetail.tableData  && knowledgeDetail.tableData.rows.length > 0 &&knowledgeDetail.tableData.columns.length > 0 && (
              <div className="content-section">
                <KnowledgeTable tableData={knowledgeDetail.tableData} />
              </div>
            )}

            <div className="content-section">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtmlLinks(knowledgeDetail.description) || '暂无内容' 
                }} 
              />
            </div>

            <div className="content-section">
              <h3>Attachments</h3>
              <div className="attachment-list">
                {(knowledgeDetail.attachments || []).map((attachment, index) => (
                  <div key={index} className="attachment-item">
                    <div className="attachment-header">
                      <span className="attachment-icon">
                        {attachment.fileType === 'pdf' ? <FilePdfOutlined /> : <FileExcelOutlined />}
                      </span>
                      <span className="attachment-name">{attachment.fileName || attachment.name}</span>
                      
                       
                    </div>
                    
                    {/* PDF预览组件 - 直接嵌入到附件项中 */}
                    {(attachment.fileType === 'pdf' || 
                      attachment.fileType === 'application/pdf' ||
                      (attachment.fileName && attachment.fileName.toLowerCase().endsWith('.pdf')) ||
                      (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'))) && (
                      <div className="pdf-preview-embedded">
                        
                        <PdfPreview 
                          fileUrl={attachment.filePath || attachment.fileUrl || attachment.url} 
                          pageNum={1}
                          bboxes={knowledgeDetail.bbox_union || knowledgeDetail.bboxUnion ? [knowledgeDetail.bbox_union || knowledgeDetail.bboxUnion] : []}
                        />
                      </div>
                    )}
                    
                    {/* 如果没有PDF预览，显示原因 */}
                    {!(attachment.fileType === 'pdf' || 
                       attachment.fileType === 'application/pdf' ||
                       (attachment.fileName && attachment.fileName.toLowerCase().endsWith('.pdf')) ||
                       (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'))) && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        非PDF文件，无法预览
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="content-section">
              <div className="effective-date">
                <span>生效时间: {knowledgeDetail.effectiveStartTime || knowledgeDetail.effectiveDate || '未知'}</span>
              </div>
            </div>
          </div>
        ) : (
          !showDiff ? (
            <KnowledgeHistory
               documentTitle={knowledgeDetail?.name || knowledgeDetail?.title}
               versions={historyVersions}
               currentVersion={historyVersions[0]?.version}
               onCompare={handleCompareVersions}
               onViewVersion={handleViewVersion}
               onClose={handleCloseHistory}
               loading={diffLoading}
             />
          ) : (
            <KnowledgeDiff
              documentTitle={knowledgeDetail?.name || knowledgeDetail?.title}
              fromVersion={diffData.fromVersion}
              toVersion={diffData.toVersion}
              fromContent={diffData.fromContent}
              toContent={diffData.toContent}
              htmlDiff={diffData.htmlDiff}
              summary={diffData.summary}
              summaryLoading={summaryLoading}
              attachments={knowledgeDetail?.attachments || []}
              onClose={handleCloseDiff}
            />
          )
        )}

        {showFeedback && !showHistory && (
          <div className="feedback-section">
            <div className="feedback-header">
              <h3>Feedback</h3>
              <div className="feedback-controls">
                <Select
                  placeholder="选择反馈..."
                  style={{ width: 120 }}
                  options={feedbackTypes}
                  loading={feedbackTypesLoading}
                  value={selectedFeedbackType}
                  onChange={setSelectedFeedbackType}
                />
                <Input
                  placeholder="请输入反馈内容"
                  style={{ width: 300 }}
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  onPressEnter={handleSubmitFeedback}
                />
                <Button 
                  type="text" 
                  icon={<SendOutlined />} 
                  onClick={handleSubmitFeedback}
                  loading={feedbackSubmitting}
                  disabled={!selectedFeedbackType || !feedbackContent.trim()}
                />
                {showEmailButton && <FeedbackMailButton knowledgeDetail={knowledgeDetail} />}
              </div>
            </div>
          </div>
        )}
        {/* 版本内容查看弹窗 */}
        <Modal
          title={`版本内容：${String(versionViewData.version || '')}`}
          open={versionViewVisible}
          onCancel={() => setVersionViewVisible(false)}
          footer={null}
          width={1200}
          destroyOnClose
        >
          {versionViewLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : (
            <div style={{ maxHeight: 540, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span style={{ fontSize: 13 }}>{versionViewData.editor || (knowledgeDetail.createdBy || knowledgeDetail.author || '未知作者')}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{versionViewData.date || knowledgeDetail.createdTime || knowledgeDetail.date || ''}</span>
                </div>
                <span style={{ fontSize: 12, color: '#666' }}>版本 {String(versionViewData.version || '')}</span>
              </div>

              {Array.isArray(versionViewData.tags) && versionViewData.tags.length > 0 && (
                <div className="tags" style={{ marginBottom: 12 }}>
                  {versionViewData.tags.map((tag, index) => (
                    <div key={index} className="custom-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 4, padding: '2px 6px', marginRight: 6 }}>
                      <span className="tag-icon" style={{ fontSize: 12 }}>
                        <TagOutlined />
                      </span>
                      <span className="tag-text" style={{ fontSize: 12 }}>{tag}</span>
                    </div>
                  ))}
                </div>
              )}

              {versionViewData.tableData && versionViewData.tableData.rows && versionViewData.tableData.columns && versionViewData.tableData.rows.length > 0 && versionViewData.tableData.columns.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <KnowledgeTable tableData={versionViewData.tableData} />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtmlLinks(versionViewData.content) || '暂无内容' 
                  }} 
                />
              </div>

              {Array.isArray(versionViewData.attachments) && versionViewData.attachments.length > 0 && (
                <div>
                  <h4>附件</h4>
                  <div className="attachment-list">
                    {versionViewData.attachments.map((attachment, index) => (
                      <div key={index} className="attachment-item" style={{ marginBottom: 12 }}>
                        <div className="attachment-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="attachment-icon">
                            {attachment.fileType === 'pdf' ? <FilePdfOutlined /> : <FileExcelOutlined />}
                          </span>
                          <span className="attachment-name">{attachment.fileName || attachment.name}</span>
                        </div>
                        {(attachment.fileType === 'pdf' || 
                          attachment.fileType === 'application/pdf' ||
                          (attachment.fileName && attachment.fileName.toLowerCase().endsWith('.pdf')) ||
                          (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'))) && (
                          <div className="pdf-preview-embedded" style={{ marginTop: 8 }}>
                            <PdfPreview 
                              fileUrl={attachment.filePath || attachment.fileUrl || attachment.url} 
                              pageNum={1}
                              bboxes={knowledgeDetail.bbox_union || knowledgeDetail.bboxUnion ? [knowledgeDetail.bbox_union || knowledgeDetail.bboxUnion] : []}
                            />
                          </div>
                        )}
                        {!(attachment.fileType === 'pdf' || 
                           attachment.fileType === 'application/pdf' ||
                           (attachment.fileName && attachment.fileName.toLowerCase().endsWith('.pdf')) ||
                           (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'))) && (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                            非PDF文件，无法预览
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(versionViewData.effectiveDate || knowledgeDetail.effectiveStartTime || knowledgeDetail.effectiveDate) && (
                <div className="effective-date" style={{ marginTop: 12 }}>
                  <span>生效时间: {versionViewData.effectiveDate || knowledgeDetail.effectiveStartTime || knowledgeDetail.effectiveDate || '未知'}</span>
                </div>
              )}
            </div>
          )}
        </Modal>
      </Card>
      </Spin>
    </div>
  );
};

export default KnowledgeDetailContent;