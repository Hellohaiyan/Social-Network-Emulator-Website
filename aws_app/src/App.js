import './App.css';
import React from 'react';
import {SignupForm} from './components/SignupForm/SignUp.js';
import {SigninForm} from './components/SigninForm/SigninForm.js';
import axios from 'axios';

function App() 
{
  axios('https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users').then(function (res) {
    console.log(res)
  });
  axios('https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users').then(function (res) {
    console.log(res)
  });

  return (
    <section>
      <SignupForm/>
      <SigninForm/>
    </section>
  )
  
}
export default App;