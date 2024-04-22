import './MainPage.css';
import '../components/Taskbar.css';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { parseCredentialsJWT } from '../utils';
import { LOGIN_URL } from '../config';

export default function MainPage() {
    const responseMessage = (response) => {
        const {email_verified} = parseCredentialsJWT(response.credential);
        
        if (!email_verified) {
            console.error('Email not verified!');
            return;
        }

        axios.post(LOGIN_URL, null, {withCredentials: true}).catch(error => console.error('Error:', error));

        document.cookie = 'authToken=' + response.credential;
        document.location.href = '/home';
    }

    const errorMessage = (error) => {
        console.error(error);
    }
    
    return (
        <div className="main-page">
            <div className="taskbar" style={{justifyContent: 'space-between'}}>
                <img src='/logo.png' style={{height: '100%'}} alt='Logo' />
                <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
            </div>
        </div>
    );
}
