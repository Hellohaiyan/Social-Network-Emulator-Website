 
import {useEffect, useState } from 'react';
import React from "react";
import { Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from 'axios';

export function Post() 
{
     const [authenticated, setauthenticated] = useState(null);
     useEffect(() => {
     const loggedInUser = localStorage.getItem("authenticated");
     if (loggedInUser) {
         setauthenticated(loggedInUser);
     }
     }, []);
    
     if (!authenticated) {
     // Redirect
     return <Navigate replace to="/" />;
     } else {
        return (
        <div>
         <label>
           Write your post:
         <br />
         <br />
           <textarea name="postContent" rows={8} cols={40} />
         <br />
         <br />
           <button type="submit" className="btn btn-primary">Post</button>
         <br />
         <br />
         </label>
         </div>
        )
    
     };
}
    

