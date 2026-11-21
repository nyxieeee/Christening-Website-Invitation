import type {Group} from './data';
export type GuestCSV={headers:string[];rows:string[][]};
export type GuestMapping={name:string;group:string;key:string;status:string};
export function parseGuestCSV(text:string):GuestCSV{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else if(quoted||cell==='')quoted=!quoted;else throw Error('A quoted value is malformed. Save the file as standard CSV and try again.')}else if(char===','&&!quoted){row.push(cell);cell=''}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(value=>value.trim()))rows.push(row);row=[];cell=''}else cell+=char}
 if(quoted)throw Error('The CSV has an unclosed quotation mark.');
 row.push(cell);if(row.some(value=>value.trim()))rows.push(row);
 if(rows.length<2)throw Error('Include a header row and at least one guest.');
 const headers=rows.shift()!.map(value=>value.trim());
 if(headers.some(header=>!header)||new Set(headers).size!==headers.length)throw Error('Each column needs a unique, non-empty header.');
 for(let i=0;i<rows.length;i++)if(rows[i].length>headers.length)throw Error('Row '+(i+2)+' has too many columns. Put names containing commas inside quotes.');
 if(rows.length>5000)throw Error('Import at most 5,000 guests at a time.');
 return {headers,rows};
}
const normalize=(name:string)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
export function prepareGuestImport(csv:GuestCSV,mapping:GuestMapping,existing:Group[]=[],id:()=>string=()=>crypto.randomUUID()){
 const issues:string[]=[],groups=new Map<string,Group>(),known=new Set(existing.flatMap(group=>group.members.map(member=>normalize(member.name))));let duplicateCandidates=0;
 const value=(row:string[],column:string)=>column?String(row[csv.headers.indexOf(column)]??'').trim():'';
 if(!mapping.name||!csv.headers.includes(mapping.name))return {groups:[] as Group[],issues:['Select the column containing each guest’s name.'],duplicateCandidates:0};
 csv.rows.forEach((row,index)=>{const name=value(row,mapping.name),label=value(row,mapping.group),explicitKey=value(row,mapping.key),status=value(row,mapping.status)||'pending';
 if(!name||name.length>120){issues.push('Row '+(index+2)+': add a guest name of at most 120 characters.');return}
 if(label.length>120){issues.push('Row '+(index+2)+': the family name is too long.');return}
 if(!['pending','attending','declined'].includes(status)){issues.push('Row '+(index+2)+': response must be pending, attending, or declined.');return}
 const key=explicitKey?'key:'+explicitKey:label?'family:'+normalize(label):'individual:'+index;
 let group=groups.get(key);if(!group){group={id:id(),name:label||name,members:[]};groups.set(key,group)}
 if(known.has(normalize(name))||group.members.some(member=>normalize(member.name)===normalize(name)))duplicateCandidates++;
 group.members.push({id:id(),name,status:status as 'pending'|'attending'|'declined'});known.add(normalize(name));
 });
 for(const group of groups.values())if(group.members.length>30)issues.push(group.name+': an invitation can contain at most 30 people.');
 if(groups.size>1000)issues.push('Import at most 1,000 invitations at a time.');
 return {groups:[...groups.values()],issues,duplicateCandidates};
}
