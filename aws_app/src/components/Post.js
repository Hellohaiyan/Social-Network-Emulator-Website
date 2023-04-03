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
    const [postId, setPostId] = useState('');
    const [email, setEmail] = useState('');
    const [content, setContent] = useState('');
    const [postIds, setPostIds] = useState([]);
    const [postSignature, setPostSignature] = useState('');

    // Fetch all existing postids from SNE and set them to the state variable
    useEffect(() => {
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
        
        // Fetch the sharedKey and rsaPrivateKey from local storage
        const sharedKey = localStorage.getItem('sharedKey');
        const rsaPrivateKey = localStorage.getItem('rsaPrivateKey');
        
        console.log(sharedKey);
        console.log(rsaPrivateKey);
        
        //function to digest the post content
        async function digestMessage(post) {
            const encoder = new TextEncoder();
            const data = encoder.encode(post);
            const hash = await crypto.subtle.digest("SHA-256", data);
            return hash;
        }

        //digest the post content
        const digestPost = digestMessage(content);

        // Encrypt digest(post) with rsaPrivateKey
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedDigest = await crypto.subtle.encrypt(
          {
             name: "RSA-OAEP",
             length: 4096,
             iv: iv 
          },
          rsaPrivateKey,  digestPost
        );

        // Convert encrypted digest(post) from ArrayBuffers to base64 ASCII strings
        const base64EncryptedDigest = arrayBufferToBase64(encryptedDigest);
        setPostSignature(base64EncryptedDigest);

        // Encrypt post content with sharedKey
        const base64Content = utf8ToBase64(content);
        const encodedCotent = base64ToArrayBuffer(base64Content);
        const encryptedContent = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            length: 256,
            iv: iv 
        },
        sharedKey,  encodedCotent 
        );
    
        // Convert encrypted post content from ArrayBuffers to base64 ASCII strings
        const base64EncryptedContent = arrayBufferToBase64(encryptedContent);
        const base64IV = arrayBufferToBase64(iv);
       
        //Fetch the total number of existing posts
        const response = await axios.get('https://4eb44pf1u2.execute-api.us-west-1.amazonaws.com/posts');
        const numExistingPosts = response.data.length;
        // Create a new post ID based on the number of existing posts
        const newPostId = `post ${numExistingPosts + 1}`;
        setPostId(newPostId);

        // Send the post data to PDS
        await axios.put('https://1ol178inca.execute-api.us-west-1.amazonaws.com/posts', 
            {
                "postId": postId,   
                "email": email,
                "post": base64EncryptedContent,
                "postDS": postSignature,
                "IV": base64IV
            }
        );
       
        //Send the post data to SNE
        await axios.put('https://4eb44pf1u2.execute-api.us-west-1.amazonaws.com/posts', {
          "postId": postId,
          "email": email,
          "postDS": postSignature,
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
                <Form.Group controlId="postId">
                <h1 className='text-left'>All posts</h1>
                <Form.Label>Post ID:</Form.Label>
                    {postIds.map(postId => (
                         <Button key={postId} href={`/posts/${postId}`} className="me-2">{postId}</Button>
                    ))}
                </Form.Group>
            </Container>
        </Form>   
    );
}
