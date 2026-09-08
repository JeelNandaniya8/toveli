export const interests = ['Photography','Coding','Books','Music','Design','Astronomy','Philosophy','Gaming','Outdoors','Writing'];
export const intents = ['Make friends','Study together','Build something','Create together'];
export const hubs = ['Silver Oak University','Nirma University','Ahmedabad'];
export type Profile = { name:string; hub:string; interests:string[]; intent:string; introvert:boolean; behavior:boolean; cohort:'teen'|'adult' };
export const defaultProfile:Profile={name:'You',hub:hubs[0],interests:['Photography','Coding','Books'],intent:intents[0],introvert:false,behavior:false,cohort:'teen'};
export const people = [
{id:'aarav',name:'Aarav Shah',initials:'AS',color:'blue',hub:hubs[0],interests:['Photography','Coding','Books'],intent:'Make friends',cohort:'teen',bio:'Building little things. Looking for someone to take the scenic route with.'},
{id:'isha',name:'Isha Patel',initials:'IP',color:'pink',hub:hubs[0],interests:['Books','Philosophy','Writing','Music'],intent:'Study together',cohort:'teen',bio:'One more chapter is always a good idea. Let’s start a tiny book club.'},
{id:'dev',name:'Dev Mehta',initials:'DM',color:'orange',hub:hubs[0],interests:['Coding','Design','Gaming'],intent:'Build something',cohort:'teen',bio:'Learning Python. Making things that probably don’t need to exist.'},
{id:'diya',name:'Diya Joshi',initials:'DJ',color:'purple',hub:hubs[1],interests:['Photography','Outdoors','Astronomy'],intent:'Make friends',cohort:'teen',bio:'Sky watcher and weekend photographer. Phone cameras welcome.'},
{id:'neel',name:'Neel Desai',initials:'ND',color:'blue',hub:hubs[0],interests:['Coding','Photography','Books'],intent:'Make friends',cohort:'adult',bio:'Coffee, open source and meeting people beyond my department.'},
{id:'maya',name:'Maya Shah',initials:'MS',color:'pink',hub:hubs[0],interests:['Design','Books','Music','Writing'],intent:'Create together',cohort:'adult',bio:'Design student who always has a notebook nearby.'}
] as const;
export const circles=[{id:'shutter',name:'The Shutter Club',tag:'Photography',icon:'camera',color:'blue',description:'Find the extraordinary in an ordinary afternoon.',members:8},{id:'builders',name:'Build & Breathe',tag:'Coding',icon:'code',color:'orange',description:'Small projects. Patient people. All skill levels.',members:6},{id:'readers',name:'Just One More Chapter',tag:'Books',icon:'book',color:'pink',description:'Bring a book and a thought you can’t shake.',members:10}];
export type Post={id:string;author:string;text:string;tag:string;type:'text'|'photo';color:string};
export const seedPosts:Post[]=[{id:'photo',author:'The Shutter Club',text:'A reminder to look up once in a while. Anyone up for a photo walk this week? No fancy camera needed.',tag:'Photography',type:'photo',color:'blue'},{id:'thought',author:'Isha Patel',text:'What’s a book that changed the way you see people? I’m looking for something that stays with you after the last page.',tag:'Books',type:'text',color:'pink'},{id:'code',author:'Dev Mehta',text:'Looking for a beginner coding buddy. One small project a week and absolutely no pretending we know what we’re doing.',tag:'Coding',type:'text',color:'orange'}];
export function rankPeople(profile:Profile,blocked:string[]=[]){return people.filter(p=>p.cohort===profile.cohort&&!blocked.includes(p.id)).map(p=>{
 const shared=p.interests.filter(i=>profile.interests.includes(i));
 const cosine=shared.length/Math.sqrt(Math.max(1,profile.interests.length)*p.interests.length);
 const hub=p.hub===profile.hub?1:0.5;const intent=p.intent===profile.intent?1:0;
 return {...p,shared,score:Math.round((0.5*cosine+0.3*hub+0.2*intent)*100),breakdown:{interest:Math.round(cosine*50),hub:hub*30,intent:intent*20}};
}).sort((a,b)=>b.score-a.score);}
