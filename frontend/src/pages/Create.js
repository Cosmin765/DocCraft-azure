import { useState, useRef } from "react";
import { Cookies } from 'react-cookie';
import { parseCredentialsJWT } from '../utils';
import EditComponent from "../components/EditComponent";
import axios from 'axios';
import {USERS_URL} from "../config"
import ShareFileComponent from "../components/ShareFileComponent";
export default function Create() {
    const [filename, setFilename] = useState('');
    const [editorStringContent, setEditorStringContent] = useState('');
    const [shareable, setShareable] = useState(false);
    
    const authToken = new Cookies(document.cookie).get('authToken');
    if (!authToken) document.location.href = '/';
    const {pfpUrl, name} = parseCredentialsJWT(authToken);

    const inputRef = useRef(null);

    function handleEditDocument() {
        inputRef.current.disabled = true;

        const filename = inputRef.current.value;

        if (filename !== '') {
            setEditorStringContent('');
            setFilename(filename);
        }
    }

    return (
        <div align='center' className='selector'>
            <div style={{position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center'}}>
                <img src={pfpUrl} style={{width: 40}} />
                <p style={{padding: '0 5px'}}>|</p>
                <div style={{textAlign: 'right' ,color: 'white'}}>{name}</div>
            </div>

            <h1>Enter filename to Create</h1>
            <input ref={inputRef} />
            <div>
                <button onClick={handleEditDocument}>Create Document</button>
            </div> 
            {shareable && <ShareFileComponent file_name={filename}/>}
            <EditComponent 
                editorStringContent={editorStringContent} 
                filename={filename}
                setShareable={setShareable}
            />
        </div>
    )
}
