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

function App() {
  
  const userData = {"email": "bannu","password": "teja","public_key":"123",

    // Add the data you want to update here
  }

  axios.put('https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users', userData)
    .then(function (res) {
      console.log(res)
    })
    .catch(function (error) {
      console.log(error)
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
