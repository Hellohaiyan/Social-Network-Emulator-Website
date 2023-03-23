import { useState } from 'react';
import React from "react";
import { Link } from "react-router-dom";
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

// Helper function to convert pds public key to a CryptoKey
async function importPdsPublicKey() {
    var publicKey = await axios.get("https://7v0eygvorb.execute-api.us-west-1.amazonaws.com/publicKey");
    publicKey = publicKey.data.publicKey;

    // Convert from a base64 ASCII string to an ArrayBuffer
    const arrayBufferPublicKey = base64ToArrayBuffer(publicKey);

    // Convert ArrayBuffer to CryptoKey
    const pdsPublicKey = await crypto.subtle.importKey('spki', arrayBufferPublicKey, {name: "ECDH", namedCurve: "P-384"}, false, []);
    return pdsPublicKey;
}

// Helper function to perform Diffie-Hellman shared key generation
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
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true, ['encrypt', 'decrypt']
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
        false, ['encrypt', 'decrypt']
    );

    return {publicKey, privateKey, rsaPublicKey, rsaPrivateKey, sharedKey};
}

export function SignupForm() 
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Function to send the email and password encrypted by the shared key, and also the client public key to PDS.
    const signUp = async () => {
        // Send the user's email and password to SNE
        await axios.put("https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users",
            {"email": email, "password": password}
        );
        
        // Generate diffie hellman shared key
        const { publicKey, privateKey, rsaPublicKey, rsaPrivateKey, sharedKey } = await createKeys();
    
        // Encrypt password with shared key
        const base64Password = utf8ToBase64(password);
        const encodedPassword = base64ToArrayBuffer(base64Password);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedPassword = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                length: 256,
                iv: iv
            },
            sharedKey, encodedPassword
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
        await axios.put('https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users', 
            {
                "email": email,    
                "password": base64EncryptedPassword,
                "clientPublicKey": base64PublicKey,
                "clientRsaPublicKey": base64RsaPublicKey,
                "IV": base64IV
            }
        );

        // Store client's public/private key pairs and shared key in local storage
        localStorage.setItem('publicKey', publicKey);
        localStorage.setItem('privateKey', privateKey);
        localStorage.setItem('rsaPublicKey', rsaPublicKey);
        localStorage.setItem('rsaPrivateKey', rsaPrivateKey);
        localStorage.setItem('sharedKey', sharedKey);
    };

    // Function that calls a signUp function to perform the encryption and send the data to the servers.
    const handleSubmit = (event) => {
        event.preventDefault();
        signUp();
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Please Sign Up</h1>                  
            <input type="email" 
                className="form-control" 
                id="email" 
                aria-describedby="emailHelp" 
                value = {email} 
                placeholder="Enter email"
                onChange = {(event) => setEmail(event.target.value)}
            />
            <br />
            <br />
            <input type="password" 
                className="form-control" 
                id="password" 
                name ="password"
                value = {password}
                placeholder="Password"
                onChange ={(event) => {setPassword(event.target.value)}}
            /> 
            <br />
            <br />
            <input type="password" 
                className="form-control" 
                id="confirmPassword" 
                placeholder="Confirm Password"
            />
            <br />
            <br />
            <button type="submit" className="btn btn-primary">Sign up</button>
            <br />
            <br />
            <Link to="/">Already have an account? Sign In here</Link>  
        </form>
    )
}