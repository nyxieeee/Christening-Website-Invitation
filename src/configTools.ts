import type {Config} from './data';
export type SectionKey='welcome'|'details'|'gallery'|'message'|'rsvp';
export const sectionLabels:Record<SectionKey,string>={welcome:'Welcome message',details:'Event details',gallery:'Photo gallery',message:'Message from the family',rsvp:'RSVP invitation'};
export const defaultSections:SectionKey[]=['welcome','details','gallery','message','rsvp'];
export function visibleSections(c:Config):SectionKey[]{return c.sections===undefined?[...defaultSections]:[...new Set(c.sections)].filter(key=>key in sectionLabels)}
const parts=(value:string,zone:string)=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(part=>[part.type,part.value]));
export function localDateValue(value:string,zone:string){if(!value)return '';const p=parts(value,zone);return p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute}
export function eventInstant(local:string,zone:string):string{
 if(!local)return '';
 const target=Date.parse(local+'Z');if(!Number.isFinite(target))throw Error('Choose a valid date and time.');
 let instant=target;
 for(let i=0;i<4;i++){const p=parts(new Date(instant).toISOString(),zone);const represented=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));const correction=target-represented;if(!correction)break;instant+=correction}
 const iso=new Date(instant).toISOString();if(localDateValue(iso,zone)!==local.slice(0,16))throw Error('This local time does not exist in the selected timezone. Choose another time.');return iso;
}
export function formatEvent(value:string,zone:string,options:Intl.DateTimeFormatOptions={dateStyle:'long',timeStyle:'short'}){return value?new Intl.DateTimeFormat('en-PH',{...options,timeZone:zone}).format(new Date(value)):''}
export function validateInvitation(c:Config,publish=false):string[]{
 const errors:string[]=[];
 if(!c.name.trim())errors.push('Add the child?s name.');
 try{new Intl.DateTimeFormat('en',{timeZone:c.timezone})}catch{errors.push('Choose a valid timezone.')}
 for(const key of ['date','deadline'] as const)if(c[key]&&!Number.isFinite(Date.parse(c[key])))errors.push('Choose a valid '+(key==='date'?'event date':'RSVP deadline')+'.');
 if(c.date&&c.deadline&&Date.parse(c.deadline)>Date.parse(c.date))errors.push('The RSVP deadline must be on or before the event.');
 if(c.gallery.length>50)errors.push('Use at most 50 gallery photos.');
 if(!/^#[0-9a-f]{6}$/i.test(c.color))errors.push('Choose a valid accent color.');
 if(publish){if(c.gallery.some(url=>!url.trim()))errors.push('Replace or remove empty gallery photos.');if(!c.date)errors.push('Set the event date before publishing.');if(!c.hero)errors.push('Add a main photo.');if(visibleSections(c).includes('details')&&!c.church.trim())errors.push('Add the ceremony venue.')}
 return errors;
}
export function invitationChecklist(c:Config,guests:number){return [{key:'identity',label:'Child?s name',done:!!c.name.trim(),tab:'Invitation Content',editor:'Hero'},{key:'date',label:'Event date and time',done:!!c.date&&Number.isFinite(Date.parse(c.date)),tab:'Event Details',editor:'Details'},{key:'venues',label:'Ceremony and reception',done:!!c.church.trim()&&!!c.churchAddress.trim()&&!!c.reception.trim(),tab:'Event Details',editor:'Details'},{key:'photos',label:'Family photographs',done:!!c.hero&&!c.hero.startsWith('/christening-')&&c.gallery.length>0,tab:'Media & Gallery',editor:'Gallery'},{key:'guests',label:'Guest invitations',done:guests>0,tab:'Guest List',editor:'RSVP'}]}
