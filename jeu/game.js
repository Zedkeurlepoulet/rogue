(() => {
  const app=document.getElementById('app'), screen=document.getElementById('screen'), canvas=document.getElementById('game'), ctx=canvas.getContext('2d'), hud=document.getElementById('hud'), toast=document.getElementById('toast');
  const assets={main:'asset/main_menu.png',chars:'asset/menu_personnage.png',shop:'asset/entre_vagues.png',map:'asset/map.png',zap:'personnage/zap/zap idle animation.jpg',slime:'personnage/trash mob/slime.png',gold:'gold/piece_or_sprite.png',shock:'personnage/zap/competence 1/onde_choc_electrique_spritesheet.png'};
  const defs=[['damage','Dégâts physiques','stats sprite/damage.png'],['Magiquedamage','Dégâts magiques','stats sprite/Magiquedamage.png'],['as','Vitesse d’attaque','stats sprite/as.png'],['crit','Chance de critique','stats sprite/crit.png'],['omnivampirisme','Omnivampirisme','stats sprite/omnivampirisme.png'],['PV','Points de vie','stats sprite/PV.png'],['resistance','Résistance','stats sprite/resistance.png'],['vitesse_deplacement','Vitesse de déplacement','stats sprite/vitesse_deplacement.png']];
  const icons={},imgs={}; for(const d of defs){icons[d[0]]=d[2];imgs[d[0]]=new Image();imgs[d[0]].src=d[2];}
  for(const k in assets){imgs[k]=new Image();imgs[k].src=assets[k];}
  const shardFiles={damage:{classic:'shard/damage/shard_dmg_classic_1.png',gold:'shard/damage/shard_dmg_or_3.png',chromatic:'shard/damage/shard_dmg_chromatique_10.png'},Magiquedamage:{classic:'shard/magique damage/shard_magie_classic_1.png',gold:'shard/magique damage/shard_magie_or_3.png',chromatic:'shard/magique damage/shard_magie_chromatique_10.png'},as:{classic:'shard/vitesse d\'attaque/shard_as_classic_2.png',gold:'shard/vitesse d\'attaque/shard_as_or_5.png',chromatic:'shard/vitesse d\'attaque/shard_as_chromatique_10.png'},crit:{chromatic:'shard/critique/shard_crit_chromatique_10.png'},omnivampirisme:{chromatic:'shard/omnivampirisme/shard_omnivampirisme_chromatique_5.png'},PV:{classic:'shard/PV/shard_pv_classic.png',gold:'shard/PV/shard_pv_or_10.png',chromatic:'shard/PV/shard_pv_chromatique_20.png'},resistance:{classic:'shard/resistance/shard_resistance_classic_1.png',gold:'shard/resistance/shard_resistance_or_2.png',chromatic:'shard/resistance/shard_resistance_chromatique_3.png'},vitesse_deplacement:{classic:'shard/vitesse de deplacement/shard_vitesse_classic_1.png',gold:'shard/vitesse de deplacement/shard_vitesse_or_2.png',chromatic:'shard/vitesse de deplacement/shard_vitesse_chromatique_5.png'}};
  const players=Array.from({length:4},(_,i)=>({id:i+1,x:0,y:0,hp:100,maxHp:100,gold:4,ready:false,statTab:false,stats:{damage:20,Magiquedamage:20,as:0,crit:0,omnivampirisme:0,PV:100,resistance:0,vitesse_deplacement:190},offers:[],touchTimer:0,spellTimer:0,spellCooldown:0,ultTimer:0,ultCooldown:0,invulnerable:0,keys:new Set(),prev:[],selected:0}));
  let mode='main',wave=1,enemies=[],effects=[],last=0,clock=0,toasting=0,gameComplete=false,renderScale=1,hudPlayers=[],waveLabel=null,activeCount=1,controllerIndices=[0];
  const activePlayers=()=>players.slice(0,activeCount);
  function syncPlayerCount(){const pads=navigator.getGamepads?navigator.getGamepads():[];controllerIndices=Array.from(pads).map((g,i)=>g&&g.connected?i:-1).filter(i=>i>=0);activeCount=Math.max(1,Math.min(players.length,controllerIndices.length));if(!controllerIndices.length)controllerIndices=[0];players.forEach((p,i)=>{if(i>=activeCount){p.ready=false;p.statTab=false;}});}
  const rarity={classic:{price:4,factor:1},gold:{price:8,factor:1.6},chromatic:{price:13,factor:2.5}};
  function toastMsg(s){toast.textContent=s;toast.style.display='block';toasting=2;}
  function button(id,text,cls,x,y,w,h,fn){const b=document.createElement('button');b.id=id;b.className=cls;b.textContent=text;b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';b.onclick=fn;screen.appendChild(b);return b;}
  function setMode(m){if(m==='game'||m==='interwave'||m==='characters')syncPlayerCount();mode=m;screen.replaceChildren();hud.replaceChildren();hudPlayers=[];waveLabel=null;canvas.style.display=m==='game'||m==='gameover'?'block':'none';screen.style.backgroundImage=m==='main'?'url("'+assets.main+'")':m==='characters'?'url("'+assets.chars+'")':m==='interwave'?'url("'+assets.shop+'")':'none';if(m==='main')mainMenu();if(m==='characters')characterMenu();if(m==='game')beginWave();if(m==='interwave')interwave();}
  function mainMenu(){button('playButton','JOUER','pixel-button menu-button',33.85,37.2,32.3,10.4,()=>setMode('characters'));button('charactersButton','PERSONNAGE','pixel-button menu-button',33.85,52.6,32.3,10.4,()=>setMode('characters'));}
  function characterMenu(){
    const copy='<h2>Zap</h2><p><b>Passif</b> - Contact : <span class="stat-inline"><img src="'+icons.damage+'">100% AD</span> + <span class="stat-inline"><img src="'+icons.Magiquedamage+'">100% AP</span> / cible. Sous R : x2.</p><p><b>Stats de base</b> - <span class="stat-inline"><img src="'+icons.damage+'">20 AD</span> / <span class="stat-inline"><img src="'+icons.Magiquedamage+'">20 AP</span> / <span class="stat-inline"><img src="'+icons.as+'">AS bonus -> <img src="'+icons.vitesse_deplacement+'">+5 MS / AS</span>.</p><p><b>A - Onde electrique</b> - <span class="stat-inline"><img src="'+icons.Magiquedamage+'">80% AP</span> en zone | CD 2.5 s.</p><p><b>R</b> - <span class="stat-inline"><img src="'+icons.vitesse_deplacement+'">+80% MS</span> | invulnerable 3.5 s | passif x2.</p>';
    const positions=['left:1.1%;top:2%','left:72.9%;top:2%','left:1.1%;top:53%','left:72.9%;top:53%'];
    activePlayers().forEach((p,i)=>{const box=document.createElement('aside');box.className='details';box.dataset.player=String(i+1);box.style.cssText=positions[i]+';width:25.5%;max-height:44%';box.innerHTML='<h2>'+copy.slice(4);screen.appendChild(box);});
    for(let i=0;i<24;i++){const c=document.createElement('button');c.className='card character-card'+(i===0?' selected':'');c.style.cssText='left:'+(28.1+(i%6)*7.55)+'%;top:'+(10.8+Math.floor(i/6)*13.45)+'%';if(i===0){c.innerHTML='<span class="zap-sprite" role="img" aria-label="Zap"></span><span class="name">ZAP</span>';c.onclick=()=>{wave=1;gameComplete=false;setMode('game');};}else{c.innerHTML='<span class="question">?</span>';c.disabled=true;}screen.appendChild(c);}
    button('returnButton','RETOUR','pixel-button return-button',40.2,80.8,19.6,8.1,()=>setMode('main'));const hint=document.createElement('div');hint.className='hint';hint.textContent='A / ENTREE : Zap | ESC : retour';screen.appendChild(hint);
  }
  function shard(){const r=Math.random(),rar=r<.03?'chromatic':r<.13?'gold':'classic',keys=Object.keys(shardFiles).filter(k=>shardFiles[k][rar]),key=keys[Math.floor(Math.random()*keys.length)],amount={damage:{classic:1,gold:3,chromatic:10},Magiquedamage:{classic:1,gold:3,chromatic:10},as:{classic:2,gold:5,chromatic:10},crit:{chromatic:10},omnivampirisme:{chromatic:5},PV:{classic:5,gold:10,chromatic:20},resistance:{classic:1,gold:2,chromatic:3},vitesse_deplacement:{classic:1,gold:2,chromatic:5}}[key][rar];return{rarity:rar,key:key,amount:amount,price:rarity[rar].price,art:shardFiles[key][rar]};}
  function apply(p,s){if(s.key==='PV'){p.maxHp+=s.amount;p.hp=Math.min(p.maxHp,p.hp+s.amount);}else if(s.key==='as'){p.stats.as+=s.amount;p.stats.vitesse_deplacement+=s.amount*5;}else p.stats[s.key]+=s.amount;}
  function buy(p,i){const s=p.offers[i];if(!s)return;if(p.gold<s.price)return toastMsg('Or insuffisant');p.gold-=s.price;apply(p,s);p.offers[i]=shard();toastMsg('Shard achete');interwave();}
  function toggle(p){if(gameComplete)return;p.ready=!p.ready;interwave();if(activePlayers().every(q=>q.ready)){activePlayers().forEach(q=>{q.ready=false;q.statTab=false;});wave++;setMode('game');}}

  function interwave(){
    screen.replaceChildren();screen.style.backgroundImage='url("'+assets.shop+'")';
    activePlayers().forEach((p,i)=>{const x=[1.1,25.9,50.7,75.5][i],w=23.1;
      const head=document.createElement('div');head.className='shop-player';head.style.cssText='left:'+x+'%;top:2%;width:'+w+'%;height:24%';
      head.innerHTML='<div class="shop-player-content"><span class="zap-avatar" role="img" aria-label="Zap"></span><span class="shop-gold"><img src="'+assets.gold+'" alt="Or"><b>'+p.gold+'</b></span></div>';screen.appendChild(head);
      const shop=document.createElement('div');shop.className='shop-panel';shop.style.cssText='left:'+x+'%;top:59.5%;width:'+w+'%;height:38.3%';p.offers.forEach((s,j)=>{const c=document.createElement('button');c.className='shop-card rarity-'+s.rarity+(p.selected===j?' selected':'');c.setAttribute('aria-label',s.rarity+', '+s.amount+' '+defs.find(d=>d[0]===s.key)[1]+', prix '+s.price);c.innerHTML='<img class="shard-art" src="'+s.art+'" alt="Shard"><span class="buy-cost"><img src="'+assets.gold+'" alt="Or"><b>'+s.price+'</b></span>';c.onclick=()=>buy(p,j);shop.appendChild(c);});screen.appendChild(shop);
      const ready=document.createElement('button');ready.className='ready-button'+(p.ready?' ready':'');ready.setAttribute('aria-label',p.ready?'PRET':'Prochaine vague');ready.style.cssText='left:'+x+'%;top:97.5%;width:'+w+'%;height:2%';ready.textContent=gameComplete?'TERMINE':p.ready?'PRET !':'PRET';ready.disabled=gameComplete;ready.onclick=()=>toggle(p);screen.appendChild(ready);
    });if(activePlayers().some(p=>p.statTab))stats();
  }
  function stats(){
    const xs=[1.1,25.9,50.7,75.5];
    activePlayers().filter(p=>p.statTab).forEach(p=>{
      const pane=document.createElement('aside');pane.className='stats-pane';
      pane.style.cssText='left:'+xs[p.id-1]+'%;top:2%;width:23.1%;height:53.5%';
      const labels={damage:'AD',Magiquedamage:'AP',as:'AS',crit:'Crit',omnivampirisme:'Omni',PV:'PV',resistance:'Res',vitesse_deplacement:'MS'};
      const rows=defs.map(d=>{
        const percent=['crit','omnivampirisme','resistance','as'].includes(d[0]);
        const value=Math.round(p.stats[d[0]]*10)/10;
        return '<div class="stats-row"><img src="'+icons[d[0]]+'"><span>'+labels[d[0]]+' '+value+(percent?' %':'')+'</span></div>';
      }).join('');
      pane.innerHTML='<div class="stats-player"><h3>Zap - Stats</h3>'+rows+'<div class="stats-extra">PV '+Math.ceil(p.hp)+' / '+p.maxHp+'<br>Or '+p.gold+'</div><small>RB - Fermer</small></div>';
      screen.appendChild(pane);
    });
  }
  function resize(){const r=app.getBoundingClientRect();renderScale=Math.min(window.devicePixelRatio||1,1.25);canvas.width=Math.round(r.width*renderScale);canvas.height=Math.round(r.height*renderScale);ctx.setTransform(renderScale,0,0,renderScale,0,0);}window.addEventListener('resize',resize);resize();
  function beginWave(){const w=canvas.width/renderScale,h=canvas.height/renderScale;activePlayers().forEach((p,i)=>{p.x=w*(.35+(i%2)*.3);p.y=h*(.38+Math.floor(i/2)*.23);});enemies=[];effects=[];for(let i=0;i<10+(wave-1)*3;i++){const a=Math.random()*6.28,r=Math.min(w,h)*(.48+Math.random()*.13);enemies.push({x:w/2+Math.cos(a)*r,y:h/2+Math.sin(a)*r,hp:50,maxHp:50,speed:38+Math.min(24,wave*2),attack:8+wave*.6,touch:0,radius:14,frame:Math.random()*10});}renderHud();}
  function renderHud(){
    hud.replaceChildren();hudPlayers=activePlayers().map((p,i)=>{const e=document.createElement('div');e.className='game-hud '+(i%2?'right':'left');e.style.top=i<2?'1.5%':'88%';e.innerHTML='<b>ZAP</b><div class="health-track"><div class="health-fill"></div></div><div class="gold-line"><img src="'+assets.gold+'"><span class="gold-value"></span></div><div class="spell-cooldown"><b>A</b><span class="spell-state">PRET</span><span class="cooldown-track"><i></i></span></div>';hud.appendChild(e);return{root:e,fill:e.querySelector('.health-fill'),gold:e.querySelector('.gold-value'),spellState:e.querySelector('.spell-state'),cooldown:e.querySelector('.cooldown-track i')};});waveLabel=document.createElement('div');waveLabel.className='wave-banner';hud.appendChild(waveLabel);updateHud();}
  function updateHud(){hudPlayers.forEach((node,i)=>{const p=activePlayers()[i];node.fill.style.width=Math.max(0,p.hp/p.maxHp*100)+'%';node.gold.textContent=p.gold;const left=Math.max(0,p.spellCooldown);node.spellState.textContent=left>0?left.toFixed(1)+' s':'PRET';node.cooldown.style.width=(1-left/2.5)*100+'%';});if(waveLabel)waveLabel.textContent='VAGUE '+wave+' | '+enemies.length+' SLIMES';}
  function draw(){const w=canvas.width/renderScale,h=canvas.height/renderScale;ctx.clearRect(0,0,w,h);if(imgs.map.complete&&imgs.map.naturalWidth)ctx.drawImage(imgs.map,0,0,w,h);else{ctx.fillStyle='#777';ctx.fillRect(0,0,w,h);}
    for(const e of enemies){if(imgs.slime.complete){const f=Math.floor(clock*8+e.frame)%2;ctx.drawImage(imgs.slime,f*160,0,160,160,e.x-16,e.y-16,32,32);}}
    for(const p of activePlayers())if(p.hp>0){if(p.invulnerable>0){ctx.beginPath();ctx.arc(p.x,p.y,34,0,7);ctx.strokeStyle='#62dcff';ctx.lineWidth=3;ctx.stroke();}if(imgs.zap.complete&&imgs.zap.naturalWidth){const fw=imgs.zap.naturalWidth/3;ctx.save();ctx.globalCompositeOperation='screen';ctx.drawImage(imgs.zap,0,0,fw,imgs.zap.naturalHeight,p.x-20,p.y-29,40,58);ctx.restore();}if(p.spellTimer>0&&imgs.shock.complete&&imgs.shock.naturalWidth){const f=Math.min(2,Math.floor((.34-p.spellTimer)/.12));ctx.globalAlpha=Math.min(1,p.spellTimer*3);ctx.drawImage(imgs.shock,f*64,0,64,64,p.x-100,p.y-100,200,200);ctx.globalAlpha=1;}}
    for(const e of effects){ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.strokeStyle='rgba(95,220,255,'+(e.life/.34)+')';ctx.lineWidth=5;ctx.stroke();}if(mode==='gameover'){ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 32px Arial';ctx.fillText('FIN DE PARTIE',w/2,h/2-12);ctx.font='bold 18px Arial';ctx.fillText('ENTRÉE POUR RECOMMENCER',w/2,h/2+24);}}
  function passiveContact(p,dt){if(p.hp<=0)return;p.touchTimer-=dt;for(const e of enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<e.radius+14&&p.touchTimer<=0){let d=p.stats.damage+p.stats.Magiquedamage;if(p.ultTimer>0)d*=2;e.hp-=d;e.lastHit=p.id;p.hp=Math.min(p.maxHp,p.hp+d*p.stats.omnivampirisme/100);p.touchTimer=.55;break;}}
  function spell(p){if(mode!=='game'||p.hp<=0||p.spellCooldown>0)return;p.spellTimer=.34;p.spellCooldown=2.5;effects.push({x:p.x,y:p.y,r:130,life:.34});for(const e of enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<130){const d=p.stats.Magiquedamage*.8;e.hp-=d;e.lastHit=p.id;p.hp=Math.min(p.maxHp,p.hp+d*p.stats.omnivampirisme/100);}}
  function ult(p){if(mode!=='game'||p.hp<=0||p.ultCooldown>0)return;p.ultTimer=3.5;p.invulnerable=3.5;p.ultCooldown=18;toastMsg('ULTIME');}
  function update(dt){
    const w=canvas.width/renderScale,h=canvas.height/renderScale,pads=navigator.getGamepads?navigator.getGamepads():[];
    activePlayers().forEach((p,i)=>{
      p.spellTimer=Math.max(0,p.spellTimer-dt);p.spellCooldown=Math.max(0,p.spellCooldown-dt);p.ultCooldown=Math.max(0,p.ultCooldown-dt);p.ultTimer=Math.max(0,p.ultTimer-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);
      let x=0,y=0;
      if(i===0){x+=(p.keys.has('d')?1:0)-(p.keys.has('a')?1:0);y+=(p.keys.has('s')?1:0)-(p.keys.has('w')?1:0);}
      if(i===1){x+=(p.keys.has('ArrowRight')?1:0)-(p.keys.has('ArrowLeft')?1:0);y+=(p.keys.has('ArrowDown')?1:0)-(p.keys.has('ArrowUp')?1:0);}
      if(i===2){x+=(p.keys.has('h')?1:0)-(p.keys.has('f')?1:0);y+=(p.keys.has('g')?1:0)-(p.keys.has('t')?1:0);}
      if(i===3){x+=(p.keys.has('l')?1:0)-(p.keys.has('j')?1:0);y+=(p.keys.has('k')?1:0)-(p.keys.has('i')?1:0);}
      const g=pads[controllerIndices[i]];if(g){if(Math.abs(g.axes[0])>.18)x+=g.axes[0];if(Math.abs(g.axes[1])>.18)y+=g.axes[1];}
      const len=Math.hypot(x,y);if(len){const speed=p.stats.vitesse_deplacement*(p.ultTimer>0?1.8:1);p.x+=x/len*speed*dt;p.y+=y/len*speed*dt;}
      p.x=Math.max(24,Math.min(w-24,p.x));p.y=Math.max(24,Math.min(h-24,p.y));passiveContact(p,dt);
    });
    for(const e of enemies){
      let target=null,dist=Infinity;
      for(const p of activePlayers())if(p.hp>0){const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<dist){dist=d;target=p;}}
      if(!target)continue;
      const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy)||1,hitDistance=e.radius+14;
      if(d>hitDistance){e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;}
      else{e.touch-=dt;if(e.touch<=0&&target.invulnerable<=0){target.hp=Math.max(0,target.hp-e.attack*(1-target.stats.resistance/100));e.touch=.85;}}
    }
    for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){
      const a=enemies[i],b=enemies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.radius+b.radius;
      if(d<min){const push=(min-d)*.5,angle=d<.01?((i*17+j*31)%360)*Math.PI/180:0,nx=d<.01?Math.cos(angle):dx/d,ny=d<.01?Math.sin(angle):dy/d;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;}
    }
    enemies=enemies.filter(e=>{if(e.hp<=0){players[(e.lastHit||1)-1].gold+=1;return false;}return true;});
    effects=effects.filter(e=>(e.life-=dt)>0);updateHud();if(!enemies.length)finish();if(activePlayers().every(p=>p.hp<=0)){mode='gameover';toastMsg('FIN DE PARTIE - ENTREE POUR RECOMMENCER');}
  }
  function finish(){activePlayers().forEach(p=>{p.gold+=1;p.hp=Math.min(p.maxHp,p.hp+10);p.ready=false;p.statTab=false;p.offers=Array.from({length:4},shard);});gameComplete=wave>=10;setMode('interwave');}
  function doMenu(p){if(mode==='characters'){wave=1;setMode('game');}else if(mode==='interwave')toggle(p);else if(mode==='game')spell(p);}
  const actions={q:[0,'spell'],e:[0,'ult'],Enter:[0,'menu'],x:[0,'buy'],'0':[1,'spell'],'9':[1,'ult'],Shift:[1,'menu'],p:[1,'buy'],r:[2,'spell'],y:[2,'ult'],v:[2,'menu'],b:[2,'buy'],u:[3,'spell'],o:[3,'ult'],m:[3,'menu'],',':[3,'buy']};
  window.addEventListener('keydown',ev=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(ev.key))ev.preventDefault();if(ev.repeat)return;const k=ev.key.length===1?ev.key.toLowerCase():ev.key;players.forEach(p=>p.keys.add(k));if(k==='Escape'&&mode==='characters'){setMode('main');return;}if(mode==='main'&&(k==='Enter'||k===' ')){setMode('characters');return;}if(mode==='interwave'){if(k==='w')players[0].selected=(players[0].selected+3)%4;if(k==='s')players[0].selected=(players[0].selected+1)%4;if(k==='ArrowUp')players[1].selected=(players[1].selected+3)%4;if(k==='ArrowDown')players[1].selected=(players[1].selected+1)%4;if(k==='t')players[2].selected=(players[2].selected+3)%4;if(k==='g')players[2].selected=(players[2].selected+1)%4;if(k==='i')players[3].selected=(players[3].selected+3)%4;if(k==='k')players[3].selected=(players[3].selected+1)%4;interwave();}const a=actions[k];if(a&&a[0]<activeCount){if(a[1]==='spell')spell(players[a[0]]);if(a[1]==='ult')ult(players[a[0]]);if(a[1]==='menu')doMenu(players[a[0]]);if(a[1]==='buy'&&mode==='interwave')buy(players[a[0]],players[a[0]].selected);}if(mode==='characters'&&(k==='Enter'||k===' ')){wave=1;gameComplete=false;setMode('game');}if(mode==='gameover'&&k==='Enter'){players.forEach(p=>{p.hp=p.maxHp;p.gold=4;});wave=1;gameComplete=false;setMode('main');}});
  window.addEventListener('keyup',ev=>{const k=ev.key.length===1?ev.key.toLowerCase():ev.key;players.forEach(p=>p.keys.delete(k));});
  function poll(){const pads=navigator.getGamepads?navigator.getGamepads():[];activePlayers().forEach((p,i)=>{const g=pads[controllerIndices[i]];if(!g)return;const now=g.buttons.map(b=>b.pressed),just=n=>now[n]&&!p.prev[n];if(mode==='main'&&just(0))setMode('characters');else if(mode==='characters'&&just(0)){wave=1;gameComplete=false;setMode('game');}else if(mode==='characters'&&just(1))setMode('main');else if(mode==='interwave'){let moved=false;if(just(5)){p.statTab=!p.statTab;interwave();}if(just(0))buy(p,p.selected);if(just(12)){p.selected=(p.selected+3)%4;moved=true;}if(just(13)){p.selected=(p.selected+1)%4;moved=true;}if(moved)interwave();}else if(mode==='game'){if(just(0))spell(p);if(just(3))ult(p);}if(mode==='interwave'&&just(9))toggle(p);p.prev=now;});}
  function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;clock+=dt;poll();if(toasting>0&&((toasting-=dt)<=0))toast.style.display='none';if(mode==='game'){update(dt);draw();}else if(mode==='gameover')draw();requestAnimationFrame(frame);}
  setMode('main');requestAnimationFrame(frame);
})();
