import { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Modal} from 'react-bootstrap';
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

// Helper function to convert Base64 ASCII strings to UTF-8 strings
function base64ToUtf8(base64Str) {
    // Decode the Base64 string
    var decodedStr = window.atob(base64Str);

    // Convert the decoded binary data to a UTF-8 string
    var utf8Str = decodeURIComponent(decodedStr);

    return utf8Str;
}


export function Post() {
    const [email, setEmail] = useState('');
    const [content, setContent] = useState('');
    const [postIdsWithEmails, setPostIdsWithEmails] = useState([]);
    const [viewPostContent, setViewContent] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [activeButtonIndex, setActiveButtonIndex] = useState(null); // State to store the index of the active button

    const fetchPostIds = async () => {
        const response = await axios.get('https://8ed9jn76q2.execute-api.us-west-1.amazonaws.com/posts');
        const postData = response.data;
        const postIds = postData.map(post => post.postId).sort();
            const emailsByPostId = {};
            postData.forEach(post => {
              emailsByPostId[post.postId] = post.email;
            });
            const postIdsWithEmails = postIds.map(postId => ({ postId, email: emailsByPostId[postId] }));
            setPostIdsWithEmails(postIdsWithEmails);
    };
    
    useEffect(() => {
        // Fetch all existing postids from SNE
        fetchPostIds();

        // Fetch the user's email address from local storage and set it to the state variable
        const userEmail = localStorage.getItem('email');
        if (userEmail) 
        {
            setEmail(userEmail);
        }
    }, []);

    const handlePost = async () => {
        // Fetch the sharedKey and rsaPrivateKey from local storage and convert them to CryptoKey objects
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
        const arrayBufferContent = base64ToArrayBuffer(base64Content);
        const signature = await crypto.subtle.sign(
            {
              name: "RSA-PSS",
              saltLength: 32
            },
            rsaPrivateKey,
            arrayBufferContent
          );
 
        // Convert signatue from ArrayBuffers to base64 ASCII strings and set it to the state variable
        const base64Signature = arrayBufferToBase64(signature);

        // Encrypt post content with sharedKey
        const base64IV = localStorage.getItem("IV");
        const arrayBufferIV = base64ToArrayBuffer(base64IV);
        const encryptedArrayBufferContent = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            length: 256,
            iv: arrayBufferIV 
        },
            sharedKey, arrayBufferContent 
        );
    
        // Convert encrypted post content from ArrayBuffers to base64 ASCII strings
        const base64EncryptedContent = arrayBufferToBase64(encryptedArrayBufferContent);

        try {
            // Send the post data to PDS
            await axios.put('https://vd6xek6xw0.execute-api.us-west-1.amazonaws.com/posts', 
                {
                    "email": email,
                    "post": base64EncryptedContent,
                    "postDS": base64Signature
                }
            );
        
            // Send the post data to SNE
            await axios.put('https://8ed9jn76q2.execute-api.us-west-1.amazonaws.com/posts', 
                { 
                    "email": email
                }
            );

            alert("Successfully uploaded post.");
        }
        catch {
            alert("Failed to upload post.");
        }
    }

    const handleViewPost = async (postId, index) => {
        // Fetch the Post and PostDS from the PDS
        const putData = {
            "postId": postId,
            "viewer": email
        };

        try {
            let postData = await axios.put("https://vd6xek6xw0.execute-api.us-west-1.amazonaws.com/posts/view", putData);
        
            postData = postData.data;
            const base64EncryptedPost = postData.base64EncryptedPost;
            const base64PostDS = postData.postDS;
            const base64PosterRsaPublicKey = postData.posterRsaPublicKey; 

            const arrayBufferEncryptedPost = base64ToArrayBuffer(base64EncryptedPost);
            const arrayBufferPostDS = base64ToArrayBuffer(base64PostDS);
            const arrayBufferPosterRsaPublicKey = base64ToArrayBuffer(base64PosterRsaPublicKey);
            const posterRsaPublicKey = await crypto.subtle.importKey('spki', arrayBufferPosterRsaPublicKey,
                {
                    name: "RSA-PSS",
                    modulesLength: 4096,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256"
                }, false, ['verify']
            );

            // Fetch the viewer sharedKey and IV from local storage
            const base64SharedKey = localStorage.getItem('sharedKey');
            const base64IV = localStorage.getItem("IV");
            const arrayBufferSharedKey = base64ToArrayBuffer(base64SharedKey);
            const arrayBufferIV = base64ToArrayBuffer(base64IV);
            const sharedKey = await crypto.subtle.importKey('raw', arrayBufferSharedKey, {name: "AES-GCM", length: 256}, false, ['encrypt', 'decrypt']);

            // Decrpyt Post
            const arrayBufferPost = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    length: 256,
                    iv: arrayBufferIV
                }, sharedKey, arrayBufferEncryptedPost
            );

            // Viewer verifies the post using the PostDS
            const valid = await crypto.subtle.verify(
                {
                    name: "RSA-PSS",
                    saltLength: 32,
                },
                posterRsaPublicKey, arrayBufferPostDS, arrayBufferPost
            );

            if (valid) {
                // show post to viewer
                const decodedPost = arrayBufferToBase64(arrayBufferPost);
                const viewContent = base64ToUtf8(decodedPost);
                setViewContent(viewContent);
                setShowModal(true); // Show the modal
            }
            else {
                alert("Post failed Digital Signature verification.");
            }
            setActiveButtonIndex(index); // Update the activeButtonIndex state with the index of the clicked button
        }
        catch {
            alert("Unable to view post.");
        }
    }
    
    const handleCloseModal = () => {
        setShowModal(false); // Close the modal
    }

    const handleSubmit = async (event) => {
        event.preventDefault();   
        await handlePost();

        // Fetch all existing postids from SNE again after handlePost function completed 
        fetchPostIds();
    }

    const handleDeletePost = async (postId) => {
        // Delete post from PDS
        await axios.delete(`https://vd6xek6xw0.execute-api.us-west-1.amazonaws.com/posts/${postId}`);

        // Delete post from SNE
        const response = await axios.delete(`https://8ed9jn76q2.execute-api.us-west-1.amazonaws.com/posts/${postId}`);

        if (response.data) {
            alert('Successfully deleted post');
            fetchPostIds();
        }
        else {
            alert('Failed to delete post');
        }
    }

    return (
        <Form className="Form" onSubmit={handleSubmit}>
            <Container>
                <h1 className='text-center' style={{ border: '2px solid lightblue', padding: '10px', backgroundColor: 'lightblue', fontFamily: 'Calibri' }}>
                    Write Your Post</h1>       
                <b><Form.Label>User: {email}</Form.Label></b>
                <Form.Group controlId="content">
                    <Form.Label>Post Content:</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        style={{ width: '50%' }} 
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                    />
                </Form.Group>
                <div className='text-left mt-3'>
                    <Button variant="primary" type="submit" style={{ backgroundColor: 'orange',color: 'black',  borderColor: 'orange' }}>Post</Button>
                </div>
                <Form.Group style={{paddingTop:"50px"}} controlId="postId" >
                    <h1 className='text-center' style={{ border: '2px solid lightblue', padding: '10px', backgroundColor: 'lightblue', fontFamily: 'Calibri' }}>
                        View Posts</h1>
                    <div className='text-left'>
                        {postIdsWithEmails.map(({ postId, email }, index)  => (
                            <div key={postId} style={{paddingTop:"30px"}}>
                                <b style={{ display: 'inline-block', width: '150px', paddingRight:"200px" }}>{email}: </b>
                                <Button onClick={() => handleViewPost(postId, index)} className="me-2" variant={activeButtonIndex === index ? 'secondary' : 'warning'}>
                                    Post {index + 1}
                                </Button>
                                {email === localStorage.getItem('email') ?
                                    <Button onClick={() => handleDeletePost(postId)} className="me-2" variant='danger'>
                                        Delete
                                    </Button> : null
                                }
                            </div>
                        ))}
                    </div>
                </Form.Group>
                <Modal show={showModal} onHide={handleCloseModal}>
                    <Modal.Header closeButton style={{ borderBottom: 'none', backgroundColor: 'lightblue' }}>
                        <Modal.Title>View Post Content</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>{viewPostContent}</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </Form>   
    );
}
