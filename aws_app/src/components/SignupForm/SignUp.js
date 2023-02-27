
import React from "react";
import { Link } from "react-router-dom";
export function SignupForm() 
{
    return (
        <div className="card col-12 col-lg-4 login-card mt-2 hv-center">
         <h1>Please Sign Up</h1>
            <form>
                <div>
                    <label htmlFor="exampleInputEmail1">
                     <p>Email</p>
                    </label>
                    <input type="email" 
                        className="form-control" 
                        id="email" 
                        aria-describedby="emailHelp" 
                        placeholder="Enter email"
                    />
                </div>
                <div>
                    <label htmlFor="exampleInputPassword1">
                         <p>Password</p>
                    </label>
                    <input type="password" 
                        className="form-control" 
                        id="password" 
                        placeholder="Password"
                    />
                </div>
                <div>
                    <label htmlFor="exampleInputPassword1">
                        <p>Confirm Password</p>
                    </label>
                    <input type="password" 
                        className="form-control" 
                        id="confirmPassword" 
                        placeholder="Confirm Password"
                    />
                </div>
                <p>
                    <button type="submit" className="btn btn-primary">Sign up</button>
                </p>
            </form>
            <br />
                 <Link to="/">Already have an account? Sign In here</Link>  
        </div>
    )
}
