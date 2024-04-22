import { USERS_URL } from "../config";
import axios from "axios";
import { useState, useRef } from "react";
import "./ShareFileComponent.css";
import { SET_PERMISSION_URL } from "../config";
export default function ShareFileComponent({file_name}){
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(false);

    const getUsers = async()=>{
        try {
            const response = await axios.get(USERS_URL, {withCredentials: true});
            setUsers(response.data);
            
        } catch(error) {
            console.error(error);
        }
    }

    const selectRef = useRef(null);

    const permissionCheckboxesRefs = [useRef(null), useRef(null), useRef(null)];

    const checkboxOnChange = (event) => {
        if (event.target.value === 'READ' && !event.target.checked) {
            for (const checkbox of permissionCheckboxesRefs) {
                checkbox.current.checked = false;
            }
            return;
        }

        if (event.target.checked) {
            permissionCheckboxesRefs[0].current.checked = true;
        }
    }

    const permissionCheckboxes = [
        <input onChange={checkboxOnChange} type="checkbox" value="READ" name="read" key="read" ref={permissionCheckboxesRefs[0]}/>,
        <input onChange={checkboxOnChange} type="checkbox" value="WRITE" name="write" key="write" ref={permissionCheckboxesRefs[1]}/>,
        <input onChange={checkboxOnChange} type="checkbox" value="SHARE" name="share" key="share" ref={permissionCheckboxesRefs[2]}/>
    ]

    const handleOnClick = async () => {
        const users = await getUsers();

        setSelected(!selected);
    }

    const handleSetPermissions = async () => {
        if(selectRef.current.value === 'email')
            return;
        
        for (const checkbox of permissionCheckboxesRefs) {
            if (!checkbox.current.checked) {
                continue;
            }

            try {
                const body = {emailTo: selectRef.current.value, permissionType:checkbox.current.value, filename: file_name };
                const response = await axios.post(SET_PERMISSION_URL, body, {withCredentials: true});
            } catch (error) {
                console.error(error);
            }
        }
    }

    const capitalizeString = str => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return (
        <div>
            <div style={{display: selected ? 'block' : 'none'}}>

            {permissionCheckboxes.map(element => {
                return <div key={element.key}>
                    {element}
                    <label htmlFor={element.key}>{capitalizeString(element.key)} permission</label>
                </div>;
            })}

            </div>
            <div style={{display: 'flex', justifyContent: 'center'}}>
            <select ref={selectRef} style={{display: selected ? 'block' : 'none'}}> {users.map(user => (
                    <option key={user} value={user}>
                        {user}
                    </option>))}</select>
                    <input style={{display: selected ? 'block' : 'none'}} onClick={handleSetPermissions} type="button" value="Set" />
            </div>
            <img src="/share.png" onClick={handleOnClick} className="shareImg" />
        </div>
    )
}
