import './App.css';
import React from 'react';
import {SignupForm} from './components/SignupForm/SignUp.js';
import {SigninForm} from './components/SigninForm/SigninForm.js';
import axios from 'axios';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

function App() 
{
  axios('https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users').then(function (res) {
    console.log(res)
  });
  axios('https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users').then(function (res) {
    console.log(res)
  });

  return (
    <div class="centered">    
     <Router>
        <Routes>  
          //The home page is for sign in
          <Route exact path="/" element={<SigninForm />} />  
          //The SignupForm page is for sign up      
          <Route path="/SignupForm" element={<SignupForm/>} />
        </Routes>
    </Router>  
    </div>
  )
  
}
export default App;