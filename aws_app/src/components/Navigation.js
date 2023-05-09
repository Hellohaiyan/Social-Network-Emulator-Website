import React from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';


export function Navigation() 
{
    const loggedIn = localStorage.getItem('email');
    var signInOut;
    var signUp;

    const handleLogout = () => {
        localStorage.removeItem("email");
    }

    if (loggedIn) {
        signInOut = <Nav.Link href="/" onClick={handleLogout}>Sign Out</Nav.Link>
        signUp = ""
    }
    else {
        signInOut = <Nav.Link href="/signin">Sign In</Nav.Link>;
        signUp = <Nav.Link href="/signup">Sign Up</Nav.Link>
    }
   
    return (
        <Navbar className="Navbar" fixed="top">
            <Container fluid>
                <Navbar.Brand href="/">Social Network Emulator</Navbar.Brand>
                <Nav className="ml-auto">
                    <Nav.Link href="/post">Post</Nav.Link>
                    {signInOut}
                    {signUp}
                </Nav>
            </Container>
        </Navbar>
    )
}