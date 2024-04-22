import { UPDATE_FILE_CONTENT } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor, Node, Transforms } from 'slate';
import axios from 'axios';
import { Cookies } from 'react-cookie';
import { parseCredentialsJWT } from '../utils';


export default function EditComponent({editorStringContent, filename, setShareable}) {
    const [editor, setEditor] = useState(() => withReact(createEditor()))
    const editorRef = useRef(null)

    let editorValue = editorStringContent != null ? stringToEditorValue(editorStringContent) : [];

    function stringToEditorValue(text) {
        const { insertText } = editor;
        const value = [{ type: 'paragraph', children: [{ text: '' }] }];
        Transforms.insertNodes(editor, value); // Insert initial paragraph
    
        const lines = text.split('\n');
    
        lines.forEach((line, index) => {
            if (index !== 0) {
                insertText('\n'); // Insert line break
            }
            insertText(line);
        });
    
        return editor.children;
    }

    const SlateWithRef = React.forwardRef(({ children, ...props }, ref) => (
        <Slate {...props}>
            <div ref={ref}>{children}</div>
        </Slate>
    ));

    const serializeToString = nodes => {
        return nodes.map(n => Node.string(n)).join('\n')
    }

    useEffect(() => {
        const handleSave = async (event) => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault(); 

                if (setShareable) {
                    setShareable(true);
                }

                const text = serializeToString(editorValue);
                try {
                    await axios.post(`${UPDATE_FILE_CONTENT}/${filename}`, {
                        content: text,
                    }, {withCredentials: true});
                } catch (error) {
                    console.error('Error saving file:', error);
                }
            }
        };
        
        document.addEventListener('keydown', handleSave);

        return () => document.removeEventListener('keydown', handleSave);
    }, [editorValue, filename]);

    useEffect(() => {
        setEditor(() => withReact(createEditor()));
    }, [editorStringContent]);

    const editorStyles = {
        width: '60%', 
        marginTop: '10px',
        minHeight: '300px', 
        backgroundColor: '#f4f4f4', 
        color: '#000000',
        padding: '10px',
        borderRadius: '5px', 
        overflowY: 'auto',
        textAlign: 'left'
    };
console.log(editorValue);
    return (
        <div style={editorValue.length > 0 ? editorStyles : {}}>
            {editorValue.length >= 0 && (
                <SlateWithRef
                    editor={editor}
                    initialValue={editorValue}
                    value={editorValue}
                    onChange={newValue => editorValue = newValue}
                    ref={editorRef}
                    >
                    <Editable autoFocus={false} />
                </SlateWithRef>
            )}
            </div>
    );
}
