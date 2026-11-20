import React from 'react';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {Invitation} from '../src/Invitation';
import {Admin} from '../src/Admin';
import {defaults} from '../src/data';
import {verifyAdminAccess,AdminAuthClient} from '../src/adminAccess';

const memory=new Map<string,string>();
const storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)};
Object.assign(globalThis,{localStorage:storage,sessionStorage:storage});
const render=(element:React.ReactNode)=>renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
storage.setItem('blessing-open-v2','yes');
const cover=render(<Invitation c={defaults}/>);
assert.match(cover,/envelope-flap/);
assert.match(cover,/letter-border/);
assert.match(cover,/Open Invitation/);
assert.match(cover,/satin-bow.png/);
assert.ok(!cover.includes('Main navigation'),'The website stays hidden until the envelope opens, even on a return visit.');
assert.ok(!cover.includes('Will you be attending'),'RSVP content must not appear behind the sealed envelope.');
const invitation=render(<Invitation c={defaults} preview/>);
assert.match(invitation,/christening-portrait.png/);
assert.match(invitation,/Will you be attending/);
assert.match(invitation,/The Ceremony/);
assert.match(invitation,/Gallery/);
assert.ok(!invitation.includes('<footer'),'The public invitation has no bottom footer.');
assert.ok(!invitation.includes('Admin Panel'),'Administration must not be advertised on the public invitation.');
const admin=render(<Admin config={defaults} onPublish={()=>{}}/>);
assert.match(admin,/Admin Sign In/);
assert.match(admin,/Admin access is locked/);
for(const label of ['Hero Section','Live Preview','Save Changes','RSVP Responses'])assert.ok(!admin.includes(label),`Unauthenticated admin exposes ${label}`);
let roleQueries=0;
const fakeClient=(user:boolean,role:string|null,authError=false,roleError=false)=>({
  auth:{getUser:async()=>({data:{user:user?{id:'verified-user'}:null},error:authError?Error('Invalid token'):null})},
  from:()=>{roleQueries++;return {select:()=>({eq:()=>({maybeSingle:async()=>({data:role?{role}:null,error:roleError?Error('Unavailable'):null})})})}}
}) as unknown as AdminAuthClient;
assert.equal(await verifyAdminAccess(null),'unavailable');
assert.equal(await verifyAdminAccess(fakeClient(false,null)),'signed-out');
assert.equal(await verifyAdminAccess(fakeClient(true,'owner',true)),'signed-out');
assert.equal(roleQueries,0,'Invalid sessions must not query private role data');
assert.equal(await verifyAdminAccess(fakeClient(true,null)),'forbidden');
assert.equal(await verifyAdminAccess(fakeClient(true,'viewer')),'forbidden');
assert.equal(await verifyAdminAccess(fakeClient(true,'admin')),'authorized');
assert.equal(await verifyAdminAccess(fakeClient(true,'owner')),'authorized');
assert.equal(await verifyAdminAccess(fakeClient(true,'admin',false,true)),'error');
console.log('PASS: envelope and invitation render; footer removed; admin is locked without verified identity and an admin/owner role.');
