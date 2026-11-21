import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import {Config,defaults,publicConfig} from './data';
import {Cross} from './UI';
import {Invitation} from './Invitation';
import {Admin} from './Admin';
import {PageTransition} from './PageTransition';
import './styles.css';
import './dimensional.css';
import './continuity.css';
import './transitions.css';
import './finish.css';
function App(){const[c,setC]=useState<Config>(defaults);const[error,setError]=useState(false);useEffect(()=>{document.title=c.name+' ? '+(c.invitationTitle??'Christening')},[c.name,c.invitationTitle]);useEffect(()=>{publicConfig().then(setC).catch(()=>setError(true))},[]);return <PageTransition>{location=><Routes location={location}><Route path="/admin/*" element={<Admin config={c} onPublish={setC}/>}/><Route path="/*" element={error?<main className="error-page"><Cross/><h1>The invitation is resting for a moment.</h1><p>We couldn’t load the event details. Please try again shortly.</p><button className="primary" onClick={()=>window.location.reload()}>Try again</button></main>:<Invitation c={c}/>}/></Routes>}</PageTransition>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
