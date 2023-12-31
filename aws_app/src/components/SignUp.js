import { useState } from 'react';
import React from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';


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

// Helper function to convert pds public key to a CryptoKey
async function importPdsPublicKey() {
    var publicKey = await axios.get("https://lhm97jhwfe.execute-api.us-west-1.amazonaws.com/publicKey");
    publicKey = publicKey.data.publicKey;

    // Convert from a base64 ASCII string to an ArrayBuffer
    const arrayBufferPublicKey = base64ToArrayBuffer(publicKey);

    // Convert ArrayBuffer to CryptoKey
    const pdsPublicKey = await crypto.subtle.importKey('spki', arrayBufferPublicKey, {name: "ECDH", namedCurve: "P-384"}, true, []);
    return pdsPublicKey;
}

// Helper function to create all keys needed by client
async function createKeys() 
{
    // Generate client's ECDH public/private key pair
    const clientKeyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-384'
        },
        true, ['deriveKey']
    );
    const publicKey = clientKeyPair.publicKey;
    const privateKey = clientKeyPair.privateKey;

    // Generate client's RSA public/private key pair
    const clientRsaKeyPair = await crypto.subtle.generateKey(
        {
            name: "RSA-PSS",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true, ['sign', 'verify']
    );
    const rsaPublicKey = clientRsaKeyPair.publicKey;
    const rsaPrivateKey = clientRsaKeyPair.privateKey;

    // Fetch public key from PDS
    const pdsPublicKey = await importPdsPublicKey()

    // Derive shared key using client's private key and PDS public key
    const sharedKey = await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            namedCurve: "P-384",
            public: pdsPublicKey
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256
        },
        true, ['encrypt', 'decrypt']
    );

    return {publicKey, privateKey, rsaPublicKey, rsaPrivateKey, sharedKey};
}

export function Signup() 
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Function to send the email and password encrypted by the shared key, and also the client public key to PDS.
    const signUp = async () => {
        // Check if email was entered
        if (!email) {
            alert("Please enter valid email.");
            return;
        }

        // Check if email has already been signed up
        const response = await axios.get(`https://84qm0tow3e.execute-api.us-west-1.amazonaws.com/users/${email}`);
        if (response.data) {
            alert('This email has already been signed up.');
            return;
        }

        // Send the user's email and password to SNE
        await axios.put("https://84qm0tow3e.execute-api.us-west-1.amazonaws.com/users",
            {"email": email, "password": password}
        );
        
        // Generate public/private key pairs and shared key
        const { publicKey, privateKey, rsaPublicKey, rsaPrivateKey, sharedKey } = await createKeys();
    
        // Encrypt password with shared key
        const base64Password = utf8ToBase64(password);
        const arrayBufferPassword = base64ToArrayBuffer(base64Password);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedPassword = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                length: 256,
                iv: iv
            },
            sharedKey, arrayBufferPassword
        );
    
        // Convert encrypted password and IV from ArrayBuffers to base64 ASCII strings
        const base64EncryptedPassword = arrayBufferToBase64(encryptedPassword);
        const base64IV = arrayBufferToBase64(iv);
    
        // Convert client public keys from Crypto Key to base64 ASCII string
        const arrayBufferPublicKey = await crypto.subtle.exportKey("spki", publicKey);
        const base64PublicKey = arrayBufferToBase64(arrayBufferPublicKey);

        const arrayBufferRsaPublicKey = await crypto.subtle.exportKey("spki", rsaPublicKey);
        const base64RsaPublicKey = arrayBufferToBase64(arrayBufferRsaPublicKey);
    
        // Send encrypted email, password, client public key, and IV to PDS
        await axios.put('https://6og1udg2vl.execute-api.us-west-1.amazonaws.com/users', 
            {
                "email": email,    
                "password": base64EncryptedPassword,
                "clientPublicKey": base64PublicKey,
                "clientRsaPublicKey": base64RsaPublicKey,
                "IV": base64IV
            }
        );

        // Convert the private and shared keys to base64 ASCII string
        const arrayBufferPrivateKey = await crypto.subtle.exportKey("pkcs8", privateKey);
        const base64PrivateKey = arrayBufferToBase64(arrayBufferPrivateKey);
        const arrayBufferRsaPrivateKey = await crypto.subtle.exportKey("pkcs8", rsaPrivateKey);
        const base64RsaPrivateKey = arrayBufferToBase64(arrayBufferRsaPrivateKey);
        const arrayBufferSharedKey = await crypto.subtle.exportKey("raw", sharedKey);
        const base64SharedKey = arrayBufferToBase64(arrayBufferSharedKey);

        // Store client's public/private key pairs and shared key in local storage
        localStorage.setItem('publicKey', base64PublicKey);
        localStorage.setItem('privateKey', base64PrivateKey);
        localStorage.setItem('rsaPublicKey', base64RsaPublicKey);
        localStorage.setItem('rsaPrivateKey', base64RsaPrivateKey);
        localStorage.setItem('sharedKey', base64SharedKey);
        localStorage.setItem("IV", base64IV);

        alert('Successfully signed up');
        window.location.assign("/signin");
    };

    // Function that calls a signUp function to perform the encryption and send the data to the servers.
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Check if password and confirm password match
        if (password !== confirmPassword) 
        {
             alert('Password and confirm password do not match.');
             return;
        }
        await signUp();       
    };
    return (
        <Form className="Form" onSubmit={handleSubmit}>
            <Container className='w-25'>
                <h2 className='text-center'>Sign Up</h2>
                <Form.Group className="mb-3">
                    <Form.Label>Email address:</Form.Label>
                    <Form.Control 
                        type="email"
                        name='email'
                        placeholder="Enter email"
                        value={email}
                        onChange = {(event) => setEmail(event.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Password:</Form.Label>
                    <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <Form.Check
                        type="checkbox"
                        label="Show Password"
                        onChange={() => setShowPassword(!showPassword)}
                        className='mt-2'
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Confirm Password:</Form.Label>
                    <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        name='confirmPassword'
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange ={(event) => {setConfirmPassword(event.target.value)}}
                    />
                    <Form.Check
                        type="checkbox"
                        label="Show Password"
                        onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                        className='mt-2'
                    />
                </Form.Group>
                <div className='text-center'>
                    <Button type='submit'>Sign Up</Button>
                </div>
                <div className='text-center Link'>
                    <Link to="/signin">Already have an account? Sign in</Link>
                </div>
            </Container>
        </Form>
    )
}