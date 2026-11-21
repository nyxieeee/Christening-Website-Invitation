import React,{useCallback,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';

const dialogs:string[]=[];
let scrollLocks=0;
let restoreScroll:undefined|(()=>void);
function lockScroll(){
 if(scrollLocks++===0){
  const body=document.body,overflow=body.style.overflow,padding=body.style.paddingRight,previous=body.getAttribute('data-modal-open');
  const gutter=window.innerWidth-document.documentElement.clientWidth;
  const reserved=getComputedStyle(document.documentElement).getPropertyValue('scrollbar-gutter').includes('stable');
  if(gutter>0&&!reserved)body.style.paddingRight=((parseFloat(getComputedStyle(body).paddingRight)||0)+gutter)+'px';
  body.style.overflow='hidden';body.setAttribute('data-modal-open','true');
  restoreScroll=()=>{body.style.overflow=overflow;body.style.paddingRight=padding;if(previous===null)body.removeAttribute('data-modal-open');else body.setAttribute('data-modal-open',previous)};
 }
 return()=>{if(--scrollLocks===0){restoreScroll?.();restoreScroll=undefined}};
}
export function Modal({children,close,label,canClose=true}:{children:React.ReactNode|((dismiss:()=>void)=>React.ReactNode);close:()=>void;label:string;canClose?:boolean}){
 const id=useId(),box=useRef<HTMLDivElement>(null);
 const[phase,setPhase]=useState<'opening'|'open'|'closing'>('opening');
 const closeRef=useRef(close),canCloseRef=useRef(canClose),closing=useRef(false),finished=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 closeRef.current=close;canCloseRef.current=canClose;
 const finish=useCallback(()=>{if(finished.current)return;finished.current=true;if(timer.current)clearTimeout(timer.current);closeRef.current()},[]);
 const dismiss=useCallback(()=>{
  if(closing.current||!canCloseRef.current)return;
  closing.current=true;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return}
  setPhase('closing');timer.current=setTimeout(finish,260);
 },[finish]);
 useLayoutEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const unlock=lockScroll();dialogs.push(id);
  box.current?.focus({preventScroll:true});
  let first=0,second=0;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)setPhase('open');
  else first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{if(!closing.current)setPhase('open')})});
  const key=(event:KeyboardEvent)=>{
   if(dialogs[dialogs.length-1]!==id)return;
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss();return}
   if(event.key!=='Tab'||!box.current)return;
   const items=Array.from(box.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
   const first=items[0],last=items[items.length-1];
   if(!first){event.preventDefault();box.current.focus();return}
   const active=document.activeElement;
   if(event.shiftKey&&(active===first||active===box.current||!box.current.contains(active))){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&(active===last||active===box.current||!box.current.contains(active))){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',key);
  return()=>{
   cancelAnimationFrame(first);cancelAnimationFrame(second);if(timer.current)clearTimeout(timer.current);
   document.removeEventListener('keydown',key);
   const index=dialogs.lastIndexOf(id);if(index>=0)dialogs.splice(index,1);
   unlock();if(previous?.isConnected)previous.focus({preventScroll:true});
  };
 },[dismiss,id]);
 const content=<div className="modal-layer" data-state={phase}>
  <div className="modal-scrim" aria-hidden="true"/>
  <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)dismiss()}}>
   <div className="modal" inert={phase==='closing'} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={box} onTransitionEnd={event=>{if(event.target===event.currentTarget&&event.propertyName==='opacity'&&closing.current)finish()}}>
    <button className="modal-close icon-button" onClick={dismiss} disabled={!canClose||phase==='closing'} aria-label="Close dialog"><X/></button>
    {typeof children==='function'?children(dismiss):children}
   </div>
  </div>
 </div>;
 return typeof document==='undefined'?content:createPortal(content,document.body);
}
