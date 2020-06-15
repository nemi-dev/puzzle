!function(t){var e={};function i(s){if(e[s])return e[s].exports;var n=e[s]={i:s,l:!1,exports:{}};return t[s].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=t,i.c=e,i.d=function(t,e,s){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:s})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var s=Object.create(null);if(i.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)i.d(s,n,function(e){return t[e]}.bind(null,n));return s},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=0)}([function(t,e,i){"use strict";i.r(e);class s{getPosition(t,e,i){let s=this.size/i;return[this.left+e*s,this.top+t*s]}waitForImageLoad(){return this.texture=new Image,this.texture.src="/img/"+this.img,this.texture.complete?Promise.resolve():new Promise((t,e)=>{this.texture.onload=e=>{t()},this.texture.onerror=e})}}class n{constructor(t){this.running=!1,this.a=null,this.update=t}run(){this.running=!0,this.a=t=>{this.update(t),this.running&&requestAnimationFrame(this.a)},requestAnimationFrame(this.a)}stop(){this.running=!1,this.a=null}}function h(t,e,i,s){return Math.floor((t-i)/(e/s))}function o(t,e,i,s,n,o){return[h(e,i,n,o),h(t,i,s,o)]}function l(t,e,i,s,n,h){let o=i/h;return[s+e*o,n+t*o]}class r{constructor(t,e,i,s,n,h){this.velX=0,this.velY=0,this.destX=null,this.destY=null,this.tag=t,this.texture=e,this.sx=i,this.sy=s,this.srcSize=n,this.size=h}whereami(t,e,i,s){return o((null!=this.destX?this.destX:this.x)+this.size/2,(null!=this.destY?this.destY:this.y)+this.size/2,i,t,e,s)}update(t){if(null!=this.destX){let e=this.destX-this.x;if(this.velX=this.size/6*Math.sign(e),Math.abs(e)<Math.abs(this.velX)||Math.abs(e)<.1){if(this.x=this.destX,this.destX=null,Math.abs(this.velX)>=3){let e=this.x;this.velX>0&&(e+=this.size),t.createSpark(e,this.y,"h",-Math.sign(this.velX))}this.velX=0}}if(null!=this.destY){let e=this.destY-this.y;if(this.velY=this.size/6*Math.sign(e),Math.abs(e)<Math.abs(this.velY)||Math.abs(e)<.1){if(this.y=this.destY,this.destY=null,Math.abs(this.velY)>=3){let e=this.y;this.velY>0&&(e+=this.size),t.createSpark(this.x,e,"v",-Math.sign(this.velX))}this.velY=0}}this.x+=this.velX,this.y+=this.velY,this.x<t.left?(this.x=t.left,this.velX=0):this.x+this.size>t.right&&(this.x=t.right-this.size,this.velX=0),this.y<t.top?(this.y=t.top,this.velY=0):this.y+this.size>t.bottom&&(this.y=t.bottom-this.size,this.velY=0)}render(t,e=!0){if(t.fillStyle="white",t.lineWidth=1,t.strokeRect(this.x,this.y,this.size,this.size),t.drawImage(this.texture,this.sx,this.sy,this.srcSize,this.srcSize,this.x,this.y,this.size,this.size),e){let e=Math.floor(this.size/3);t.font=e+'px "Exo 2"',t.lineWidth=3;let{width:i}=t.measureText(this.label),s=this.x+i/2+4,n=this.y+this.size/6+2;t.strokeText(this.label,s,n),t.fillText(this.label,s,n)}}getIntoPositionNow(){null!=this.destX&&(this.x=this.destX,this.destX=null,this.velX=0),null!=this.destY&&(this.y=this.destY,this.destY=null,this.velY=0)}willHit(t,e){if("h"==e)for(const e of t);return[]}}function a(t,e,i){if(t==e)return!1;let s,n,h,o;if("h"==i)s=Math.min(t.x,t.x+t.velX),n=Math.max(t.x+t.size,t.x+t.size+t.velX),h=Math.min(e.x,e.x+e.velX),o=Math.max(e.x+e.size,e.x+e.size+e.velX);else{if("v"!=i)return!1;s=Math.min(t.y,t.y+t.velY),n=Math.max(t.y+t.size,t.y+t.size+t.velY),h=Math.min(e.y,e.y+e.velY),o=Math.max(e.y+e.size,e.y+e.size+e.velY)}return s<o&&h<n}window.willHit=a;const u=31;class c{constructor(){this.piece=null,this.row=null,this.col=null,this.pieceOffsetX=null,this.pieceOffsetY=null,this.concern=null,this.moveAxis=null}onMousedown(t,e){let{startX:i,startY:s}=t,[n,h]=e.rowColOfBlank,[o,l]=e.getRowColAt(i,s);n==o?(this.moveAxis="h",this.concern=e.getVector(n,"row")):h==l&&(this.moveAxis="v",this.concern=e.getVector(h,"col")),this.row=o,this.col=l,this.piece=e.getPieceAt(o,l),this.pieceOffsetX=i-this.piece.x,this.pieceOffsetY=s-this.piece.y}onMouseup(t,e){let{startX:i,startY:s,endX:n,endY:h,startTime:o,endTime:l}=t,r="h"==this.moveAxis?n-i:h-s;l-o<300&&Math.abs(r)<u?this.updateModelThenView(e):this.updateModelByView(e),this.piece=null,this.moveAxis=null,this.concern=null}updateModelThenView(t){const e=[],i="h"==this.moveAxis?this.row*t.size:this.col,s="h"==this.moveAxis?1:t.size;for(let n=0;n<t.size;n++){let h=i+s*n;e[n]=t.puzzleModel[h]}const n=this.piece.tag,h=e.indexOf(n),o=e.indexOf(t.blankTag);e.splice(o,1),e.splice(h,0,t.blankTag);for(let n=0;n<t.size;n++){let h=i+s*n;t.puzzleModel[h]=e[n];let o=t.pieces[e[n]],[r,a]=[Math.floor(h/t.size),h%t.size],[u,c]=l(r,a,t.len,t.left,t.top,t.size);o.destX=u,o.destY=c}}updateModelByView(t){let e={};for(const i of this.concern){if(i.tag==t.blankTag)continue;let[s,n]=i.whereami(t.left,t.top,t.len,t.size);e[s*t.size+n]=i.tag;let h=t.left+n*t.pieceSize,o=t.top+s*t.pieceSize;i.destX=h,i.destY=o}const i="h"==this.moveAxis?this.row*t.size:this.col,s="h"==this.moveAxis?1:t.size;for(let n=0;n<t.size;n++){let h=i+s*n;if(!(h in e)){e[h]=t.blankTag;break}}for(const i in e){const s=e[i];t.puzzleModel[i]=s}}update(t,e){if("h"==this.moveAxis&&null!=e.beforeX){let t=e.x-this.pieceOffsetX;this.piece.velX=t-this.piece.x}else if("v"==this.moveAxis&&null!=e.beforeY){let t=e.y-this.pieceOffsetY;this.piece.velY=t-this.piece.y}this.resolveCollision(t)}resolveCollision(t){const e=t.blankTag,i=this.concern.length,s="h"==this.moveAxis?this.col:this.row,[n,h]="h"==this.moveAxis?["x","velX"]:["y","velY"],o=this.piece[h],l=Math.sign(o);if(0!=l){for(let t=s;t>=0&&t<i;t+=l){const s=this.concern[t];if(s.tag!=e)for(let o=t+l;o>=0&&o<i;o+=l){const t=this.concern[o];t.tag!=e&&(a(s,t,this.moveAxis)&&(t[n]=s[n]+s[h]+t.size*l))}}let o;o="h"==this.moveAxis?l<0?t.left:t.right-this.piece.size:l<0?t.top:t.bottom-this.piece.size;const[r,u]=l<0?[0,i]:[i-1,-1];for(let e=r;e!=u;e-=l){if(this.concern[e].tag==t.blankTag)continue;const i=this.concern[e];(i[n]+i[h]-o)*l>0&&(i[n]=o,i[h]=0,o+=this.piece.size*-l)}}}}class d{constructor(t,e,i){this.startTime=null,this.endTime=null,this.currentTime=0,this.y=i/2,this.left=t,this.width=e,this.height=i}set width(t){this._width=t,this.w_3=t/3,this.w_6=t/6,this.p=this.w_6-t/25,this.q=this.w_6+t/25}set height(t){this._height=t,this.fontSize=t-18}start(t){this.startTime=t,this.endTime=null}end(t){this.endTime=t}reset(){this.startTime=null,this.endTime=null,this.currentTime=null}update(t){this.currentTime=t}render(t){let{y:e,left:i,w_3:s,w_6:n,p:h,q:o}=this;t.clearRect(i,0,this._width,this._height),t.font=this.fontSize+'px "Exo 2"';let[l,r,a]=function(t){let e=Math.round(t/10),i=Math.floor(e/6e3),s=(e%6e3).toString(),n=s.length;if(n<4){let t=Array(4-n);t.fill("0"),s=t.join("")+s}let h=i.toString(),o=h.length;if(o<2){let t=Array(2-o);t.fill("0"),h=t.join("")+h}return[h,s.substr(0,2),s.substr(2,2)]}(this.currentTime-this.startTime);t.lineWidth=4,t.textAlign="center",t.strokeText(l,i+n,e),t.strokeText("'",i+s,e),t.strokeText('"',i+2*s,e),t.fillText(l,i+n,e),t.fillText("'",i+s,e),t.fillText('"',i+2*s,e),t.textAlign="right",t.strokeText(r[0],i+s+n,e),t.strokeText(a[0],i+2*s+n,e),t.fillText(r[0],i+s+n,e),t.fillText(a[0],i+2*s+n,e),t.textAlign="left",t.strokeText(r[1],i+s+n,e),t.strokeText(a[1],i+2*s+n,e),t.fillText(r[1],i+s+n,e),t.fillText(a[1],i+2*s+n,e)}}const f=20,p=20,m=.75,g=.125,v=50,z=25,b=50,x=25,y=1,w=.5,M=30,_=-20,X=90,Y=0,k=1,T=-3;class S{constructor(t,e,i,s,n){this.life=f,this.x=t,this.y=e,this.len=i,this.width=8,this.axis=s,this.direction=n;let[h,o]="h"==s?[n*p,0]:[0,n*p];this.particles=Array.from(Array(10),()=>{let n,l,r=Math.random()*i,[a,u]="h"==s?[t,e+r]:[t+r,e];return"h"==s?(n=h+(Math.random()-.5)*p*1.5,l=o+(r-i/2)/6):(n=h+(r-i/2)/6,l=o+(Math.random()-.5)*p*1.5),{x:a,y:u,velX:n,velY:l}})}update(t){for(const t of this.particles)t.x+=t.velX,t.y+=t.velY,t.velY+=m,t.velX-=Math.sign(t.velX)*g;this.life--}render(t){const e=t.strokeStyle;t.strokeStyle=function(t){let e=1-t/f;return`hsl(${v+(z-v)*e}, 100%, ${b+(x-b)*e}%, ${y+(w-y)*e})`}(this.life),t.lineWidth=3,t.globalCompositeOperation="screen";for(const e of this.particles){const{x:i,y:s,velX:n,velY:h}=e;t.beginPath(),t.moveTo(i,s),t.lineTo(i-2*n,s-2*h),t.stroke()}t.strokeStyle=function(t){let e=1-t/f;return`hsl(${M+(_-M)*e}, 100%, ${X+(Y-X)*e}%, ${k+(T-k)*e})`}(this.life),t.beginPath(),t.moveTo(this.x,this.y),"h"==this.axis?t.lineTo(this.x,this.y+this.len):t.lineTo(this.x+this.len,this.y),t.stroke(),t.globalCompositeOperation="source-over",t.strokeStyle=e}get invalid(){return this.life<0}}function E(t,e){for(;;){let i=Math.floor(Math.random()*t.length);if(t[i]!=e)return i}}function B(t,e){let i=t.indexOf(e),s=Math.sqrt(t.length),n=Math.floor(i/s),h=0;for(let i=0;i<t.length;i++)if(t[i]!=e)for(let s=i+1;s<t.length;s++)t[s]!=e&&t[i]>t[s]&&h++;return(h+(s%2==0?n+1:0))%2==0}class P{constructor(t,e,i,s,n,h){this.playing=!1,this.blankTag=0,this.showLabel=!1,this._bottomBlank=!0,this._rightBlank=!1,this._upsideDown=!1,this.grab=new c,this.sprites=[],this.handlePlay=this._noop,this.completeHandlers=[],this.left=i,this.top=s,this.len=n,this.timer=new d(i,n,h),this.viewWidth=2*i+n,this.viewHeight=2*s+n+h,this._size=t,this.setPuzzleSet(e)}get right(){return this.left+this.len}get bottom(){return this.top+this.len}get size(){return this._size}get pieceSize(){return this.len/this._size}get rowColOfBlank(){let t=this.puzzleModel.indexOf(this.blankTag);return[Math.floor(t/this._size),t%this._size]}assignLabel(t){this._upsideDown=t;const e=this._size*this._size;for(let i=0;i<e;i++){let e=Math.floor(i/this._size),s=i%this._size,n=(t?this._size-e-1:e)*this._size+s+1;this.pieces[i].label=n.toString()}}setSize(t,e,i){this.end(null),this.timer.reset(),this._size=t,this._bottomBlank=e,this._rightBlank=i;const s=t*t;this.puzzleModel=new Array(s),this.pieces=new Array(s);const n=this._puzzleSet.size/t;for(let e=0;e<s;e++){this.puzzleModel[e]=e;let i=Math.floor(e/t),s=e%t,[h,o]=l(i,s,this._puzzleSet.size,this._puzzleSet.left,this._puzzleSet.top,t);this.pieces[e]=new r(e,this._puzzleSet.texture,h,o,n,this.len/t)}this.blankTag=this._size*(this._size-1)*Number(e)+(this._size-1)*Number(i),this.assignLabel(this._upsideDown),this.initPiecePosition()}setPuzzleSet(t){this._puzzleSet=t,this.solvable=t.solvable,this.setSize(this._size,this._bottomBlank,this._rightBlank)}shuffle(){do{if(this.puzzleModel.sort(()=>.5-Math.random()),B(this.puzzleModel,this.blankTag)!=this.solvable){let t,e=E(this.puzzleModel,this.blankTag);do{t=E(this.puzzleModel,this.blankTag)}while(e==t);let i=this.puzzleModel[e];this.puzzleModel[e]=this.puzzleModel[t],this.puzzleModel[t]=i}}while(this.isSolved())}initPiecePosition(){const t=this._size*this._size,e=this._size,i=this.len;for(let s=0;s<t;s++){const t=this.puzzleModel[s];let n=Math.floor(s/e),h=s%e,o=this.pieces[t];o.destX=this.left+h*i/e,o.destY=this.top+n*i/e,o.getIntoPositionNow()}}getRowColAt(t,e){return o(t,e,this.len,this.left,this.top,this._size)}getPieceAt(t,e){let i=e+t*this._size,s=this.puzzleModel[i];return this.pieces[s]}getVector(t,e){let i,s,n=new Array(this._size);switch(e){case"row":i=t*this._size,s=1;break;case"col":i=t,s=this._size}for(let t=0;t<this._size;t++)n[t]=this.pieces[this.puzzleModel[i+s*t]];return n}createSpark(t,e,i,s){this.sprites.push(new S(t,e,this.len/this.size,i,s))}dispatchMousedown(t){this.grab.onMousedown(t,this);for(const t of this.pieces)t.tag!=this.blankTag&&t.getIntoPositionNow()}dispatchMouseup(t){this.grab.onMouseup(t,this)}_noop(){}_updateForPlaying(t){this.isSolved()?this.onComplete(t):this.timer.update(t)}start(t){this.handlePlay=this._updateForPlaying,this.playing=!0,this.timer.start(t)}end(t){this.handlePlay=this._noop,this.playing=!1,this.timer.end(t)}checkBeforeEnd(){return!this.playing||window.confirm("설정을 변경하면 현재 진행 중인 게임이 종료됩니다.\n게임을 중단하고 설정을 변경할까요?")}isSolved(){for(let t=0;t<this.puzzleModel.length;t++)if(this.puzzleModel[t]!=t)return!1;return!0}onComplete(t){this.end(t);for(const t of this.completeHandlers)t()}acceptCoordinate(t,e){if(t<this.left||t>this.right||e<this.top||e>this.bottom)return!1;let[i,s]=this.rowColOfBlank,[n,h]=this.getRowColAt(t,e);return i==n!=(s==h)}update(t,e){this.handlePlay(t),this.grab.piece&&this.grab.update(this,e);for(const t of this.pieces)t.tag!=this.blankTag&&t.update(this);for(let t=0;t<this.sprites.length;t++){const e=this.sprites[t];e.update(this),e.invalid&&(this.sprites.splice(t,1),t--)}}render(t){t.clearRect(0,0,this.viewWidth,this.viewHeight);for(const e of this.pieces)e.tag!=this.blankTag&&e.render(t,this.showLabel);for(const e of this.sprites)e.render(t)}}class L{constructor(){this.messages=[],this.scale=1,this.inputX=null,this.inputY=null,this.currentX=null,this.currentY=null,this._beforeX=null,this._beforeY=null,this.messagePool=[],this.mousedown=t=>(t.preventDefault(),this.listener.acceptCoordinate(t.offsetX*this.scale,t.offsetY*this.scale)&&(this.currentX=t.offsetX*this.scale,this.currentY=t.offsetY*this.scale,this.inputX=t.offsetX*this.scale,this.inputY=t.offsetY*this.scale,this.source.addEventListener("mousemove",this.mousemove),document.addEventListener("mouseup",this.mouseup),this.messages.push({type:"mousedown",startX:t.offsetX*this.scale,startY:t.offsetY*this.scale,startTime:t.timeStamp}),this.messagePool[t.button]={type:"mouseup",startX:t.offsetX*this.scale,startY:t.offsetY*this.scale,startTime:t.timeStamp}),!1),this.mousemove=t=>{this.inputX=t.offsetX*this.scale,this.inputY=t.offsetY*this.scale},this.mouseup=t=>{let e=t.offsetX*this.scale,i=t.offsetY*this.scale,s=this.messagePool[t.button];delete this.messagePool[t.button],s.endX=e,s.endY=i,s.endTime=t.timeStamp,this.messages.push(s),this.inputX=e,this.inputY=i,this.source.removeEventListener("mousemove",this.mousemove),document.removeEventListener("mouseup",this.mouseup)}}get x(){return this.currentX}get y(){return this.currentY}get beforeX(){return this._beforeX}get beforeY(){return this._beforeY}get moveX(){return null!=this.beforeX&&null!=this.currentX?this.currentX-this._beforeX:0}get moveY(){return null!=this.beforeY&&null!=this.currentY?this.currentY-this._beforeY:0}connect(t,e){this.disconnect(),this.source=t,this.listener=e,this.source.addEventListener("mousedown",this.mousedown)}disconnect(){let t=this.source;t&&(t.removeEventListener("mousedown",this.mousedown),t.removeEventListener("mousemove",this.mousemove),document.removeEventListener("mouseup",this.mouseup)),this.source=null,this.listener=null}update(){let t;for(;null!=(t=this.messages.shift());)switch(t.type){case"mousedown":this.listener.dispatchMousedown(t);break;case"mouseup":this.listener.dispatchMouseup(t)}this._beforeX=this.currentX,this._beforeY=this.currentY,this.currentX=this.inputX,this.currentY=this.inputY}}var A=function(t,e,i,s){return new(i||(i=Promise))((function(n,h){function o(t){try{r(s.next(t))}catch(t){h(t)}}function l(t){try{r(s.throw(t))}catch(t){h(t)}}function r(t){var e;t.done?n(t.value):(e=t.value,e instanceof i?e:new i((function(t){t(e)}))).then(o,l)}r((s=s.apply(t,e||[])).next())}))};let I,O,C,R,F;const j=document.getElementById("puzzle-preview"),D=document.getElementById("game-canvas"),N=document.getElementById("preview-canvas"),H=document.getElementById("timer-canvas"),V=D.getContext("2d"),W=N.getContext("2d"),$=H.getContext("2d"),q=document.getElementById("story");V.textAlign="center",V.textBaseline="middle",$.textAlign="center",$.textBaseline="middle",$.fillStyle="#FFFFFF";const G=20,J=20,K=D.width-2*G,Q=H.height,U=document.getElementById("size"),Z=document.getElementById("puzzle-selector"),tt=document.getElementById("start"),et=document.getElementById("stop"),it=document.getElementById("next"),st=document.getElementById("random"),nt={topLeft:document.getElementById("blank-pos-top-left"),topRight:document.getElementById("blank-pos-top-right"),bottomLeft:document.getElementById("blank-pos-bottom-left"),bottomRight:document.getElementById("blank-pos-bottom-right")};const ht={none:document.getElementById("show-label-none"),phone:document.getElementById("show-label-phone"),keypad:document.getElementById("show-label-keypad")};function ot(){tt.hidden=!1,tt.innerText="시작하기",et.hidden=!0,it.hidden=!0,st.hidden=!1}function lt(){tt.hidden=!1,tt.innerText="다시하기",et.hidden=!0,it.hidden=!1,st.hidden=!1}function rt({texture:t,left:e,top:i,size:s}){let{width:n,height:h}=N;W.clearRect(0,0,n,h),W.drawImage(t,e,i,s,s,G,J,n-2*G,h-2*J)}function at(){j.hidden=!0,q.hidden=!1,R&&(q.innerText=R.story)}function ut(){j.hidden=!1,q.hidden=!0}function ct(t){if(!I.checkBeforeEnd())return t.preventDefault(),!1;I.setSize(U.valueAsNumber,nt.bottomLeft.checked||nt.bottomRight.checked,nt.topRight.checked||nt.bottomRight.checked),ot(),ut()}function dt(t){I.end(null),I.shuffle(),I.initPiecePosition(),I.start(t),tt.hidden=!0,et.hidden=!1,it.hidden=!0,st.hidden=!0,ut()}(function(){return A(this,void 0,void 0,(function*(){const t=[],e=yield fetch("puzzleset.json"),i=yield e.json();for(let e=0;e<i.length;e++){const n=i[e];n.__proto__=s.prototype,t.push(n);const h=document.createElement("option");h.value=e.toString(),h.innerText=n.title,Z.appendChild(h)}return yield Promise.all(t.map(t=>t.waitForImageLoad())),t}))})().then(t=>{F=t,tt.addEventListener("click",t=>{if(!I.checkBeforeEnd())return t.preventDefault(),!1;dt(t.timeStamp)}),et.addEventListener("click",t=>{I.end(t.timeStamp),ot()}),it.addEventListener("click",t=>{if(!I.checkBeforeEnd())return t.preventDefault(),!1;!function(t){let e=Number(Z.value);do{e=(e+1)%Z.length,R=F[e]}while(!R.solvable);Z.value=e.toString()}(),I.setPuzzleSet(R),rt(R),dt(t.timeStamp)}),st.addEventListener("click",t=>{if(!I.checkBeforeEnd())return t.preventDefault(),!1;!function(t){let e,i=Number(Z.value);do{e=Math.floor(Math.random()*Z.length),R=F[e]}while(!R.solvable||i==e);Z.value=e.toString()}(),I.setPuzzleSet(R),rt(R),dt(t.timeStamp)}),nt.topLeft.addEventListener("input",ct),nt.topRight.addEventListener("input",ct),nt.bottomLeft.addEventListener("input",ct),nt.bottomRight.addEventListener("input",ct),U.addEventListener("change",ct),Z.addEventListener("change",t=>{if(!I.checkBeforeEnd())return t.preventDefault(),!1;R=F[Z.value],I.setPuzzleSet(R),rt(R),ot(),ut()}),ht.none.addEventListener("input",t=>{I.showLabel=!1}),ht.phone.addEventListener("input",t=>{I.showLabel=!0,I.assignLabel(!1)}),ht.keypad.addEventListener("input",t=>{I.showLabel=!0,I.assignLabel(!0)}),R=t[Z.value];let e=U.valueAsNumber,i=D.width/D.getBoundingClientRect().width;I=new P(e,R,G,J,K,Q),I.completeHandlers.push(lt,at),rt(R),C=new L,C.scale=i,C.connect(D,I),O=new n(t=>{C.update(),I.update(t,C),I.render(V),I.timer.render($)}),O.run(),window.game=I})}]);