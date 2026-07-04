const url = 'http://localhost:3000/auth/signin';
try {
  const res = await fetch(url, { redirect: 'manual' });
  console.log(`STATUS:${res.status}`);
} catch (e) {
  console.log(`ERROR:${e?.message || e}`);
  process.exit(1);
}
