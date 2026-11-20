import React,{useEffect,useState} from 'react';
import {useLocation} from 'react-router-dom';

export function PageTransition({children}:{children:(location:ReturnType<typeof useLocation>)=>React.ReactNode}){
  const location=useLocation();
  const[displayed,setDisplayed]=useState(location);
  const[phase,setPhase]=useState('enter');
  const destination=location.pathname+location.search;
  const current=displayed.pathname+displayed.search;
  useEffect(()=>{
    if(destination===current){setPhase('enter');return}
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){setDisplayed(location);setPhase('enter');return}
    setPhase('exit');
    const timer=setTimeout(()=>{window.scrollTo({top:0,behavior:'instant'});setDisplayed(location);setPhase('enter')},160);
    return()=>clearTimeout(timer);
  },[destination,current,location]);
  return <div className={`page-transition page-${phase}`}>{children(displayed)}</div>;
}
