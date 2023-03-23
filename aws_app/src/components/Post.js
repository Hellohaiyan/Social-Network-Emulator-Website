 import React from "react";
 import Form from 'react-bootstrap/Form';
 import Container from 'react-bootstrap/Container';
 import Button from 'react-bootstrap/Button';

export function Post() 
{
   return (
    <Form className="Form">
            <Container>
                <h2 className='text-center'>Post</h2>
                <Form.Group className="mb-3">
                    <Form.Label>Write your post:</Form.Label>
                    <Form.Control 
                        type="text"
                        name='post'
                        placeholder="Write your post"
                        as="textarea"
                        rows={5}
                    />
                </Form.Group>
                <Button type='submit'>Submit</Button>
            </Container>
        </Form>
  )
  
}