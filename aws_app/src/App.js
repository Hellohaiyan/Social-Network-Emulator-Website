import './App.css';
import React from 'react';
import {SignupForm} from './components/SignupForm/SignUp.js';
import {SigninForm} from './components/SigninForm/SigninForm.js';
// const axios = require('axios');
import axios from 'axios'

function App() 
{
  axios.get('https://x6cagtyd32.execute-api.us-west-1.amazonaws.com/users')
  .then(function (response) {
    // handle success
    console.log(response);
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  return (
    <section>
      <SignupForm/>
      <SigninForm/>
    </section>
  )
  
}
export default App;