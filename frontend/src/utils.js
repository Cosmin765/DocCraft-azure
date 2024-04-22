import { jwtDecode } from 'jwt-decode';


function parseCredentialsJWT(creds) {
    const credentials = jwtDecode(creds);

    const email = credentials.email;
    const name = credentials.name;
    const pfpUrl = credentials.picture;
    const email_verified = credentials.email_verified;

    const body = {email, name, pfpUrl, email_verified};
    return body;
}


export { parseCredentialsJWT };
