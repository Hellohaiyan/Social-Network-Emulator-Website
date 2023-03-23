import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import React from 'react';
import {Home} from './components/Home.js';
import {Navigation} from './components/Navigation.js';
import {Signup} from './components/SignUp.js';
import {Signin} from './components/Signin.js';
import {Post} from './components/Post.js';
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";



function App() {
    return (
        <div>
            <Navigation/>    
            <Router>
                <Routes>
                    <Route exact path="/" element={<Home/>} /> 
                    <Route exact path="/signin" element={<Signin/>} />  
                    <Route path="/signup" element={<Signup/>} />
                    <Route path="/post" element={<Post/>}/>
                </Routes>
            </Router>  
        </div>
    )
}

export default App;