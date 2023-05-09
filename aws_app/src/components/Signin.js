import { useState } from 'react';
import React from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';


export function Signin ()
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const authenticate = async () => {
        // Fetch user data from SNE table
        const response = await axios.get(`https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users/${email}`);

        // Login user if passwords match
        const userPassword = response.data.password;
        if (userPassword === password) {
            localStorage.setItem('email', email);
        } else {
            alert('Invalid email or password. Please try again.');
        }
    };
  
    const handleSubmit = async (event) =>{
        event.preventDefault();
        await authenticate();
        setEmail('');
        setPassword('');
        window.location.assign("/post");
    };
   
    return (
        <Form className="Form" onSubmit={handleSubmit}>
            <Container className='w-25'>
                <h2 className='text-center'>Sign In</h2>
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
                        name='password'
                        placeholder="Enter password"
                        value={password}
                        onChange ={(event) => {setPassword(event.target.value)}}
                    />
                    <Form.Check
                        type="checkbox"
                        label="Show Password"
                        onChange={() => setShowPassword(!showPassword)}
                        className='mt-2'
                    />
                </Form.Group>
                <div className='text-center'>
                    <Button type='submit'>Sign in</Button>
                </div>
                <div className='text-center Link'>
                    <Link to="/signup">Don't have an account? Sign Up</Link> 
                </div>
            </Container>
        </Form>
    )
}