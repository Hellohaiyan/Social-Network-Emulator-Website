import { useState } from 'react';
import React from "react";
import { Link } from "react-router-dom";
import axios from 'axios';

export function SignupForm() 
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Check local storage public/private key 
    let publicKey = localStorage.getItem('publicKey');
    let privateKey = localStorage.getItem('privateKey');

    // If keys don't exist, create and store them
    if (!publicKey || !privateKey) 
    {
      const { publicKey, privateKey } = generateKeys();
      localStorage.setItem('publicKey', publicKey);
      localStorage.setItem('privateKey', privateKey);
    }

    // Function to generate key pair
    function generateKeys() 
    {
      return crypto.subtle.generateKey({
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      }, true, ['encrypt', 'decrypt']);
    }
    
    // Helper function to convert ArrayBuffer to base64
    function arrayBufferToBase64(buffer) 
    {
      const binary = String.fromCharCode(...new Uint8Array(buffer));
      return btoa(binary);
    }

    function str2ArrayBuffer(str) {
      const buf = new ArrayBuffer(str.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }

    function importRsaKey(pem) {
      // fetch the part of the PEM string between header and footer
      const pemHeader = "-----BEGIN PUBLIC KEY-----";
      const pemFooter = "-----END PUBLIC KEY-----";
      const pemContents = pem.substring(
        pemHeader.length,
        pem.length - pemFooter.length
      );

      // base64 decode the string to get the binary data
      const binaryDerString = window.atob(pemContents);

      // convert from a binary string to an ArrayBuffer
      const binaryDer = str2ArrayBuffer(binaryDerString);
      return binaryDer;
    }

    // Function to perform Diffie-Hellman key exchange and generate shared key
    async function performKeyExchange(publicKey, privateKey) 
    {
      // Fetch public key from PDS
      const response = await axios.get("https://7v0eygvorb.execute-api.us-west-1.amazonaws.com/publicKey");
      var keyArrayBuffer = importRsaKey(response.data.trim())

      const pdsPublicKey = await crypto.subtle.importKey('spki', keyArrayBuffer, {name: "ECDH", namedCurve: "P-384"}, false, []);

      // Generate client's public and private keys for Diffie-Hellman key exchange
      const { publicKey: clientPublicKey, privateKey: clientPrivateKey } = await crypto.subtle.generateKey({
        name: 'ECDH',
        namedCurve: 'P-384'
      }, true, ['deriveBits']);

      // Export client's public key
      const exportedClientPublicKey = await crypto.subtle.exportKey('spki', clientPublicKey);
      const clientPublicKeyBase64 = arrayBufferToBase64(exportedClientPublicKey);

      // Derive shared key using client's private key and PDS public key
      const sharedBits = await crypto.subtle.deriveBits({
        name: 'ECDH',
        public: pdsPublicKey
      }, clientPrivateKey, 256);

      // Store shared key in local storage
      localStorage.setItem('sharedKey', arrayBufferToBase64(sharedBits));

      return clientPublicKeyBase64;
    }

    //Function to send the email and password encrypted by the shared key, and also the client public key to PDS.
    const signUp = async (email, password) => {
      try {
        //send the user's email and password in plain text to SNE
        const response = await axios.put(
          "https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users",
          {"email": email, "password": password}
        );
        console.log(response.data);
      } catch (error) {
        console.error(error);
      }
      try {
        // Generate shared key and client public key
        const sharedKey = await performKeyExchange(publicKey, privateKey);
    
        // Encrypt email and password with shared key
          const encodedEmail = new TextEncoder().encode(email);
          const encryptedEmail = await crypto.subtle.encrypt({
          name: 'AES-GCM',
          iv: crypto.getRandomValues(new Uint8Array(12)),
          tagLength: 128
        }, sharedKey, encodedEmail);

        const encodedPassword = new TextEncoder().encode(password);
        const encryptedPassword = await crypto.subtle.encrypt({
          name: 'AES-GCM',
          iv: crypto.getRandomValues(new Uint8Array(12)),
          tagLength: 128
        }, sharedKey, encodedPassword);
    
        // Convert encrypted email and password to base64 strings
        const base64Email = arrayBufferToBase64(encryptedEmail);
        const base64Password = arrayBufferToBase64(encryptedPassword);
    
        // Get client public key in base64 format
        const clientPublicKey = arrayBufferToBase64(publicKey);
    
        // Send encrypted email, password, and client public key to PDS
        const response = await axios.put('https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users', {
          "password": base64Password,
          "email": base64Email,
          "sharedKey": sharedKey,
          "clientPublicKey": clientPublicKey
        });
        console.log(response)
      } catch (error) {
        console.error(error);
      }
    };

    //function that calls a signUp function to perform the encryption and send the data to the server.
    const handleSubmit = (event) => {
      event.preventDefault();
      // Call the signUp function with the email and password the user registered
      signUp(email, password);
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
            onChange = {(event) => setEmail(event.target.value)}/>
          <br />
          <br />

          <input type="password" 
            className="form-control" 
            id="password" 
            name ="password"
            value = {password}
            placeholder="Password"
            onChange ={(event) =>
                {setPassword(event.target.value)}}/> 
          <br />
          <br />
          <input type="password" 
            className="form-control" 
            id="confirmPassword" 
            placeholder="Confirm Password"/>
          <br />
          <br />
          <button type="submit" className="btn btn-primary">Sign up</button>
          <br />
          <br />
          <Link to="/">Already have an account? Sign In here</Link>  
      </form>
    )
}
