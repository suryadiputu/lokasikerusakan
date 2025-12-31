// worker-gis.js
let roads = [];

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === "INIT") {
    roads = payload;
    self.postMessage({ type: "READY" });
  }

  if (type === "GENERATE_ALL") {
    const results = payload.map(p => ({
      id: p.id,
      ...findNearest(p.lat, p.lng)
    }));
    self.postMessage({ type: "RESULT_ALL", results });
  }

  if (type === "SINGLE_POINT") {
    const res = findNearest(payload.lat, payload.lng);
    self.postMessage({ type: "RESULT_SINGLE", result: res });
  }
};

function haversine(a, b) {
  const R = 6371000;
  const dLat = (b[1] - a[1]) * Math.PI / 180;
  const dLng = (b[0] - a[0]) * Math.PI / 180;
  const lat1 = a[1] * Math.PI / 180;
  const lat2 = b[1] * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 +
            Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function findNearest(lat, lng) {
  let best = { dist: Infinity };

  roads.forEach(r => {
    let acc = 0;
    for (let i=0;i<r.polyline.length-1;i++) {
      const a = r.polyline[i];
      const b = r.polyline[i+1];
      const d = haversine([lng,lat], a);
      if (d < best.dist) {
        best = {
          dist: d,
          road: r.name,
          sta: Math.round(r.sta_start + acc)
        };
      }
      acc += haversine(a,b);
    }
  });

  return {
    road: best.road || "",
    sta: best.sta || ""
  };
}
