import { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import axios from 'axios';



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
    const [postId, setPostId] = useState('');
    const [postUrls, setPostUrls] = useState([]);
    const [email, setEmail] = useState('');
    const [content, setContent] = useState('');
    const [postSignature, setPostSignature] = useState('');

    //Set the base URL of the API
    const baseUrl = 'https://agx9exeaue.execute-api.us-west-1.amazonaws.com/posts/';

    // Fetch all existing post URLs and set them to the state variable
    useEffect(() => {
       axios.get('https://agx9exeaue.execute-api.us-west-1.amazonaws.com/posts')
      .then(response => setPostUrls(response.data))
      .catch(error => console.log(error));
      
      // Fetch the user's email address from local storage and set it to the state variable
      const userEmail = localStorage.getItem('email');
      if (userEmail) 
      {
        setEmail(userEmail);
      }
    }, []);


    const handlePost = async () => {

        const base64PrivateKey = localStorage.getItem('rsaPrivateKey');
        const arrayBufferPrivateKey = base64ToArrayBuffer(base64PrivateKey);

        const privateKey = await crypto.subtle.importKey(
           'pkcs8',
             arrayBufferPrivateKey,
             { name: 'RSA-OAEP', hash: 'SHA-256' },
             true,
             ['decrypt']
        );

        // Encrypt post content with rsaPrivateKey
        const base64Content = utf8ToBase64(content);
        const encodedContent = base64ToArrayBuffer(base64Content);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedContent = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            length: 256,
            iv: iv
         },
            privateKey, encodedContent
        );
    
        // Convert encrypted post content from ArrayBuffers to base64 ASCII strings
        const base64EncryptedContent = arrayBufferToBase64(encryptedContent);
        const base64IV = arrayBufferToBase64(iv);
       
      
       // Fetch data from the PDS API and get the total number of existing posts
       const response = await axios.get('https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/posts');
       const numExistingPosts = response.data.length;

       // Create a new post ID based on the number of existing posts
       // Also create the URL for the new post using the generated post id
       const newPostId = `post ${numExistingPosts + 1}`;
       setPostId(newPostId);
       const postURL = `https://agx9exeaue.execute-api.us-west-1.amazonaws.com/posts/${newPostId}`;   

        // Send the post id,email,post content and post digital signature to PDS
        await axios.put('https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/posts', 
            {
                "postId": newPostId,   
                "email": email,
                "post": content,
                "postDS": base64EncryptedContent,
                "IV": base64IV
            }
        );
       
       //Send the post data to SNE
       await axios.put('https://agx9exeaue.execute-api.us-west-1.amazonaws.com/posts', {
          "postId": newPostId,
          "email": email,
          "postDS": base64EncryptedContent,
          "serviceURL": postURL,
          "IV": base64IV
        })
      
    }
 
    const handleSubmit = (event) => {
        event.preventDefault();   
        handlePost();
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
                <p>PostDS: {postSignature}</p>
                {postId !== '' && (
                     <p>New post URL: <a href={`${baseUrl}${postId}${postSignature}`}>{`${baseUrl}${postId}${postSignature}`}</a></p>
                )}
                <Form.Label>All post URLs:</Form.Label> 
                {postUrls.length > 0 && (
                    <><p>All post URLs:</p>
                         <ul>{postUrls.map(url => (<li key={url}>{url}</li>))}</ul>
                    </>
                )}
            </Container>
        </Form>   
    );
}
