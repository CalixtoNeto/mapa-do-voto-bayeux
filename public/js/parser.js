// ---------- Leitura do arquivo oficial do TSE (votacao_secao_ANO_PB) ----------
// Soma, por local de votação, os votos nominais de Bayeux para governador, senador,
// deputado federal, deputado estadual e vereador, em todos os turnos do arquivo.
const NORM = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();

// Cargos lidos e quantidade de dígitos do número de um candidato (menos que isso é voto de legenda)
const CARGOS = { '3': 2, '5': 3, '6': 4, '7': 5, '13': 5 };

function splitLine(s){
  const out=[]; const n=s.length; let i=0;
  while(i<=n){
    if(s.charCodeAt(i)===34){
      let j=i+1, val='';
      for(;;){
        const q=s.indexOf('"',j);
        if(q<0){ val+=s.slice(j); j=n; break; }
        val+=s.slice(j,q);
        if(s.charCodeAt(q+1)===34){ val+='"'; j=q+2; } else { j=q+1; break; }
      }
      out.push(val); i=j+1;
    } else {
      let q=s.indexOf(';',i); if(q<0) q=n;
      out.push(s.slice(i,q)); i=q+1;
    }
  }
  return out;
}

const REQ = ['ANO_ELEICAO','NR_TURNO','SG_UF','CD_MUNICIPIO','NR_ZONA','NR_SECAO','CD_CARGO','DS_CARGO','NR_VOTAVEL','NM_VOTAVEL','QT_VOTOS'];

// tabelas: { [ano]: { municipio, locais, secoes } } (public/data/secoes-ANO.json)
class Aggregator{
  constructor(uf, tabelas){
    this.uf=uf; this.tabelas=tabelas; this.header=null; this.cands=new Map(); this.tot={}; this.esp={}; this.partidos={};
    this.rows=0; this.semLocal=new Set(); this.anos=new Set(); this.err=null; this.idx={};
    const t=Object.values(tabelas)[0]; this.cod=t ? t.municipio : null;
  }
  // índice do local de votação: pela seção e, se faltar, por zona + número do local
  local(tab, zona, secao, nrLocal){
    let i = tab.secoes[zona+'|'+secao];
    if(i!=null) return i;
    let m = this.idx[tab.ano]; if(!m){ m=this.idx[tab.ano]=new Map(); tab.locais.forEach((l,k)=>m.set(l.zona+'|'+l.nr,k)); }
    i = m.get(zona+'|'+parseInt(nrLocal,10));
    return i==null ? null : i;
  }
  line(l){
    if(this.err || !l) return;
    if(l.charCodeAt(l.length-1)===13) l=l.slice(0,-1);
    if(!l) return;
    if(this.header && this.cod && l.indexOf(this.cod)<0) return;
    const c=splitLine(l);
    if(!this.header){
      const h=c.map(x=>x.trim().toUpperCase());
      const miss=REQ.filter(k=>h.indexOf(k)<0);
      if(miss.length){ this.err='O arquivo não tem as colunas esperadas do TSE ('+miss.slice(0,4).join(', ')+'). Use o arquivo “votação por seção eleitoral” (votacao_secao).'; return; }
      const ix={}; h.forEach((k,i)=>ix[k]=i); this.ix=ix; this.header=h; return;
    }
    const ix=this.ix;
    const cargo=c[ix.CD_CARGO], minDig=CARGOS[cargo];
    if(c[ix.SG_UF]!==this.uf || !minDig) return;
    const ano=c[ix.ANO_ELEICAO];
    const tab=this.tabelas[ano];
    if(!tab) { this.anos.add(ano); return; }
    if(c[ix.CD_MUNICIPIO]!==tab.municipio) return;
    this.rows++; this.anos.add(ano);
    const turno=c[ix.NR_TURNO];
    const tk=ano+'|'+turno+'|'+cargo;
    const v=parseInt(c[ix.QT_VOTOS],10)||0;
    const nr=c[ix.NR_VOTAVEL];
    if(nr.length<minDig || nr==='95' || nr==='96'){
      // 95 = branco, 96 = nulo, números curtos = voto de legenda (o nome é o do partido)
      const e=this.esp[tk]||(this.esp[tk]={branco:0,nulo:0,legenda:0});
      if(nr==='95') e.branco+=v; else if(nr==='96') e.nulo+=v; else e.legenda+=v;
      if(nr.length===2 && nr!=='95' && nr!=='96' && cargo!=='3') (this.partidos[ano]||(this.partidos[ano]={}))[nr]=c[ix.NM_VOTAVEL];
      return;
    }
    const loc=this.local(tab, c[ix.NR_ZONA], c[ix.NR_SECAO], ix.NR_LOCAL_VOTACAO!=null ? c[ix.NR_LOCAL_VOTACAO] : '');
    if(loc==null){ this.semLocal.add(c[ix.NR_ZONA]+'|'+c[ix.NR_SECAO]); return; }
    const key=tk+'|'+nr;
    let k=this.cands.get(key);
    if(!k){ k={key, ano, turno, cargo, cargoNome:c[ix.DS_CARGO], nr, nome:c[ix.NM_VOTAVEL], total:0, loc:{}}; this.cands.set(key,k); }
    k.loc[loc]=(k.loc[loc]||0)+v; k.total+=v;
    const t=this.tot[tk]||(this.tot[tk]={});
    t[loc]=(t[loc]||0)+v;
  }
  result(fileName){
    return { fileName, uf:this.uf, rows:this.rows, semLocal:[...this.semLocal], anos:[...this.anos].filter(a=>this.tabelas[a]),
      anosSemTabela:[...this.anos].filter(a=>!this.tabelas[a]), cands:[...this.cands.values()], tot:this.tot, esp:this.esp, partidos:this.partidos, loadedAt:Date.now() };
  }
}

function makeLineFeeder(agg){
  const dec=new TextDecoder('windows-1252'); let buf='';
  return (chunk, final)=>{
    if(chunk && chunk.length) buf+=dec.decode(chunk,{stream:!final}); else if(final) buf+=dec.decode();
    let start=0, nl;
    while((nl=buf.indexOf('\n',start))>=0){ agg.line(buf.slice(start,nl)); start=nl+1; }
    buf=buf.slice(start);
    if(final && buf){ agg.line(buf); buf=''; }
  };
}

async function readStream(file, onChunk, onProgress){
  const reader=file.stream().getReader(); let read=0;
  for(;;){
    const {value, done}=await reader.read();
    if(done){ onChunk(null,true); break; }
    read+=value.length; onChunk(value,false); onProgress && onProgress(read/file.size);
    await new Promise(r=>setTimeout(r,0));
  }
}

function conferir(agg){
  if(agg.err) throw new Error(agg.err);
  if(!agg.rows){
    if(agg.anosSemTabela && agg.anosSemTabela.length) throw new Error('Este arquivo é da eleição de '+agg.anosSemTabela.join(', ')+', que não tem tabela de locais de votação aqui.');
    throw new Error('O arquivo não tem votos de Bayeux para governador, senador, deputado ou vereador.');
  }
}

async function parseTSE(file, uf, tabelas, onProgress){
  const head=new Uint8Array(await file.slice(0,4).arrayBuffer());
  const isZip=head[0]===0x50 && head[1]===0x4B;
  if(!isZip){
    const agg=new Aggregator(uf,tabelas); const feed=makeLineFeeder(agg);
    await readStream(file, feed, onProgress);
    agg.anosSemTabela=[...agg.anos].filter(a=>!tabelas[a]); conferir(agg);
    return agg.result(file.name);
  }
  let found=false, ferr=null;
  const agg=new Aggregator(uf,tabelas);
  const uz=new fflate.Unzip(); uz.register(fflate.UnzipInflate);
  const re=new RegExp('_'+uf+'\\.csv$','i');
  uz.onfile=f=>{
    if(!re.test(f.name.split('/').pop())) return;
    found=true; const feed=makeLineFeeder(agg);
    f.ondata=(err,chunk,final)=>{ if(err){ ferr=err; return; } feed(chunk,final); };
    f.start();
  };
  await readStream(file,(chunk,final)=>{ uz.push(chunk||new Uint8Array(0),final); }, onProgress);
  if(ferr) throw new Error('Não foi possível descompactar o arquivo.');
  if(!found) throw new Error('O .zip não contém um CSV da '+uf+'. Confira se é o arquivo “votacao_secao” do TSE.');
  agg.anosSemTabela=[...agg.anos].filter(a=>!tabelas[a]); conferir(agg);
  return agg.result(file.name);
}
