import './App.css';
import React from 'react';
import {SignupForm} from './components/SignupForm/SignUp.js';
import {LoginForm} from './components/LoginForm/LoginForm.js';

function App() 
{
  return (
    <section>
      <SignupForm/>
      <LoginForm/>
    </section>
  )
}
export default App;