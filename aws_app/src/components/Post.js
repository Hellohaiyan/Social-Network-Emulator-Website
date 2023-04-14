import { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';


// Helper function to convert ArrayBuffer to base64 ASCII string
function arrayBufferToBase64(buffer) 
{
    const binaryStr = String.fromCharCode.apply(null, new Uint8Array(buffer));
    const base64Str = window.btoa(binaryStr);
    return base64Str;
}

// Helper function to convert a base64 ASCII string to an ArrayBuffer
function base64ToArrayBuffer(str) {
    const binaryStr = window.atob(str);
    const buf = new ArrayBuffer(binaryStr.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, binaryStrLen = binaryStr.length; i < binaryStrLen; i++) {
        bufView[i] = binaryStr.charCodeAt(i);
    }
    return buf;
}

// Helper function to convert utf8/utf16 strings (Javascript default) to base 64 ASCII strings
function utf8ToBase64(str) {
    return window.btoa(encodeURIComponent(str));
}

export function Post() {
    const [email, setEmail] = useState('');
    const [content, setContent] = useState('');
    const [postIds, setPostIds] = useState([]);

    
    useEffect(() => {
        //Fetch all existing postids from SNE
        const fetchPostIds = async () => {
            const response = await axios.get('https://4eb44pf1u2.execute-api.us-west-1.amazonaws.com/posts');
            const postData = response.data;
            const postIds = postData.map(post => post.postId);
            setPostIds(postIds.sort());
            };
            fetchPostIds();
        // Fetch the user's email address from local storage and set it to the state variable
        const userEmail = localStorage.getItem('email');
        if (userEmail) 
        {
            setEmail(userEmail);
        }
    }, []);

    const handlePost = async () => {
        // Fetch the sharedKey and rsaPrivateKey from local storage and conver them to CryptoKey objects
        const base64SharedKey = localStorage.getItem('sharedKey');
        const base64RsaPrivateKey = localStorage.getItem('rsaPrivateKey');

        const arrayBufferSharedKey = base64ToArrayBuffer(base64SharedKey)
        const arrayBufferRsaPrivateKey = base64ToArrayBuffer(base64RsaPrivateKey)

        const sharedKey = await crypto.subtle.importKey('raw', arrayBufferSharedKey, {name: "AES-GCM", length: 256}, false, ['encrypt', 'decrypt']);
        const rsaPrivateKey = await crypto.subtle.importKey('pkcs8', arrayBufferRsaPrivateKey, 
            {
                name: "RSA-PSS",
                modulesLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            false, ['sign']
        );

        // Create digital signature with rsaPrivateKey
        const base64Content = utf8ToBase64(content);
        const arrayBufferCotent = base64ToArrayBuffer(base64Content);
        const signature = await crypto.subtle.sign(
            {
              name: "RSA-PSS",
              saltLength: 32
            },
            rsaPrivateKey,
            arrayBufferCotent
          );
 
        // Convert signatue from ArrayBuffers to base64 ASCII strings and set it to the state variable
        const base64Signature = arrayBufferToBase64(signature);

        // Encrypt post content with sharedKey
        const user = await axios.get(`https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users/${email}`);
        const base64IV = user.data.IV;
        const arrayBufferIV = base64ToArrayBuffer(base64IV);
        const encryptedArrayBufferContent = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            length: 256,
            iv: arrayBufferIV 
        },
            sharedKey,  arrayBufferCotent 
        );
    
        // Convert encrypted post content from ArrayBuffers to base64 ASCII strings
        const base64EncryptedContent = arrayBufferToBase64(encryptedArrayBufferContent);

        // Send the post data to PDS
        await axios.put('https://1ol178inca.execute-api.us-west-1.amazonaws.com/posts', 
            {
                "email": email,
                "post": base64EncryptedContent,
                "postDS": base64Signature
            }
        );
       
        // Send the post data to SNE
        await axios.put('https://4eb44pf1u2.execute-api.us-west-1.amazonaws.com/posts', 
            { 
                "email": email
            }
        );
    }

    const handleView = async () => {
         
        //Sotre postId when click a button to view post

        //Send post id and viewer email to PDS

        // Fetch the viewer sharedKey and rsaPrivateKey from local storage and conver them to CryptoKey objects
        const base64SharedKey = localStorage.getItem('sharedKey');
        const base64RsaPrivateKey = localStorage.getItem('rsaPrivateKey');
        const arrayBufferSharedKey = base64ToArrayBuffer(base64SharedKey);
        const arrayBufferRsaPrivateKey = base64ToArrayBuffer(base64RsaPrivateKey)

        const sharedKey = await crypto.subtle.importKey('raw', arrayBufferSharedKey, {name: "AES-GCM", length: 256}, false, ['encrypt', 'decrypt']);
        const rsaPrivateKey = await crypto.subtle.importKey('pkcs8', arrayBufferRsaPrivateKey, 
            {
                name: "RSA-PSS",
                modulesLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            false, ['sign']
        );
        //Viewer decrypt post using viewer's shared key
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedPost = "pds"; //get from PDS
        const decryptedPost = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                length: 256,
                iv: iv 
            },
                sharedKey, encryptedPost
            );
        //Viewer creates the digest(P) on the decrypted post 
        const caculatedDigestP = await crypto.subtle.sign(
        {
            name: "RSA-PSS",
            saltLength: 32,
        },
        rsaPrivateKey,
        decryptedPost
        );

        const encryptedDigestP = "pds"; //get from PDS
        const posterRsaPublicKey = "pds"; //get from PDS
        //Viewer decrypts the digest(P) received from PDS with poster’s  RSA public key
        const DigestP = await crypto.subtle.verify(
            {
                name: "RSA-PSS",
                saltLength: 32,
            },
            posterRsaPublicKey,
            encryptedDigestP
            );
    
        //Compare DigestP with caculatedDigestP and ensure they are equal. If they are, display post to viewer

    }
 
    const handleSubmit = async (event) => {
        event.preventDefault();   
        await handlePost();

        // Fetch all existing postids from SNE again after handlePost function completed 
        try {
            const response = await axios.get('https://4eb44pf1u2.execute-api.us-west-1.amazonaws.com/posts');
            const postData = response.data;
            const fetchedPostIds = postData.map(post => post.postId);
            setPostIds(fetchedPostIds.sort());
          } catch (error) {
            console.error('Failed to fetch post IDs:', error);
          }

    }

    return (
        <Form className="Form" onSubmit={handleSubmit}>
            <Container>
                <h1 className='text-center'>Write your post</h1>
                <Form.Group className="mb-3"></Form.Group>        
                <Form.Label>User: {email}</Form.Label>
                <Form.Group controlId="content">
                    <Form.Label>Post Content</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                    />
                </Form.Group>
                <Button variant="primary" type="submit"> Post </Button>
                <br />
                <br />
                <Form.Group controlId="postId">
                    <h1 className='text-left'>All posts</h1>
                     {postIds.map((postId, index) => (
                     <Button key={postId} onClick={() => this.handleViewPost(postId)} className="me-2" variant="warning">Post Id {index + 1}</Button>
                     ))}
                </Form.Group>
            </Container>
        </Form>   
    );
}
