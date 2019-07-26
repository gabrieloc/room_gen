Math.clamp = function(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

function randcol(){
 return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
}

addEventListener('load', function(e) {
 const d = document.documentElement;
 canvas.width = d.clientWidth;
 canvas.height = d.clientHeight;

 w = Math.floor(canvas.width);
 h = Math.floor(canvas.height);

 wr=Math.floor(w/res)+1;
 hr=Math.floor(h/res)+1;

 context.lineWidth=1;

 drawGrid();
 seed();
 setInterval(update, 1000/fps);

const actions = ['touchstart', 'mousedown'];
 actions.forEach(function(a){
 document.addEventListener(a, function(e) {
  const t=e.touches[0];
  const loc=new Vector2(
   Math.floor(t.pageX/res),
   Math.floor(t.pageY/res)
  );
  tapRecognized(loc);
 }, false);
}, false);
});

const Dir={N:0,E:1,S:2,W:3};

const fpsLab = document.getElementById('fps');
const canvas = document.getElementById('scene');

const context = canvas.getContext('2d');
const res = 25;
const fps = 30;
const divisions=5;
const inset=4;
const minRoom=2;
const doorSize={w:1,h:0.25};
const debugConnection=false;

var pbuf=[];
var rooms=[];

function Room(rect){
 return {
 rect:rect,
 connections:[]
 };
}

function Connection(from, to){
 const inter=interEdge(from.rect,to.rect);
 this.pos=new Vector2(
  inter.a.x+(inter.b.x-inter.a.x)*0.5,
  inter.a.y+(inter.b.y-inter.a.y)*0.5
 );
 this.dir=edgeDir(inter);
 this.from=from;
 this.to=to;
}

function Rect(origin, size){
 this.origin=origin;
 this.size=size;
 this.width=size.x;
 this.height=size.y;
 this.midX=origin.x+size.x*0.5;
 this.midY=origin.y+size.y*0.5;
 this.minX=origin.x;
 this.maxX=origin.x+size.x;
 this.minY=origin.y;
 this.maxY=origin.y+size.y;
}

function Vector2(x, y){
 this.x=x;
 this.y=y;
}

function drawGrid(){
 for(i=0;i<(w*h)/res;i++){
  const r=cellRect(i);
  context.strokeStyle="eee";
  context.strokeRect(
   r.origin.x, r.origin.y,
   r.width, r.height
  );
 }
}



// 🤘🤘🤘🤘🤘

function seed(){
 var rect= new Rect(
  new Vector2(inset,inset),
  new Vector2(wr-inset*2,hr-inset*2)
 );
 console.log(rect);
 const room=new Room(rect,null);
 subdivide(room,divisions,null);

 context.lineWidth=5;
 context.strokeStyle="000"
 context.strokeRect(
  rect.minX*res,rect.minY*res,
  rect.width*res,rect.height*res
 );

 associateLeafs(room);
 //recursivePrint(room, 1);
 drawRooms(room.children);
}

function recursivePrint(room,i){
 //if(!room.rect) return;
 console.log(
  "•".repeat(i),
  room.rect,
  room.children.length
 );
 if(room.children.length>1){
  room.children.forEach((c)=>{
   recursivePrint(c,i+1)}
  );
 }
}

function subdivide(room, times){
 if (times==0){
  return [room];
 }
 const v=room.rect.width>room.rect.height;
 const sub=bisect(
  room.rect, Math.random(), v
 );

 const s1=sub[0];
 var r1=new Room(s1);
 var r11=subdivide(
  r1,(times-1)
 );
 r1.children=r11;

 const s2=sub[1];
 var r2=new Room(s2);
 const r22=subdivide(
  r2,times-1
 );
 r2.children=r22;
 room.children=[r1,r2];
 return [r1,r2];
}

function bisect(rect, p, dir){
 const x=rect.origin.x;
 const y=rect.origin.y;
 const s1=new Vector2(
  !dir?rect.width:(
   Math.clamp(
    Math.floor(rect.width*p),
    minRoom,rect.width-minRoom
   )
  ),
  dir?rect.height:(
   Math.clamp(
    Math.floor(rect.height*p),
    minRoom,rect.height-minRoom
   )
  )
 );
 const r1=new Rect(
  new Vector2(x, y), s1
 );
// console.log("👁",rect,s1);
 return [
  r1,
  new Rect( 
   new Vector2(
    x+s1.x*dir,
    y+s1.y*!dir
   ),
   new Vector2(
    rect.width-s1.x*dir,
    rect.height-s1.y*!dir
   )
  )
 ];
}

function doorPos(dir,rect){
 switch (dir){
  case Dir.N:
   return new Vector2(
    rect.midX, rect.origin.y
   );
  case Dir.E:
   return new Vector2(
    rect.origin.x+rect.width,rect.midY
   );
  case Dir.S:
   return new Vector2(
    rect.midX,rect.origin.y+rect.height
   );
  case Dir.W:
   return new Vector2(
    rect.origin.x,rect.midY
   );
 }
}

// 👩‍🎨👩‍🎨👩‍🎨👩‍🎨👩‍🎨

function drawRooms(rooms){
 if (rooms.length==1){
  console.log("draw room",rooms);
  drawRoom(rooms[0]);
  return;
 }
 rooms.forEach(r=>{
  drawRooms(r.children);
 });
}

function drawRoom(room){
 const rect=room.rect;
 var doors=[];
 for(i=0;i<4;i++){
  doors[i]=[];
 }
 room.connections.forEach((c)=>{
 // let i=(c.dir);
  let i=(c.dir+((c.dir%2==0)?1:3))%4;
  console.log(`rotated ${c.dir}->${i}`);
  if(doors[i].filter(d=>{
   return d.x==c.pos.x&&d.y==c.pos.y;
  }).length!=0) {
   return;
  }
  doors[i].push(c.pos);
  //drawDoors(c);
 });
 console.log(doors);
 for(i=0;i<4;i++){
  drawWall(i, rect, doors[i]);
 }
}

function drawWall(dir,rect,stops){
 const pts=edgePoints(dir,rect);
 console.log("dir",dir,pts);
 const segments=wallSegments(stops,pts);
 context.strokeStyle ="000";
 segments.forEach(s=>{
  context.lineWidth=1;
  context.beginPath();
  context.moveTo(
   s.sta.x*res,s.sta.y*res
  );
  context.lineTo(
   s.end.x*res,s.end.y*res
  );
  context.stroke();
 });
}

//••••••••••••

function wallSegments(s,p){
 let pts=p.sort((a,b)=>{
  if(a.y==b.y){
   return a.x>b.x;
  }
  return a.y>b.y;
 });
 const sta=pts[0];
 const end=pts[1];
 let xo=(end.y==sta.y?doorSize.w:0)*0.5;
 let yo=(end.x==sta.x?doorSize.w:0)*0.5;

 let stops=s.sort((a,b)=>{
  if (a.y==b.y){
   return a.x>b.x;
  } 
  return a.y>b.y;
 });

 let segments=stops.map((s,i)=>{
  let s1=i==0?sta:stops[i-1];
  let s2=s;
  return {
   sta:i==0?sta:{
    x:s1.x+xo,
    y:s1.y+yo
   },
   end:{
    x:s2.x+xo*-1,
    y:s2.y+yo*-1
   }
  };
 });

 let last=stops[stops.length-1];

 segments.push({
  sta:stops.length==0?sta:{
   x:last.x+xo,
   y:last.y+yo
  },
  end:end
 });

 console.log("segments for", stops, 
  segments,pts);
 return segments;
}

function drawDoors(c){
 const ds={w:1,h:0.25};
 const dir=(c.dir+1)%4;
 const v=dir==Dir.N||dir==Dir.S;
 const dRect={
  x:v?(c.pos.x-ds.w*0.5):(
   c.pos.x-ds.h*(dir==Dir.W)
  ),
  y:v?(
   c.pos.y-ds.h*(dir==Dir.N)
  ):(c.pos.y-ds.w*0.5),
   w:v?ds.w:ds.h,
   h:v?ds.h:ds.w
 };
 context.lineWidth=1;
 context.strokeRect(
  dRect.x*res,dRect.y*res,
  dRect.w*res,dRect.h*res
 );
}

function leafsWithEdge(e, r, arr){
 if (!containsEdge(e,r.rect)){
  return;
 }
 if (r.children.length==1){
  arr.push(r.children[0]);
  return;
 }
 r.children.forEach((c)=>{
  leafsWithEdge(e,c,arr);
 });
}

function edgeDir(edge){
 if(!(edge.a.x==edge.b.x||
      edge.a.y==edge.b.y)){
  return null;
 }
 if(edge.a.y<edge.b.y) return Dir.N;
 if(edge.a.x<edge.b.x) return Dir.E;
 if(edge.a.y>edge.b.y) return Dir.S;
 if(edge.a.x>edge.b.x) return Dir.W;

 return null;
}

function containsEdge(edge, rect){
 const ax=Math.min(edge.a.x,edge.b.x);
 const bx=Math.max(edge.a.x,edge.b.x);
 const ay=Math.min(edge.a.y,edge.b.y);
 const by=Math.max(edge.a.y,edge.b.y);
 if(!(ax==bx||ay==by)){
  return false;
 }
 const xi=rect.maxX>ax&&rect.minX<bx;
 const yi=rect.maxY>ay&&rect.minY<by;
 const y1=rect.minY==ay||rect.maxY==ay;
 const x1=rect.minX==ax||rect.maxX==ax;
 const contains = (xi&&y1)||(yi&&x1);
 //console.log("contains", contains, edge,rect, xi,y1,yi,x1);
 return contains;
}

function interEdge(r1, r2){
 const xi=r1.maxX>r2.minX&&r1.minX<r2.maxX;
 const yi=r1.maxY>r2.minY&&r1.minY<r2.maxY;
 const x1=Math.max(r1.minX,r2.minX);
 const x2=Math.min(r1.maxX,r2.maxX);
 const y1=Math.max(r1.minY,r2.minY);
 const y2=Math.min(r1.maxY,r2.maxY);

 if (r1.minY==r2.maxY&&xi)
  return {
   a:{x:x1,y:r1.minY},
   b:{x:x2,y:r1.minY}
  };
 if (r1.maxX==r2.minX&&yi)
  return {
   a:{x:r1.maxX,y:y1},
   b:{x:r1.maxX,y:y2}
  };
 if (r1.maxY==r2.minY&&xi)
  return {
   a:{x:x2,y:r1.maxY},
   b:{x:x1,y:r1.maxY}
  };
 if (r1.minX==r2.maxX&&yi)
  return {
   a:{x:r1.minX,y:y2},
   b:{x:r1.minX,y:y1}
  };

 return null;
}

function leafs(room){
 if (!room.children) {
  return room;
 }
 return [
  leafs(room.children[0]),
  leafs(room.children[1])
 ];
}

function associateLeafs(r){
 if (r.children.length==1){
  return;
 }

 const a=r.children[0];
 const b=r.children[1];
 const ab=interEdge(a.rect,b.rect);
 if (!ab){
  return;
 }
 var al=[];
 leafsWithEdge(ab,a,al);
 var bl=[];
 leafsWithEdge(ab,b,bl);

 for (ai=0;ai<al.length;ai++){
  var aa=al[ai];
  var found;
  for(bi=0;bi<bl.length;bi++){
   var bb=bl[bi];
   const ie=interEdge(aa.rect,bb.rect);
   if(ie){
    highlightEdge(ie);
    aa.connections.push(
     new Connection(aa,bb)
    );
    bb.connections.push(
     new Connection(bb,aa)
    );
    found=true;
   } else if (found){
    //break;
   }
  }
 }

 r.children.forEach((c)=>{
  associateLeafs(c);
 });
}

function highlightEdge(edge){
 if(!debugConnection) return;

 context.strokeStyle=randcol();//"f00";
  context.lineWidth=4;
  context.beginPath();
  context.moveTo(edge.a.x*res,edge.a.y*res);
  context.lineTo(edge.b.x*res,edge.b.y*res);
  context.stroke();
}

function edgePoints(dir,rect){
 const pts=[
  new Vector2(rect.minX,rect.minY),
  new Vector2(rect.maxX,rect.minY),
  new Vector2(rect.maxX,rect.maxY),
  new Vector2(rect.minX,rect.maxY),
 ];
 return [pts[dir],pts[(dir+1)%4]];
}

function cellRect(i){
 const p=posAtIdx(i);
 return new Rect(
  {x:p.x*res,y:p.y*res},
  new Vector2(
   res,res
  )
 );
}




var touch;
var lastUpdate=Date.now();
var avg = Date.now();

function update() {

 if (touch){
  console.log(touch);
  neighbors(touch).forEach(function(v){
   console.log(idx(v));
  });
  touch=0;
 }

 var now=Date.now();
 const a=now-lastUpdate;
 avg = (avg + a)/2.0;
 lastUpdate=now;
}

function idx(v){
 return v.y*w+v.x;
}

function posAtIdx(i){
 return new Vector2(
  i%wr, 
  Math.floor(i/hr)
 );
}

function fill(v){
 context.fillRect(
  v.x*res, v.y*res,
  res, res
 );
}

function neighbors(v){
 const x=v.x;
 const y=v.y;
 return [
    new Vector2(x-1,y-1),
    new Vector2(x,y-1),
    new Vector2(x+1,y-1),

    new Vector2(x-1,y),
    new Vector2(x+1,y),

    new Vector2(x-1,y+1),
    new Vector2(x,y+1),
    new Vector2(x+1,y+1),
   ];
}

function tapRecognized(l){
 touch=l;
}