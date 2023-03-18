import './App.css';
import React from 'react';
import {SignupForm} from './components/SignupForm/SignUp.js';
import {SigninForm} from './components/SigninForm/SigninForm.js';
import {Post} from './components/Post/Post.js';
import axios from 'axios';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

function App() {

  // axios("https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users").then(function (res) {
  //   console.log(res)
  // });

  // axios("https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users").then(function (res) {
  //   console.log(res)
  // });

  // axios("https://7v0eygvorb.execute-api.us-west-1.amazonaws.com/publicKey").then(function (res) {
  //   console.log(res)
  // });
  
  // const userData = {
  //   "email":"test@csus.edu",
  //   "password": "test",
  //   "clientPublicKey":"testpkey",
  //   "sharedKey":"testskey"
  // }

  // axios.put("https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users", userData).then(function (res) {
  //     console.log(res)
  // })

  // const userData2 = {
  //   "email":"test@csus.edu",
  //   "password": "test",
  // }
  // axios.put("https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users", userData2).then(function (res) {
  //     console.log(res)
  // })

  // axios("https://u4gaaf1f07.execute-api.us-west-1.amazonaws.com/users/pds@csus.edu").then(function (res) {
  //   console.log(res)
  // });

  // axios("https://agx9exeaue.execute-api.us-west-1.amazonaws.com/users/sne@csus.edu").then(function (res) {
  //   console.log(res)
  // });


  return (
    <div className="centered">    
     <Router>
        <Routes>  
          {/* The home page is for sign in */}
          <Route exact path="/" element={<SigninForm />} />  
          {/* The SignupForm page is for sign up     */}
          <Route path="/SignupForm" element={<SignupForm/>} />
          {/* The Post page is for post     */}
          <Route path="/Post" element={<Post/>} />
        </Routes>
     </Router>  
    </div>
  )
  
}
export default App;
