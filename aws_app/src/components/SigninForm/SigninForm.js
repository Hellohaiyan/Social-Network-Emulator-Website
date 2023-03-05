import { useState } from 'react';
import React from "react";
// importing Link from react-router-dom to navigate to 
// different end points.
import { Link } from "react-router-dom";
import axios from 'axios';

export function SigninForm ()
{
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [message1, setMessage1] = useState('');
   const [message2, setMessage2] = useState('');

   const authenticate = async () => {
    try {
      const response = await axios.post(
        `https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users`,
        {
          email,
          password,
        },
        {
          headers: 
          {
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("Response:", response.data);
    } 

    catch (error) 
    {
      console.error("Error:", error.response.data);
    }
  };
  
  const handleSubmit = async (event) =>{
     event.preventDefault();

     setMessage1(`Email is ${email}`);
     setEmail('');
     setMessage2(`Password is ${password}`);
     setPassword('');
     try {
       await authenticate();
       setEmail('');
       setPassword('');
     } 
     catch (error)
    {
       console.error(error);
       alert('There was an error submitting the form. Please try again.');
    }
   };
   
    return (
      <form onSubmit={handleSubmit}>
         <h1>Please Sign In</h1>
           <input type="text" 
                  id = "email" 
                  name = "email" 
                  value = {email} 
                  placeholder="Enter email" 
                  onChange = {(event) => setEmail(event.target.value)}/>
          
           <br />
           <br />

           <input  type="password" 
                   id = "password" 
                   name ="password"
                   value = {password}
                   placeholder="Password"
                   onChange ={(event) =>
                     {setPassword(event.target.value)}}/>
           <br />
           <br />
           <button type="submit">Sign in</button>
           <br />
           <br />
         <Link to="/SignupForm">Dont have an account? Sign Up</Link>    
         <br />
         <br />
         <h2>{message1}</h2>
         <h3>{message2}</h3>
       </form>
    )
  }
  