
import React from "react";
// importing Link from react-router-dom to navigate to 
// different end points.
import { Link } from "react-router-dom";
export function SigninForm ()
{
    return (
      <div className="login-wrapper">
        <h1>Please Sign In</h1>
        <form id = "form_login">
          <label>
             <p>Email</p>
             <input type="text" placeholder="Enter email"/>
          </label>
          <label>
             <p>Password</p>
             <input type="password" placeholder="Password"/>
          </label>
          <div>
             <p><button type="submits">Sign in</button></p>
          </div>
        </form> 
        <br />
         <Link to="/SignupForm">Dont have an account? Sign Up</Link>    
      </div>
    )
  }
  