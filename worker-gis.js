function haversine(lat1,lng1,lat2,lng2){
 const R=6371000,toRad=x=>x*Math.PI/180;
 const dLat=toRad(lat2-lat1),dLng=toRad(lng2-lng1);
 const a=Math.sin(dLat/2)**2+
  Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
 return 2*R*Math.asin(Math.sqrt(a));
}

function staAlongPolyline(point, poly){
 let acc=0,best={dist:1e12,sta:0};
 for(let i=1;i<poly.length;i++){
  const p1=poly[i-1],p2=poly[i];
  const seg=haversine(p1[1],p1[0],p2[1],p2[0]);
  const d=haversine(point.lat,point.lng,p2[1],p2[0]);
  if(d<best.dist) best={dist:d,sta:acc};
  acc+=seg;
 }
 return best;
}

onmessage = e=>{
 const {data, roads} = e.data;
 const total=data.length;
 let done=0;

 data.forEach(d=>{
  if(!d.ruas){
    let bestRoad=null,min=1e12,bestSta=0;
    roads.forEach(r=>{
      const res=staAlongPolyline(d,r.polyline);
      if(res.dist<min){
        min=res.dist;
        bestRoad=r;
        bestSta=r.sta_start+res.sta;
      }
    });
    if(bestRoad){
      d.ruas=bestRoad.name;
      d.sta="STA "+Math.floor(bestSta/1000)+"+"+
        Math.floor(bestSta%1000).toString().padStart(3,"0");
    }
  }
  done++;
  postMessage({progress:Math.round(done/total*100)});
 });

 postMessage({done:true,result:data});
};
