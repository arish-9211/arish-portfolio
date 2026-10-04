import React from 'react';
import {createRoot} from 'react-dom/client';
import Portfolio from './App.jsx';
import Admin from './Admin.jsx';
import './style.css';
createRoot(document.getElementById('root')).render(window.location.pathname.startsWith('/admin')?<Admin/>:<Portfolio/>);
