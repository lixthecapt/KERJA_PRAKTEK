const defaultDevices = [
  {id:"internet", name:"Internet", type:"🌐", ip:"Public", status:"online", x:42, y:35},
  {id:"router", name:"Router", type:"📡", ip:"192.168.1.1", status:"online", x:42, y:150},
  {id:"switch1", name:"Switch Utama", type:"🔀", ip:"192.168.1.2", status:"online", x:42, y:270},
  {id:"ap1", name:"Access Point 1", type:"📶", ip:"192.168.1.10", status:"online", x:12, y:410},
  {id:"ap2", name:"Access Point 2", type:"📶", ip:"192.168.1.11", status:"online", x:42, y:410},
  {id:"pc", name:"Lab Komputer", type:"🖥️", ip:"192.168.1.20", status:"online", x:72, y:410}
];

let devices = JSON.parse(localStorage.getItem("topologyDevices")) || defaultDevices;

function save(){localStorage.setItem("topologyDevices",JSON.stringify(devices))}
function render(){
  const area=document.getElementById("topology");
  area.innerHTML="";
  const byId=Object.fromEntries(devices.map(d=>[d.id,d]));
  const links=[
    ["internet","router"],["router","switch1"],
    ["switch1","ap1"],["switch1","ap2"],["switch1","pc"]
  ];

  links.forEach(([a,b])=>{
    if(!byId[a]||!byId[b]) return;
    const A=byId[a],B=byId[b];
    const line=document.createElement("div"); line.className="connection";
    const x1=A.x+7.5,y1=A.y+5.5,x2=B.x+7.5,y2=B.y+5.5;
    const dx=(x2-x1)*area.clientWidth/100,dy=(y2-y1)*area.clientHeight/100;
    const len=Math.sqrt(dx*dx+dy*dy), angle=Math.atan2(dy,dx)*180/Math.PI;
    line.style.left=x1+"%"; line.style.top=y1+"%"; line.style.width=len+"px";
    line.style.transform=`rotate(${angle}deg)`;
    area.appendChild(line);
  });

  devices.forEach(d=>{
    const node=document.createElement("div"); node.className="node "+d.status;
    node.style.left=d.x+"%"; node.style.top=d.y+"%";
    node.innerHTML=`<div class="icon">${d.type}</div><strong>${d.name}</strong><small>${d.ip}</small>`;
    if(d.id!=="internet"){
      const btn=document.createElement("button");
      btn.textContent=d.status==="online"?"Set Offline":"Set Online";
      btn.onclick=()=>toggleDevice(d.id); node.appendChild(btn);
    }
    area.appendChild(node);
  });

  const list=document.getElementById("deviceList");
  list.innerHTML=devices.map(d=>`
    <div class="device-row">
      <span>${d.type} ${d.name}<br><small>${d.ip}</small></span>
      <span class="status ${d.status==="online"?"on":"off"}">${d.status==="online"?"ONLINE":"OFFLINE"}</span>
    </div>`).join("");

  document.getElementById("totalDevice").textContent=devices.length;
  document.getElementById("onlineDevice").textContent=devices.filter(d=>d.status==="online").length;
  document.getElementById("offlineDevice").textContent=devices.filter(d=>d.status==="offline").length;
  document.getElementById("connectionCount").textContent=links.filter(l=>byId[l[0]]&&byId[l[1]]).length;
}
function toggleDevice(id){
  const d=devices.find(x=>x.id===id); if(!d)return;
  d.status=d.status==="online"?"offline":"online"; save(); render();
}
function addDevice(){
  const name=prompt("Nama perangkat:","PC Baru"); if(!name)return;
  const ip=prompt("IP Address:","192.168.1.30")||"-";
  devices.push({id:"d"+Date.now(),name,type:"💻",ip,status:"online",x:70,y:180});
  save(); render();
}
function resetTopology(){
  if(confirm("Kembalikan topologi ke data awal?")){
    devices=JSON.parse(JSON.stringify(defaultDevices)); save(); render();
  }
}
function checkInternet(){
  const result=document.getElementById("pingResult");
  result.textContent="Melakukan pemeriksaan koneksi...";
  setTimeout(()=>{
    result.textContent="✓ Simulasi ping berhasil. Koneksi internet terdeteksi aktif.";
  },700);
}
function clock(){
  document.getElementById("clock").textContent=new Date().toLocaleString("id-ID",{dateStyle:"full",timeStyle:"medium"});
}
render(); clock(); setInterval(clock,1000);
window.addEventListener("resize",render);
