const CLOUD_SUPABASE_URL='https://ydqqxvtfvnhxpydccciu.supabase.co';
const CLOUD_SUPABASE_KEY='sb_publishable_A-x4W6e_ES8k7fQR3TgGhw_DeVLH50O';
const cloudDb=window.supabase.createClient(CLOUD_SUPABASE_URL,CLOUD_SUPABASE_KEY);
let cloudUser=null,cloudBusy=false,cloudTimer=null;
const cloudStatus=msg=>{const el=document.getElementById('sync');if(el&&msg)el.textContent=msg};

function openLocalFilesDB(mode='readonly'){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('RH_PRO_DOCUMENTOS');
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files',{keyPath:'id'});};
    req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains('files')){db.close();reject(new Error('Armazenamento de documentos indisponível.'));return;}try{const tx=db.transaction('files',mode);resolve({db,tx,store:tx.objectStore('files')});}catch(e){db.close();reject(e);}};
    req.onerror=()=>reject(req.error||new Error('Não foi possível abrir os documentos locais.'));
  });
}

async function allLocalFiles(){
  try{const {db,store}=await openLocalFilesDB('readonly');return await new Promise(resolve=>{const r=store.getAll();r.onsuccess=()=>{const out=r.result||[];db.close();resolve(out);};r.onerror=()=>{db.close();resolve([]);};});}
  catch(e){console.error('RH PRO local files',e);return[];}
}

async function putLocalFile(rec){
  if(!rec?.id||!rec?.blob)return false;
  try{const {db,tx,store}=await openLocalFilesDB('readwrite');return await new Promise(resolve=>{store.put(rec);tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{db.close();resolve(false);};tx.onabort=()=>{db.close();resolve(false);};});}
  catch(e){console.error('RH PRO write local file',e);return false;}
}

async function cloudUploadLocal(){
  if(!cloudUser)return 0;
  const files=await allLocalFiles();let sent=0;
  for(const f of files){
    if(!f?.id||!f?.blob)continue;
    const path=cloudUser.id+'/'+encodeURIComponent(String(f.id));
    const {error}=await cloudDb.storage.from('rhpro-files').upload(path,f.blob,{contentType:f.blob.type||f.mimeType||'application/octet-stream',upsert:true});
    if(error){console.error('RH PRO upload',f.id,error);continue;}
    const {error:metaError}=await cloudDb.from('rhpro_files').upsert({user_id:cloudUser.id,file_id:String(f.id),storage_path:path,file_name:f.fileName||f.nome||f.name||f.blob.name||String(f.id),mime_type:f.blob.type||f.mimeType||null,file_size:f.blob.size||null},{onConflict:'user_id,file_id'});
    if(metaError){console.error('RH PRO metadata',f.id,metaError);continue;}
    sent++;
  }
  return sent;
}

async function cloudDownloadRemote(){
  if(!cloudUser)return 0;
  const {data,error}=await cloudDb.from('rhpro_files').select('file_id,storage_path,file_name,mime_type').eq('user_id',cloudUser.id);
  if(error){console.error('RH PRO list cloud files',error);return 0;}
  if(!data?.length)return 0;
  const local=await allLocalFiles();const localIds=new Set(local.map(x=>String(x?.id)));let got=0;
  for(const row of data){
    if(!row?.file_id||localIds.has(String(row.file_id)))continue;
    const {data:blob,error:dlErr}=await cloudDb.storage.from('rhpro-files').download(row.storage_path);
    if(dlErr||!blob){console.error('RH PRO download',row.file_id,dlErr);continue;}
    const ok=await putLocalFile({id:String(row.file_id),blob,funcionario:'',tipo:'',fileName:row.file_name,nome:row.file_name,area:'Nuvem RH PRO',mimeType:row.mime_type||blob.type});
    if(ok){localIds.add(String(row.file_id));got++;}
  }
  return got;
}

async function cloudCycle(){
  if(!cloudUser||cloudBusy)return;cloudBusy=true;
  try{cloudStatus('☁ Sincronizando documentos...');const sent=await cloudUploadLocal();const got=await cloudDownloadRemote();cloudStatus((sent||got)?'☁ Documentos sincronizados':'☁ Sincronizado');}
  catch(e){console.error('RH PRO cloud files',e);cloudStatus('⚠ Erro nos documentos');}
  finally{cloudBusy=false;}
}

async function cloudStart(){
  if(cloudUser)return;
  try{const {data}=await cloudDb.auth.getSession();if(!data?.session)return;cloudUser=data.session.user;await cloudCycle();if(cloudTimer)clearInterval(cloudTimer);cloudTimer=setInterval(cloudCycle,8000);}
  catch(e){console.error('RH PRO cloud start',e);}
}
setInterval(()=>{if(!cloudUser)cloudStart();},2000);cloudStart();
