import './App.css';
import React from 'react';
import {SignupForm} from './components/SignupForm/SignUp.js';
import {SigninForm} from './components/SigninForm/SigninForm.js';

function App() 
{
  return (
    <section>
      <SignupForm/>
      <SigninForm/>
    </section>
  )
  
}
export default App;