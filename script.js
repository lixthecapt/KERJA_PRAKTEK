const STORAGE_KEY='netvision_devices_v2', LOG_KEY='netvision_logs_v2';
const defaults=[
{id:'internet',name:'Internet / ISP',type:'Internet',ip:'Public WAN',status:'online',parent:'',lastCheck:'—',fixed:true},
{id:'router',name:'Router Utama',type:'Router',ip:'192.168.1.1',status:'online',parent:'internet',lastCheck:'Baru saja',fixed:true},
{id:'switch',name:'Core Switch',type:'Switch',ip:'192.168.1.2',status:'online',parent:'router',lastCheck:'Baru saja',fixed:true},
{id:'ap1',name:'Access Point Lt. 1',type:'Access Point',ip:'192.168.1.10',status:'online',parent:'switch',lastCheck:'Baru saja'},
{id:'pc1',name:'PC Administrasi',type:'PC',ip:'192.168.1.20',status:'online',parent:'switch',lastCheck:'Baru saja'},
{id:'ap2',name:'Access Point Lt. 2',type:'Access Point',ip:'192.168.1.11',status:'offline',parent:'switch',lastCheck:'Baru saja'},
{id:'pc2',name:'PC Tata Usaha',type:'PC',ip:'192.168.1.21',status:'online',parent:'switch',lastCheck:'Baru saja'}
];
let devices=loadDevices(),logs=loadLogs(),latencies=[21,24,23,27,20,31,24,22,26,23,25,24],editMode=false;
function loadDevices(){try{let x=JSON.parse(localStorage.getItem(STORAGE_KEY));return Array.isArray(x)&&x.length?x:structuredClone(defaults)}catch{return structuredClone(defaults)}}
function loadLogs(){try{return JSON.parse(localStorage.getItem(LOG_KEY))||[]}catch{return []}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(devices));localStorage.setItem(LOG_KEY,JSON.stringify(logs))}
function now(){return new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function stamp(){return new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function icon(type){return ({Internet:'🌐',Router:'📡',Switch:'🔀','Access Point':'📶',Server:'🗄️',PC:'🖥️',Laptop:'💻',Printer:'🖨️'})[type]||'🔌'}
function isUp(d){if(d.status==='offline')return false;if(d.parent){let p=devices.find(x=>x.id===d.parent);if(p&&!isUp(p))return false}return true}
function log(message,kind='ok'){logs.unshift({message,kind,time:stamp()});logs=logs.slice(0,30);persist();renderLogs()}
function render(){
 const total=devices.length,up=devices.filter(d=>isUp(d)).length,down=total-up;
 document.getElementById('totalDevice').textContent=total;document.getElementById('onlineDevice').textContent=up;document.getElementById('offlineDevice').textContent=down;
 document.getElementById('connectionCount').textContent=devices.filter(d=>d.parent).length;
 document.getElementById('onlineRate').textContent=total?Math.round(up/total*100)+'%':'0%';document.getElementById('alertCount').textContent=down;
 renderTopology();renderDevices();renderLogs();renderChart();persist();
}
function renderTopology(){
 const root=document.getElementById('topology'),internet=devices.find(d=>d.id==='internet'),router=devices.find(d=>d.id==='router'),sw=devices.find(d=>d.id==='switch');
 if(!internet){root.innerHTML='<div class="empty">Perangkat Internet tidak ditemukan.</div>';return}
 const node=d=>`<button class="nodebutton" onclick="deviceDetails('${d.id}')" title="Klik untuk detail"><div class="node ${isUp(d)?'':'offline'}"><i class="node-status"></i><span class="ico">${icon(d.type)}</span><strong>${escapeHTML(d.name)}</strong><small>${escapeHTML(d.ip)}</small></div></button>`;
 const conn=(a,b)=>`<div class="connector ${isUp(a)&&isUp(b)?'':'offline'}"></div>`;
 let children=devices.filter(d=>!['internet','router','switch'].includes(d.id)&&d.parent==='switch');
 let other=devices.filter(d=>!['internet','router','switch'].includes(d.id)&&d.parent!=='switch');
 root.innerHTML=node(internet)+(router?conn(internet,router)+node(router):'')+(sw&&router?conn(router,sw)+node(sw):'')+(children.length?`<div class="branch">${children.map(d=>`<div class="branchitem ${isUp(d)?'':'offline'}">${node(d)}</div>`).join('')}</div>`:'')+(other.length?`<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:18px">${other.map(node).join('')}</div>`:'');
}
function renderDevices(){
 const q=document.getElementById('searchInput').value.toLowerCase(),fs=document.getElementById('filterStatus').value,ft=document.getElementById('filterType').value;
 const list=devices.filter(d=>(d.name+' '+d.ip).toLowerCase().includes(q)&&(fs==='all'||(isUp(d)?'online':'offline')===fs)&&(ft==='all'||d.type===ft));
 document.getElementById('deviceCountLabel').textContent=list.length+' perangkat';
 document.getElementById('emptyState').style.display=list.length?'none':'block';
 document.getElementById('deviceTable').innerHTML=list.map(d=>`<tr><td><div class="devname"><span class="devico">${icon(d.type)}</span><div><strong>${escapeHTML(d.name)}</strong><div class="muted">${escapeHTML(d.id)}</div></div></div></td><td>${escapeHTML(d.type)}</td><td>${escapeHTML(d.ip)}</td><td><span class="statuspill ${isUp(d)?'':'down'}">${isUp(d)?'Online':'Offline'}</span></td><td class="muted">${escapeHTML(d.lastCheck||'—')}</td><td><div class="table-actions"><button onclick="editDevice('${d.id}')" title="Edit">Edit</button><button onclick="toggleStatus('${d.id}')" title="Ubah status">↕ Status</button>${d.fixed?'':`<button class="danger" onclick="deleteDevice('${d.id}')" title="Hapus">Hapus</button>`}</div></td></tr>`).join('');
}
function renderLogs(){const el=document.getElementById('activityLog');el.innerHTML=logs.length?logs.slice(0,12).map(l=>`<div class="log"><div class="logicon ${l.kind==='warn'?'warn':''}">${l.kind==='warn'?'⚠':'✓'}</div><div><p>${escapeHTML(l.message)}</p><small>${escapeHTML(l.time)}</small></div></div>`).join(''):'<div class="empty">Belum ada aktivitas.</div>'}
function renderChart(){document.getElementById('latencyChart').innerHTML=latencies.map((v,i)=>`<div class="bar" style="height:${Math.max(12,Math.min(100,v/40*100))}%"><span>${v}</span></div>`).join('')}
function openModal(id=''){editMode=!!id;const d=devices.find(x=>x.id===id);document.getElementById('deviceForm').reset();document.getElementById('deviceId').value=id;document.getElementById('modalTitle').textContent=d?'Edit Perangkat':'Tambah Perangkat';
 document.getElementById('deviceParent').innerHTML='<option value="">Tidak ditentukan</option>'+devices.filter(x=>x.id!==id).map(x=>`<option value="${x.id}">${escapeHTML(x.name)}</option>`).join('');
 if(d){document.getElementById('deviceName').value=d.name;document.getElementById('deviceType').value=d.type;document.getElementById('deviceIP').value=d.ip;document.getElementById('deviceStatus').value=d.status;document.getElementById('deviceParent').value=d.parent||'';document.getElementById('deviceType').disabled=!!d.fixed;document.getElementById('deviceIP').disabled=!!d.fixed;document.getElementById('deviceName').disabled=!!d.fixed;document.getElementById('deviceStatus').disabled=!!d.fixed;document.getElementById('deviceParent').disabled=!!d.fixed}
 else {['deviceType','deviceIP','deviceName','deviceStatus','deviceParent'].forEach(x=>document.getElementById(x).disabled=false)}
 document.getElementById('modalBack').classList.add('show')}
function closeModal(){document.getElementById('modalBack').classList.remove('show')}
function saveDevice(e){e.preventDefault();const id=document.getElementById('deviceId').value,name=document.getElementById('deviceName').value.trim(),type=document.getElementById('deviceType').value,ip=document.getElementById('deviceIP').value.trim(),status=document.getElementById('deviceStatus').value,parent=document.getElementById('deviceParent').value;
 if(devices.some(d=>d.ip.toLowerCase()===ip.toLowerCase()&&d.id!==id)){toast('Alamat IP sudah digunakan.');return}
 if(parent===id){toast('Perangkat tidak bisa terhubung ke dirinya sendiri.');return}
 if(id){let d=devices.find(x=>x.id===id);if(d&&!d.fixed)Object.assign(d,{name,type,ip,status,parent,lastCheck:stamp()});log('Perangkat '+name+' diperbarui.')}
 else{const newId='dev-'+Date.now();devices.push({id:newId,name,type,ip,status,parent,lastCheck:stamp()});log('Perangkat '+name+' ditambahkan.')}
 closeModal();render();toast('Data perangkat berhasil disimpan.')}
function addDevice(){openModal()}
function editDevice(id){openModal(id)}
function deviceDetails(id){const d=devices.find(x=>x.id===id);if(!d)return;const parent=devices.find(x=>x.id===d.parent);const choice=confirm(`${d.name}\nTipe: ${d.type}\nIP: ${d.ip}\nStatus efektif: ${isUp(d)?'ONLINE':'OFFLINE'}\nTerhubung ke: ${parent?parent.name:'Tidak ditentukan'}\n\nOK = edit perangkat, Cancel = ubah status`);if(choice)editDevice(id);else toggleStatus(id)}
function toggleStatus(id){const d=devices.find(x=>x.id===id);if(!d)return;if(d.fixed){toast('Perangkat inti tidak dapat diubah melalui tombol status.');return}d.status=d.status==='online'?'offline':'online';d.lastCheck=stamp();log(`${d.name} ditandai ${d.status.toUpperCase()}.`,d.status==='offline'?'warn':'ok');render();toast('Status perangkat diperbarui.')}
function deleteDevice(id){const d=devices.find(x=>x.id===id);if(!d||d.fixed)return;if(!confirm(`Hapus perangkat "${d.name}"?`))return;devices=devices.filter(x=>x.id!==id);devices.forEach(x=>{if(x.parent===id)x.parent=''});log('Perangkat '+d.name+' dihapus.','warn');render();toast('Perangkat dihapus.')}
function checkAll(){devices.forEach(d=>d.lastCheck=stamp());const down=devices.filter(d=>!isUp(d)).length;latencies.push(18+Math.floor(Math.random()*24));latencies=latencies.slice(-12);log(`Pemeriksaan status selesai: ${devices.length-down} online, ${down} offline.`,down?'warn':'ok');render();toast('Pemeriksaan simulasi selesai.')}
function checkInternet(){const online=devices.find(d=>d.id==='internet')?.status!=='offline'&&devices.find(d=>d.id==='router')?.status!=='offline';const latency=online?18+Math.floor(Math.random()*35):'—';document.getElementById('internetBox').classList.toggle('down',!online);document.getElementById('internetStatus').textContent=online?'ONLINE':'OFFLINE';document.getElementById('internetText').textContent=online?'Koneksi simulasi terpantau aktif.':'Koneksi simulasi mengalami gangguan.';document.getElementById('internetBadge').textContent=online?'AKTIF':'GANGGUAN';document.getElementById('latency').textContent=online?latency+' ms':'—';document.getElementById('pingResult').textContent=online?`Tes simulasi berhasil • Latensi ${latency} ms • ${now()}`:`Tes simulasi gagal • ${now()}`;if(online){latencies.push(Number(latency));latencies=latencies.slice(-12)}log('Tes koneksi internet '+(online?'berhasil':'gagal')+'.',online?'ok':'warn');renderChart();renderLogs()}
function resetTopology(){if(!confirm('Reset semua data ke topologi awal? Data perangkat dan riwayat aktivitas akan diatur ulang.'))return;devices=structuredClone(defaults);logs=[];latencies=[21,24,23,27,20,31,24,22,26,23,25,24];persist();render();toast('Topologi berhasil direset.')}
function exportCSV(){const rows=[['Nama','Tipe','IP Address','Status konfigurasi','Status efektif','Terhubung ke','Pemeriksaan terakhir'],...devices.map(d=>[d.name,d.type,d.ip,d.status,isUp(d)?'online':'offline',(devices.find(p=>p.id===d.parent)||{}).name||'',d.lastCheck||''])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='inventaris-jaringan.csv';a.click();URL.revokeObjectURL(url);toast('File CSV berhasil dibuat.')}
function clearLogs(){logs=[];persist();renderLogs();toast('Riwayat aktivitas dibersihkan.')}
function toast(s){const t=document.getElementById('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function updateClock(){const d=new Date();document.getElementById('clock').textContent=d.toLocaleTimeString('id-ID');document.getElementById('date').textContent=d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
updateClock();setInterval(updateClock,1000);if(!logs.length)logs=[{message:'Dashboard NetVision siap digunakan.',kind:'ok',time:stamp()},{message:'Data topologi awal dimuat dari browser.',kind:'ok',time:stamp()}];render();
