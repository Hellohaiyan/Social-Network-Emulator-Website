import { useState } from 'react';
import React from "react";
import { Link } from "react-router-dom";
import axios from 'axios';

export function SignupForm() 
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  
    const signUp = async (email, password) => {
      try {
        const response = await axios.put(
          "https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users",
          {"email": email, "password": password}
        );
        console.log(response.data);
      } catch (error) {
        console.error(error);
      }
    };
  
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
