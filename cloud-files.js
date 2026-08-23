const CLOUD_SUPABASE_URL='https://ydqqxvtfvnhxpydccciu.supabase.co';
const CLOUD_SUPABASE_KEY='sb_publishable_A-x4W6e_ES8k7fQR3TgGhw_DeVLH50O';
const cloudDb=window.supabase.createClient(CLOUD_SUPABASE_URL,CLOUD_SUPABASE_KEY);

// RH PRO — sincronização de TODOS os anexos/documentos.
// Os módulos usam dois bancos locais: documentos gerais e treinamentos.
const CLOUD_DATABASES=['RH_PRO_DOCUMENTOS','RH_PRO_TREINAMENTOS'];
let cloudUser=null,cloudBusy=false,cloudTimer=null;
const cloudStatus=msg=>{const el=document.getElementById('sync');if(el&&msg)el.textContent=msg;};

function openLocalFilesDB(name='RH_PRO_DOCUMENTOS',mode='readonly'){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(name);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files',{keyPath:'id'});};
    req.onsuccess=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('files')){db.close();reject(new Error('Armazenamento de documentos indisponível.'));return;}
      try{const tx=db.transaction('files',mode);resolve({db,tx,store:tx.objectStore('files')});}
      catch(e){db.close();reject(e);}
    };
    req.onerror=()=>reject(req.error||new Error('Não foi possível abrir os documentos locais.'));
  });
}

async function allLocalFiles(name){
  try{
    const {db,store}=await openLocalFilesDB(name,'readonly');
    return await new Promise(resolve=>{
      const r=store.getAll();
      r.onsuccess=()=>{const out=r.result||[];db.close();resolve(out);};
      r.onerror=()=>{db.close();resolve([]);};
    });
  }catch(e){console.error('RH PRO local files',name,e);return[];}
}

async function putLocalFile(name,rec){
  if(!rec?.id||!rec?.blob)return false;
  try{
    const {db,tx,store}=await openLocalFilesDB(name,'readwrite');
    return await new Promise(resolve=>{
      store.put(rec);
      tx.oncomplete=()=>{db.close();resolve(true);};
      tx.onerror=()=>{db.close();resolve(false);};
      tx.onabort=()=>{db.close();resolve(false);};
    });
  }catch(e){console.error('RH PRO write local file',name,e);return false;}
}

function databaseForFile(id,storagePath=''){
  const s=String(storagePath||'');
  if(s.includes('/RH_PRO_TREINAMENTOS/'))return 'RH_PRO_TREINAMENTOS';
  if(/^treinamento(_pdf)?_|^trein_/.test(String(id||'')))return 'RH_PRO_TREINAMENTOS';
  return 'RH_PRO_DOCUMENTOS';
}

async function cloudUploadLocal(){
  if(!cloudUser)return 0;
  let sent=0;
  for(const dbName of CLOUD_DATABASES){
    const files=await allLocalFiles(dbName);
    for(const f of files){
      if(!f?.id||!f?.blob)continue;
      const path=cloudUser.id+'/'+dbName+'/'+encodeURIComponent(String(f.id));
      const {error}=await cloudDb.storage.from('rhpro-files').upload(path,f.blob,{contentType:f.blob.type||f.mimeType||'application/octet-stream',upsert:true});
      if(error){console.error('RH PRO upload',dbName,f.id,error);continue;}
      const fileId=String(f.id);
      const {error:metaError}=await cloudDb.from('rhpro_files').upsert({
        user_id:cloudUser.id,
        file_id:fileId,
        storage_path:path,
        file_name:f.fileName||f.nome||f.name||f.blob.name||fileId,
        mime_type:f.blob.type||f.mimeType||null,
        file_size:f.blob.size||null
      },{onConflict:'user_id,file_id'});
      if(metaError){console.error('RH PRO metadata',dbName,f.id,metaError);continue;}
      sent++;
    }
  }
  return sent;
}

async function cloudDownloadRemote(){
  if(!cloudUser)return 0;
  const {data,error}=await cloudDb.from('rhpro_files').select('file_id,storage_path,file_name,mime_type').eq('user_id',cloudUser.id);
  if(error){console.error('RH PRO list cloud files',error);return 0;}
  if(!data?.length)return 0;

  const localMap=new Map();
  for(const dbName of CLOUD_DATABASES){
    const local=await allLocalFiles(dbName);
    for(const f of local){
      if(f?.id)localMap.set(dbName+'::'+String(f.id),f);
    }
  }

  let got=0;
  for(const row of data){
    if(!row?.file_id||!row?.storage_path)continue;
    const dbName=databaseForFile(row.file_id,row.storage_path);
    const key=dbName+'::'+String(row.file_id);
    const existing=localMap.get(key);
    if(existing?.blob)continue;

    const {data:blob,error:dlErr}=await cloudDb.storage.from('rhpro-files').download(row.storage_path);
    if(dlErr||!blob){console.error('RH PRO download',row.file_id,dlErr);continue;}

    const ok=await putLocalFile(dbName,{
      id:String(row.file_id),
      blob,
      funcionario:'',
      tipo:'',
      fileName:row.file_name,
      nome:row.file_name,
      area:'Nuvem RH PRO',
      mimeType:row.mime_type||blob.type
    });
    if(ok){localMap.set(key,{blob});got++;}
  }
  return got;
}

async function cloudCycle(){
  if(!cloudUser||cloudBusy)return;
  cloudBusy=true;
  try{
    cloudStatus('☁ Sincronizando documentos...');
    const sent=await cloudUploadLocal();
    const got=await cloudDownloadRemote();
    cloudStatus((sent||got)?'☁ Documentos sincronizados':'☁ Sincronizado');
  }catch(e){
    console.error('RH PRO cloud files',e);
    cloudStatus('⚠ Erro nos documentos');
  }finally{cloudBusy=false;}
}

async function cloudStart(){
  if(cloudUser)return;
  try{
    const {data}=await cloudDb.auth.getSession();
    if(!data?.session)return;
    cloudUser=data.session.user;
    await cloudCycle();
    if(cloudTimer)clearInterval(cloudTimer);
    cloudTimer=setInterval(cloudCycle,8000);
  }catch(e){console.error('RH PRO cloud start',e);}
}
setInterval(()=>{if(!cloudUser)cloudStart();},2000);
cloudStart();
