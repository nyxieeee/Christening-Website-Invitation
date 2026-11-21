import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {CalendarDays, Church, Utensils, MapPin, Music2, VolumeX, Menu, X, ChevronLeft, ChevronRight, Clock, RotateCcw} from 'lucide-react';
import {Config} from './data';
import {Cross, Flourish, Countdown, Modal, SectionTitle} from './UI';
import {RSVP} from './RSVP';
import {Gallery} from './Gallery';
import {visibleSections} from './configTools';

export function Bow({className=''}:{className?:string}) { return <img className={`satin-bow ${className}`} src="/satin-bow.png" alt="" aria-hidden="true"/>; }
function LightParticles() {return <div className="light-particles" aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{left:`${(i*37+13)%100}%`,top:`${(i*23+11)%100}%`,animationDelay:`${i*-.47}s`,animationDuration:`${4+i%4}s`}}/>)}</div>}

export function Invitation({c,preview=false}:{c:Config;preview?:boolean}) {
  const [opened,setOpened]=useState(preview);
  const [opening,setOpening]=useState(false),[menu,setMenu]=useState(false),[rsvp,setRsvp]=useState(false);
  const [lightbox,setLightbox]=useState<number|null>(null),[playing,setPlaying]=useState(false);
  const [activeSection,setActiveSection]=useState('home');
  const audio=useRef<HTMLAudioElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const finish=()=>{setOpened(true);setOpening(false)};
  const open=()=>{if(opening)return;if(c.music)audio.current?.play().then(()=>setPlaying(true)).catch(()=>{});if(c.animationEnabled===false||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return}setOpening(true);timer.current=setTimeout(finish,(c.animationDuration??5)*1000)};
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  useEffect(()=>{if(opened&&!preview)document.getElementById('invitation-title')?.focus({preventScroll:true})},[opened,preview]);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.08});document.querySelectorAll('.reveal-on-scroll').forEach(el=>observer.observe(el));return()=>observer.disconnect()},[opened]);

  useEffect(()=>{
    if(!opened)return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(visible[0])setActiveSection(visible[0].target.id);
    },{rootMargin:'-15% 0px -55% 0px'});
    for(const id of ['home','details','gallery']){const section=document.getElementById(id);if(section)observer.observe(section)}
    return()=>observer.disconnect();
  },[opened]);
  const sections=visibleSections(c);
  const showRsvp=sections.includes('rsvp');
  const navigation=['home',...sections.filter(key=>key==='details'||(key==='gallery'&&c.gallery.length>0))];
  const date=c.date?new Date(c.date):null,validDate=date&&!isNaN(date.getTime());
  const format=(options:Intl.DateTimeFormatOptions)=>validDate?date.toLocaleDateString('en-PH',{...options,timeZone:c.timezone}):'To be announced';
  const replay=()=>{setOpened(false);setOpening(false);window.scrollTo({top:0,behavior:'instant'})};
  const toggleMusic=()=>{if(!c.music)return;if(playing){audio.current?.pause();setPlaying(false)}else audio.current?.play().then(()=>setPlaying(true)).catch(()=>{})};
  const story:Record<string,React.ReactNode>={welcome:(<section className="welcome-note section reveal-on-scroll"><span className="eyebrow">WITH GRATEFUL HEARTS</span><h2>{c.welcome}</h2><p>{c.subtitle}</p></section>),details:(<section className="details section reveal-on-scroll" id="details"><SectionTitle label="A DAY OF FAITH, HOPE & LOVE" title={c.eventHeading??'Event Details'}/><div className="detail-grid"><article className="detail-card"><Church size={32} strokeWidth={1}/><h3>The Ceremony</h3><p className="venue">{c.church}</p><p>{c.churchAddress}</p><div className="fine-rule"/><p>{format({month:'long',day:'numeric',year:'numeric'})}</p><p>{validDate?date.toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit',timeZone:c.timezone}):'Time to be announced'}</p>{c.mapUrl&&<a className="text-link" href={c.mapUrl} target="_blank" rel="noreferrer"><MapPin size={15}/>View directions</a>}</article><article className="detail-card"><Utensils size={32} strokeWidth={1}/><h3>The Reception</h3><p className="venue">{c.reception}</p><p>{c.receptionAddress}</p><div className="fine-rule"/><p>{c.receptionTime}</p><p>Good food, warm hearts, beautiful memories.</p></article></div><div className="dress-code"><span className="eyebrow">DRESS CODE</span><p>{c.dressCode}</p><div className="swatches" aria-label="Suggested colors: powder blue, ivory, sage, champagne"><i/><i/><i/><i/></div></div></section>),gallery:c.gallery.length||preview?(<section className="gallery section reveal-on-scroll" id="gallery"><SectionTitle label="PRECIOUS LITTLE MEMORIES" title={c.galleryHeading??'Gallery'}/><Gallery photos={c.gallery} notes={c.galleryNotes} onSelect={setLightbox}/></section>):null,message:c.closing.trim()?(<section className="closing section reveal-on-scroll"><div className="closing-title"><Cross small/><h2>{c.closingHeading??'A Message from Us'}</h2></div><p>{c.closing}</p><p className="signature">With love, {c.name} & family</p><Bow/></section>):null,rsvp:(<section className="rsvp-section section reveal-on-scroll"><Flourish/><h2>{c.rsvpTitle??'Will you be joining us?'}</h2><p>{c.subtitle}</p><button className="primary" onClick={()=>setRsvp(true)}><CalendarDays size={18}/>{c.rsvpButton??'RSVP Now'}</button>{c.deadline&&<p className="tiny">Kindly reply by {new Date(c.deadline).toLocaleDateString('en-PH',{dateStyle:'long',timeZone:c.timezone})}</p>}</section>)};
  return <div className={`invitation-experience ${preview?'is-preview':''} ${c.decorationsEnabled===false?'no-decorations':''}`} style={{'--accent':c.color,'--serif':c.displayFont==='georgia'?'Georgia, serif':'Cormorant Garamond, Georgia, serif','--section-space':(c.sectionSpacing??60)+'px',fontFamily:c.bodyFont==='system'?'system-ui, sans-serif':'DM Sans, sans-serif','--envelope-color':c.envelopeColor??'#aacbe2','--opening-duration':`${c.animationDuration??5}s`} as React.CSSProperties}>
    {c.music&&<audio src={c.music} ref={audio} loop preload="none" onPlay={()=>{if(audio.current)audio.current.volume=c.musicVolume??.2}}/>}
    {!opened?<div className={`envelope-cover dimensional-cover ${opening?'opening':''}`}>
      <div className="scene-halo"/><LightParticles/>
      <div className="cover-top"><p>{c.envelopeLabel}</p><div className="little-laurels" aria-hidden="true">❧ <Cross small/> ❧</div></div>
      <div className="envelope-stage"><div className="envelope-shadow"/><div className="envelope-scene"><div className="envelope-back"/><div className="envelope-inner"/><div className="letter"><div className="letter-border"><Cross/><span>{c.introLine??'You are cordially invited to the'}</span><strong>{c.invitationTitle??'Christening'}</strong><span>{c.dedication??'of our beloved son'}</span><b>{c.name}</b><Bow/></div></div><div className="envelope-front"/><div className="envelope-flap"/><Bow className="envelope-bow"/><div className="seal"><div><Cross small/></div></div></div></div>
      <div className="cover-bottom"><button className="primary" onClick={open} disabled={opening}>{opening?'A beautiful beginning…':'Open Invitation'}</button><button className="text-button" onClick={()=>{if(timer.current)clearTimeout(timer.current);finish()}}>Skip animation</button><p className="tiny">Sealed with love. Opened with joy.</p></div><div className="reveal-vignette" aria-hidden="true"/>
    </div>:<>
      <header className="header"><Link to="#home" className="brand" onClick={()=>{setMenu(false);setActiveSection('home');document.getElementById('home')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}}><Cross small/><span>{c.name}’s<small>{c.invitationTitle??'Christening'}</small></span></Link><nav className={menu?'nav shown':'nav'} aria-label="Main navigation">{navigation.map(id=><a key={id} href={'#'+id} aria-current={activeSection===id?'location':undefined} onClick={()=>{setMenu(false);setActiveSection(id)}}>{id==='home'?'Home':id==='details'?'Details':'Gallery'}</a>)}{showRsvp&&<button onClick={()=>{setRsvp(true);setMenu(false)}}>RSVP</button>}</nav><div className="header-actions"><button className="icon-button" onClick={replay} aria-label="Replay envelope animation" title="Replay invitation"><RotateCcw size={17}/></button><>{c.music&&<button className="icon-button" onClick={toggleMusic} aria-label={playing?'Pause music':c.music?'Play music':'No soundtrack added yet'} title={c.music?'Background music':'No soundtrack added yet'}>{playing?<Music2 size={18}/>:<VolumeX size={18}/>}</button>}</><button className="icon-button menu-toggle" aria-label={menu?'Close menu':'Open menu'} onClick={()=>setMenu(!menu)}>{menu?<X size={21}/>:<Menu size={21}/>}</button></div></header>
      <main><div className="invitation-opening-scene"><LightParticles/>
        <section className="hero" id="home"><div className="hero-portrait" data-frame={c.frameStyle??'oval'}><div className="portrait-outline"><img src={c.hero} alt={`Portrait for ${c.name}’s christening`} fetchPriority="high" style={{objectPosition:`center ${c.heroPosition??45}%`}}/></div><Bow className="portrait-bow"/><div className="portrait-blossoms" aria-hidden="true"/></div><div className="hero-copy"><Flourish/><p className="eyebrow">{c.introLine??'You are cordially invited to the'}</p><h1 id="invitation-title" tabIndex={-1}>{c.invitationTitle??'Christening'}</h1><p className="eyebrow beloved">{c.dedication??'of our beloved son'}</p><h2>{c.name}</h2><Countdown date={c.date}/></div></section>
        {sections.includes('details')&&(<section className="event-strip" aria-label="Event at a glance"><div><CalendarDays/><span>{validDate?format({weekday:'long'}):'Date to be announced'}{validDate&&<strong>{format({month:'long',day:'numeric',year:'numeric'})}</strong>}</span></div><div><Clock/><span>{validDate?date.toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit',timeZone:c.timezone}):'Time to be announced'}<strong>Ceremony</strong></span></div><div><Church/><span>{c.church}<strong>{c.churchAddress}</strong></span></div><div><Utensils/><span>Reception<strong>{c.reception}<br/>{c.receptionAddress}</strong></span></div><div className="strip-map"><MapPin/>{c.mapUrl?<a className="secondary" href={c.mapUrl} target="_blank" rel="noreferrer">View Map</a>:<a className="secondary" href="#details">Event Details</a>}</div></section>)}
        {showRsvp&&(<section className="hero-rsvp-panel"><div className="bow-divider"><span/><Bow/><span/></div><div><h2>{c.rsvpTitle??'Will you be attending?'}</h2><p>Please confirm your attendance so we can prepare for your presence.</p></div><button className="primary" onClick={()=>setRsvp(true)}><CalendarDays size={19}/>{c.rsvpButton??'RSVP Now'}</button></section>)}
      </div><div className="story-sections">{sections.map(key=><React.Fragment key={key}>{story[key]}</React.Fragment>)}</div></main>
    </>}
    {rsvp&&showRsvp&&<RSVP c={c} close={()=>setRsvp(false)}/>}
    {lightbox!==null&&<Modal close={()=>setLightbox(null)} label="Photo gallery"><div className="lightbox"><img key={lightbox} className="lightbox-photo-enter" src={c.gallery[lightbox]} alt={`Family moment ${lightbox+1}`}/><div className="lightbox-controls"><button className="icon-button" aria-label="Previous photo" onClick={()=>setLightbox((lightbox-1+c.gallery.length)%c.gallery.length)}><ChevronLeft/></button><span>{lightbox+1} / {c.gallery.length}</span><button className="icon-button" aria-label="Next photo" onClick={()=>setLightbox((lightbox+1)%c.gallery.length)}><ChevronRight/></button></div></div></Modal>}
  </div>;
}
