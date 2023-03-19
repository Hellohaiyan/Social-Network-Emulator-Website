import { useState } from 'react';
import React from "react";
import { Link, Navigate } from "react-router-dom";
import axios from 'axios';



export function SigninForm ()
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authenticated, setAuthenticated] = useState(false);

    const authenticate = async () => {
        // Fetch user data from SNE table
        const response = await axios.get(
            "https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users"
        );

        // Check if email and password match
        const userData = response.data.find(user => user.email === email && user.password === password);
      
        // If user data is found, set authenticated to true and store email in local storage
        if (userData) {
            setAuthenticated(true);
            localStorage.setItem('email', email);
        } else {
            alert('Invalid email or password. Please try again.');
        }
    };
  
    const handleSubmit = async (event) =>{
        event.preventDefault();
        try {
            await authenticate();
            setEmail('');
            setPassword('');
        } 
        catch (error)
        {
            alert('There was an error submitting the form. Please try again.');
        }
    };
   
    // Redirect to post page if authenticated
    if (authenticated) {
        return <Navigate to="/Post" />;
    }
   
    return (
        <form onSubmit={handleSubmit}>
            <h1>Please Sign In</h1>
            <input type="text" 
                id = "email" 
                name = "email" 
                value = {email} 
                placeholder="Enter email" 
                onChange = {(event) => setEmail(event.target.value)}
            />
            <br />
            <br />
            <input type="password" 
                id = "password" 
                name ="password"
                value = {password}
                placeholder="Password"
                onChange ={(event) => {setPassword(event.target.value)}}
            />
            <br />
            <br />
            <button type="submit">Sign in</button>
            <br />
            <br />
            <Link to="/SignupForm">Don't have an account? Sign Up</Link>    
            <br />
            <br />
        </form>
    )
}