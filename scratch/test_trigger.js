const testTrigger = (nowString, offsetMs, intervalSeconds) => {
  const now = new Date(nowString).getTime();
  const adjustedNow = now + offsetMs;
  const intervalMs = intervalSeconds * 1000;

  const adjustedDate = new Date(adjustedNow);
  const msSinceMidnight =
    adjustedDate.getHours() * 3600000 +
    adjustedDate.getMinutes() * 60000 +
    adjustedDate.getSeconds() * 1000 +
    adjustedDate.getMilliseconds();

  const msIntoInterval = msSinceMidnight % intervalMs;
  const msToNext = intervalMs - msIntoInterval;
  const firstBip = new Date(now + msToNext);

  console.log(`Now: ${new Date(now).toISOString()} | Offset: ${offsetMs}ms | Interval: ${intervalSeconds}s`);
  console.log(`Adjusted Now: ${adjustedDate.toISOString()}`);
  console.log(`msSinceMidnight: ${msSinceMidnight} | msIntoInterval: ${msIntoInterval} | msToNext: ${msToNext}`);
  console.log(`First Bip: ${firstBip.toISOString()}`);
  console.log(`First Bip Local: ${firstBip.toString()}`);
  console.log('----------------------------------------------------');
};

// Test with no offset, 1 minute interval (60s)
testTrigger('2026-06-20T19:24:02.123-03:00', 0, 60);

// Test with +5s offset, 1 minute interval
testTrigger('2026-06-20T19:24:02.123-03:00', 5000, 60);

// Test with -5s offset, 1 minute interval
testTrigger('2026-06-20T19:24:02.123-03:00', -5000, 60);

// Test with no offset, 1 hour interval (3600s)
testTrigger('2026-06-20T18:14:00.000-03:00', 0, 3600);
