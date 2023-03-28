import { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';


// Helper function to create digital signature of post using user's private key
async function signPost(privateKey, post) {
    // Encode the post as a Uint8Array
    const postBuffer = new TextEncoder().encode(post);

    // Calculate the SHA-256 hash of the post
    const digest = await crypto.subtle.digest('SHA-256', postBuffer);

    // Sign the hash using the private key
    const signature = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, digest);

    // Convert the signature to a base64-encoded string
    const binaryStr = String.fromCharCode.apply(null, new Uint8Array(signature));

    const signatureString = window.btoa(binaryStr);

    return signatureString;
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
        try {
          // Get the private key from local storage
          const privateKey = await crypto.subtle.importKey(
            'jwk',
            JSON.parse(localStorage.getItem('rsaPrivateKey')),
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            true,
            ['sign']
          );
    
          // Create the digital signature of the post using the private key
          const signature = await signPost(privateKey, content);
          setPostSignature(signature);
        } catch (error) {
          console.error(error);
        }

       // Generate a new post id and set it to the state variable
       // Also create the URL for the new post using the generated post id
       const newPostId = uuidv4();
       setPostId(newPostId);
       const postURL = `https://agx9exeaue.execute-api.us-west-1.amazonaws.com/posts/${newPostId}`;   

        // Send the post id,email,post content and post digital signature to PDS
        await axios.put('https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/posts', 
            {
                "postId": newPostId,   
                "email": email,
                "post": content,
                "postDS": postSignature
            }
        );
       
       //Send the post data to SNE
       await axios.put('https://agx9exeaue.execute-api.us-west-1.amazonaws.com/posts', {
          "postId": newPostId,
          "email": email,
          "postDS": postSignature,
          "serviceURL": postURL
        })
      .then(response => {
         setPostUrls(prevUrls => [...prevUrls, postURL]);
         setPostId('');
         
       })
        .catch(error => console.log(error));
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
