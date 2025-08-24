import React, { useState, useEffect, useMemo } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';
import { throttle } from '../utils/knowledgeUtils';

const KnowledgeEditor = ({ contentHtml, onContentChange, onImageUpload }) => {
  const [editor, setEditor] = useState(null);

  // Editor toolbar configuration
  const toolbarConfig = {
    toolbarKeys: [
      'headerSelect',
      'bold',
      'italic', 
      'underline',
      'through',
      'color',
      'bgColor',
      'bulletedList',
      'numberedList',
      'insertLink',
      'editLink',
      'blockquote',
      'codeBlock',
      'insertTable',
      'uploadImage',
      'undo',
      'redo'
    ]
  };

  // Editor configuration
  const editorConfig = {
    placeholder: '请输入正文内容...',
    MENU_CONF: {
      uploadImage: {
        async customUpload(file, insertFn) {
          if (onImageUpload) {
            await onImageUpload(file, insertFn);
          }
        }
      }
    }
  };

  // Editor content change handler (throttled)
  const handleEditorChange = useMemo(
    () => throttle((editor) => {
      onContentChange(editor.getHtml());
    }, 300),
    [onContentChange]
  );

  // Destroy editor timely, important!
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  return (
    <div className="editor-section">
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9', borderRadius: '6px 6px 0 0' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={contentHtml}
        onCreated={setEditor}
        onChange={handleEditorChange}
        mode="default"
        style={{ height: '300px', overflowY: 'hidden', borderRadius: '0 0 6px 6px' }}
      />
    </div>
  );
};

export default KnowledgeEditor;
