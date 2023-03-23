import React from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

export function Navigation() 
{
   return (
    <Navbar className="Navbar" fixed="top">
        <Container fluid>
        <Navbar.Brand href="/">Social Network Emulator</Navbar.Brand>
        <Nav className="ml-auto">
            <Nav.Link href="/signin">Sign In</Nav.Link>
            <Nav.Link href="/signup">Sign Up</Nav.Link>
            <Nav.Link href="/post">Post</Nav.Link>
        </Nav>
        </Container>
    </Navbar>
  )
}