import React,{useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';

export function Gallery({photos,notes={},onSelect}:{photos:string[];notes?:Record<string,{alt:string;caption:string}>;onSelect:(index:number)=>void}){
  const[index,setIndex]=useState(0);
  const[previous,setPrevious]=useState<number|null>(null);
  const[direction,setDirection]=useState(1);
  const[loading,setLoading]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const generation=useRef(0);
  useEffect(()=>()=>{generation.current++;if(timer.current)clearTimeout(timer.current)},[]);
  useEffect(()=>{setIndex(0);setPrevious(null);generation.current++;setLoading(false)},[photos]);
  const indices=(start:number)=>Array.from({length:Math.min(3,photos.length)},(_,offset)=>(start+offset)%photos.length);
  const move=async(next:number,dir:number)=>{
    if(!photos.length||next===index||loading)return;
    const current=++generation.current;
    setLoading(true);
    // Decode the incoming photos first so the animation never reveals an empty frame.
    await Promise.all(indices(next).map(async i=>{
      const img=new Image();img.src=photos[i];
      try{await img.decode()}catch{/* Keep the frame stable even if a photo fails to load. */}
    }));
    if(current!==generation.current)return;
    if(timer.current)clearTimeout(timer.current);
    setDirection(dir);
    setPrevious(index);
    setIndex(next);
    setLoading(false);
    timer.current=setTimeout(()=>setPrevious(null),520);
  };
  if(!photos.length)return <p>Beautiful memories are on their way.</p>;
  return <><div className="gallery-carousel" aria-label="Photo gallery" aria-busy={loading} style={{'--gallery-direction':direction} as React.CSSProperties}>
    <button className="icon-button gallery-prev" aria-label="Previous gallery photos" disabled={loading||photos.length<2} onClick={()=>void move((index-1+photos.length)%photos.length,-1)}><ChevronLeft/></button>
    <div className="gallery-stage">
      {previous!==null&&<div className="gallery-grid gallery-outgoing" key={`out-${previous}`} aria-hidden="true">{indices(previous).map(i=><div className="gallery-tile" key={i}><img src={photos[i]} alt=""/><span className="gallery-caption">{notes[photos[i]]?.caption??''}</span></div>)}</div>}
      <div className={`gallery-grid ${previous!==null?'gallery-incoming':''}`} key={`in-${index}`}>{indices(index).map(i=><button key={i} onClick={()=>onSelect(i)} aria-label={`View photo ${i+1}`}><img src={photos[i]} alt={notes[photos[i]]?.alt||('Family photograph '+(i+1))} loading="lazy"/><span className="gallery-caption">{notes[photos[i]]?.caption??''}</span></button>)}</div>
    </div>
    <button className="icon-button gallery-next" aria-label="Next gallery photos" disabled={loading||photos.length<2} onClick={()=>void move((index+1)%photos.length,1)}><ChevronRight/></button>
  </div><div className="gallery-dots">{photos.map((_,i)=><button key={i} className={i===index?'active':''} aria-label={`Start gallery at photo ${i+1}`} aria-pressed={i===index} disabled={loading} onClick={()=>void move(i,i>index?1:-1)}/>)}</div></>;
}
