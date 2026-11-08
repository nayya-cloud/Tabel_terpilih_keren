const $ = id => document.getElementById(id);
const KEY = 'oracasinoJackpotData';
const stamp = () => new Date().toISOString();
const seed = [
 {id:'m1',phone:'0852-1947-8283',type:'Jackpot Utama',amount:0,status:'MENUNGGU REGISTRASI',claim:1888223,created:'2026-11-04T14:20:10',updated:'2026-11-04T14:20:10'},
 {id:'m2',phone:'0813-0572-4681',type:'Jackpot Utama',amount:50000,status:'BERHASIL',claim:2347750,created:'2026-11-04T13:43:53',updated:'2026-11-04T13:43:53'},
 {id:'m3',phone:'0838-6251-7943',type:'Jackpot Utama',amount:50000,status:'BERHASIL',claim:1672480,created:'2026-11-04T13:30:22',updated:'2026-11-04T13:30:22'},
 {id:'m4',phone:'0857-3169-4820',type:'Jackpot Utama',amount:100000,status:'BERHASIL',claim:2193775,created:'2026-11-04T12:50:15',updated:'2026-11-04T12:50:15'},
 {id:'m5',phone:'0821-8473-1965',type:'Jackpot Utama',amount:50000,status:'BERHASIL',claim:2781990,created:'2026-11-04T12:30:40',updated:'2026-11-04T12:30:40'}
];
let members = JSON.parse(localStorage.getItem(KEY) || 'null') || seed;
members = members.map(m => {
 const oldStatus = String(m.status || 'MENUNGGU REGISTRASI').toUpperCase();
 const status = oldStatus === 'BERHASIL' ? 'BERHASIL' :
   (oldStatus === 'DITOLAK' || oldStatus === 'GAGAL KLAIM') ? 'GAGAL KLAIM' : 'MENUNGGU REGISTRASI';
 return {...m, status, claim:Number(m.claim ?? m.claimAmount ?? 0), amount:Number(m.amount || 0)};
});
let page = 1, pageSize = 5, editing = null;
const statusOptions = ['MENUNGGU REGISTRASI','BERHASIL','GAGAL KLAIM'];

function persist(){ localStorage.setItem(KEY, JSON.stringify(members)); renderAll(); }
function rupiah(n, decimals=false){
 return 'Rp ' + Number(n||0).toLocaleString('id-ID',{minimumFractionDigits:decimals?2:0,maximumFractionDigits:decimals?2:0});
}
function parseAmount(v){ return Math.max(0, Number(String(v).replace(/[^\d]/g,'')) || 0); }
function statusClass(s){ return s==='BERHASIL'?'s-success':s==='GAGAL KLAIM'?'s-failed':'s-wait'; }
function safe(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(msg){ $('toast').textContent=msg; $('toast').classList.add('show'); setTimeout(()=>$('toast').classList.remove('show'),2400); }
function editCell(m,field){
 if(editing && editing.id===m.id && editing.field===field){
  const val=field==='amount'?m.amount:field==='claim'?m.claim:m.phone;
  return `<div class="inline-edit"><input id="inlineValue" type="text" value="${safe(val)}" aria-label="Edit ${field}"><button class="inline-save" data-save="${m.id}" data-field="${field}" type="button">✓</button><button class="inline-cancel" data-cancel type="button">×</button></div>`;
 }
 const value=field==='amount'?rupiah(m.amount):field==='claim'?rupiah(m.claim,true):safe(m.phone);
 return `<span class="click-edit" data-inline="${field}" data-id="${m.id}" title="Klik untuk mengubah">${value}</span>`;
}
function actions(m){
 return `<button class="action-btn detail-btn" data-edit="${m.id}" type="button"><i class="fa-solid fa-eye"></i> Detail</button><button class="action-btn delete-btn" data-delete="${m.id}" type="button"><i class="fa-solid fa-trash"></i> Hapus</button>`;
}
function row(m,i){
 const status=`<select class="status status-select ${statusClass(m.status)}" data-status="${m.id}" aria-label="Ubah status klaim">${statusOptions.map(s=>`<option value="${s}" ${m.status===s?'selected':''}>${s}</option>`).join('')}</select>`;
 const pendingArrow=m.status==='MENUNGGU REGISTRASI'?'<img class="attention-arrow" src="arrow-belum-registrasi.png" alt="Panah penunjuk nomor belum registrasi" title="Nomor ini belum registrasi">':'';
 return `<tr><td>${i+1}</td><td class="phone-pending-cell">${editCell(m,'phone')}${pendingArrow}</td><td>${safe(m.type)}</td><td>${editCell(m,'amount')}</td><td>${status}</td><td>${editCell(m,'claim')}</td><td>${actions(m)}</td></tr>`;
}
function filtered(){
 const q=$('searchInput').value.toLowerCase().replace(/[\s-]/g,''), t=$('filterType').value, s=$('filterStatus').value;
 return [...members].sort((a,b)=>new Date(b.created)-new Date(a.created))
  .filter(m=>m.phone.toLowerCase().replace(/[\s-]/g,'').includes(q)&&(!t||m.type===t)&&(!s||m.status===s));
}
function renderTable(){
 const data=filtered(), pages=Math.max(1,Math.ceil(data.length/pageSize)); page=Math.min(page,pages);
 const shown=data.slice((page-1)*pageSize,page*pageSize);
 $('memberRows').innerHTML=shown.map((m,i)=>row(m,(page-1)*pageSize+i)).join('')||'<tr><td colspan="7">Tidak ada data member.</td></tr>';
 // Atur lebar background status mengikuti teks status yang sedang dipilih.
 $('memberRows').querySelectorAll('.status-select').forEach(el=>{
  const label=el.value || '';
  el.style.width=`${Math.max(1, label.length * 0.56 + 1.2)}em`;
 });
 $('recordCount').textContent=`${data.length} member`; $('pageInfo').textContent=`${page} / ${pages}`;
 $('prevPage').disabled=page<=1; $('nextPage').disabled=page>=pages;
}
function renderWarnings(){
 const pending=members.filter(m=>m.status==='MENUNGGU REGISTRASI');
 if(!pending.length){
  $('warningText').textContent='Seluruh member sudah tidak memiliki status menunggu registrasi.';
  $('viewRoomBtn').style.display='none'; return;
 }
 $('viewRoomBtn').style.display='inline-block';
 $('warningText').innerHTML=pending.map(m=>`Nomor <strong>${safe(m.phone)}</strong>`).join('<br>')+
  ' sudah diajukan untuk menerima JP, namun <strong>BELUM REGISTRASI</strong> dan <strong>ROOM JP SUDAH BERJALAN!</strong>';
}
function renderAll(){ renderTable(); renderWarnings(); }
function startInline(id,field){
 editing={id,field}; renderTable();
 const input=$('inlineValue'); if(input){input.focus();input.select();}
}
function saveInline(id,field){
 const input=$('inlineValue'), m=members.find(x=>x.id===id); if(!input||!m)return;
 const value=input.value.trim();
 if(field==='phone'){
  if(value.replace(/\D/g,'').length<7){toast('Nomor WhatsApp belum valid.');input.focus();return;}
  m.phone=value;
 }else{
  if(!value || !Number.isFinite(Number(value.replace(/[^\d]/g,'')))){toast('Nominal tidak valid.');return;}
  m[field]=parseAmount(value);
 }
 m.updated=stamp(); editing=null; persist(); toast('Perubahan berhasil disimpan.');
}
function addWhatsApp(m){
 let number=m.phone.replace(/\D/g,''); if(number.startsWith('0'))number='62'+number.slice(1);
 if(number.length<8){toast('Nomor WhatsApp tidak valid.');return;}
 window.open('https://wa.me/'+number,'_blank','noopener,noreferrer');
}
function contactPending(){
 const pending=members.filter(m=>m.status==='MENUNGGU REGISTRASI');
 if(!pending.length)return;
 if(pending.length===1){addWhatsApp(pending[0]);return;}
 const options=pending.map((m,i)=>`${i+1}. ${m.phone}`).join('\n');
 const choice=prompt('Pilih nomor yang ingin dihubungi:\n'+options+'\nMasukkan nomor urut:');
 const index=Number(choice)-1; if(Number.isInteger(index)&&pending[index])addWhatsApp(pending[index]);
}
function openEdit(id){
 const m=members.find(x=>x.id===id); if(!m)return;
 $('editId').value=m.id; $('editPhone').value=m.phone; $('editType').value=m.type;
 $('editAmount').value=m.amount; $('editStatus').value=m.status; $('editClaim').value=m.claim;
 $('modalTitle').textContent='Detail & Edit Member'; $('modalBackdrop').classList.add('show');
}
function closeModal(){ $('modalBackdrop').classList.remove('show'); }

$('searchInput').addEventListener('input',()=>{page=1;renderTable();});
$('filterType').addEventListener('change',()=>{page=1;renderTable();});
$('filterStatus').addEventListener('change',()=>{page=1;renderTable();});
$('prevPage').onclick=()=>{page=Math.max(1,page-1);renderTable();};
$('nextPage').onclick=()=>{page++;renderTable();};
$('viewRoomBtn').onclick=contactPending;

document.addEventListener('click',e=>{
 const inline=e.target.closest('[data-inline]'), save=e.target.closest('[data-save]'), cancel=e.target.closest('[data-cancel]');
 const edit=e.target.closest('[data-edit]'), del=e.target.closest('[data-delete]');
 if(inline){startInline(inline.dataset.id,inline.dataset.inline);return;}
 if(save){saveInline(save.dataset.save,save.dataset.field);return;}
 if(cancel){editing=null;renderTable();return;}
 if(edit){openEdit(edit.dataset.edit);return;}
 if(del){
  const m=members.find(x=>x.id===del.dataset.delete);
  if(m&&confirm(`Hapus data ${m.phone}?`)){members=members.filter(x=>x.id!==m.id);persist();toast('Data member dihapus.');}
 }
});
$('memberRows').addEventListener('change',e=>{
 if(e.target.matches('[data-status]')){
  const m=members.find(x=>x.id===e.target.dataset.status);
  if(m){m.status=e.target.value;m.updated=stamp();persist();toast('Status klaim diperbarui.');}
 }
});
$('memberRows').addEventListener('keydown',e=>{
 if(e.target.id==='inlineValue'&&e.key==='Enter'){
  const box=e.target.closest('.inline-edit'),btn=box?.querySelector('[data-save]');
  if(btn)saveInline(btn.dataset.save,btn.dataset.field);
 }
 if(e.target.id==='inlineValue'&&e.key==='Escape'){editing=null;renderTable();}
});
$('editForm').addEventListener('submit',e=>{
 e.preventDefault(); const m=members.find(x=>x.id===$('editId').value); if(!m)return;
 const digits=$('editPhone').value.replace(/\D/g,'');
 if(digits.length<7){toast('Nomor WhatsApp tidak valid.');return;}
 Object.assign(m,{phone:$('editPhone').value.trim(),type:$('editType').value,
  amount:parseAmount($('editAmount').value),status:$('editStatus').value,
  claim:parseAmount($('editClaim').value),updated:stamp()});
 persist(); closeModal(); toast('Perubahan member tersimpan.');
});
$('closeModal').onclick=$('cancelEdit').onclick=closeModal;
$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});

function openAddModal(){ $('addForm').reset(); $('addStatus').value='MENUNGGU REGISTRASI'; $('addModalBackdrop').classList.add('show'); $('addPhone').focus(); }
function closeAddModal(){ $('addModalBackdrop').classList.remove('show'); }
$('openAddMember').onclick=openAddModal;
$('closeAddModal').onclick=$('cancelAdd').onclick=closeAddModal;
$('addModalBackdrop').addEventListener('click',e=>{if(e.target===$('addModalBackdrop'))closeAddModal();});
$('addForm').addEventListener('submit',e=>{
 e.preventDefault();
 const phone=$('addPhone').value.trim();
 if(phone.replace(/\D/g,'').length<7){toast('Nomor WhatsApp tidak valid.');$('addPhone').focus();return;}
 const now=stamp();
 members.unshift({id:'m'+Date.now()+'-'+Math.random().toString(36).slice(2,7),phone,type:$('addType').value,amount:parseAmount($('addAmount').value),status:$('addStatus').value,claim:parseAmount($('addClaim').value),created:now,updated:now});
 page=1; $('searchInput').value=''; $('filterType').value=''; $('filterStatus').value='';
 persist(); closeAddModal(); toast('Member baru berhasil ditambahkan.');
});


function scalePortraitCanvas(){
 if(window.innerWidth<=900)document.documentElement.style.setProperty('--mobile-zoom',String(window.innerWidth/1536));
 else document.documentElement.style.setProperty('--mobile-zoom','1');
}
window.addEventListener('resize',scalePortraitCanvas); scalePortraitCanvas();
renderAll();
