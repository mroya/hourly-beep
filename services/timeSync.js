/**
 * Sincronização de tempo via servidores NTP/HTTP.
 * Retorna { success, offset } onde offset = atomicTime - systemTime em ms.
 */
export async function performTimeSync() {
  const endpoints = [
    { url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC', type: 'timeapi' },
    { url: 'https://worldtimeapi.org/api/timezone/Etc/UTC', type: 'worldtime' },
  ];

  let success = false;
  let offset = 0;

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(endpoint.url, {
        headers: { 'Cache-Control': 'no-cache' },
        method: 'GET',
      });
      if (!response.ok) continue;
      const data = await response.json();
      const end = Date.now();
      const rtt = end - start;

      let serverMs = 0;
      if (endpoint.type === 'timeapi' && data.dateTime) {
        serverMs = new Date(data.dateTime + 'Z').getTime();
      } else if (endpoint.type === 'worldtime' && data.utc_datetime) {
        serverMs = new Date(data.utc_datetime).getTime();
      } else {
        continue;
      }

      // Tempo real considera latência de rede (RTT / 2)
      const trueTime = serverMs + rtt / 2;
      offset = trueTime - end;
      success = true;
      break;
    } catch (err) {
      console.log(`Erro ao sincronizar com ${endpoint.url}:`, err);
    }
  }

  // Fallback: Cloudflare Date header
  if (!success) {
    try {
      const start = Date.now();
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { method: 'HEAD' });
      const dateHeader = response.headers.get('date');
      const end = Date.now();
      if (dateHeader) {
        const serverMs = new Date(dateHeader).getTime();
        const rtt = end - start;
        const trueTime = serverMs + rtt / 2;
        offset = trueTime - end;
        success = true;
      }
    } catch (err) {
      console.log('Erro no fallback do Cloudflare:', err);
    }
  }

  return { success, offset };
}
