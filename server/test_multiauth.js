const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Cookie': 'PHPSESSID=2c5nqm9v7jri8rfd088okp0hr3; ci_session=b2f39c77fdfdb6db0b9872789808246d'
};

async function checkMultiAuth() {
  const url = 'https://cuiet.codebrigade.in/multiAuthentication/displayGrid';
  const res = await fetch(url, { headers, redirect: 'manual' });
  console.log('Status:', res.status, 'Location:', res.headers.get('location'));
  const text = await res.text();
  console.log('Text preview:', text.slice(0, 800));

  // Find forms and inputs
  const forms = text.match(/<form[\s\S]*?<\/form>/gi) || [];
  console.log('Forms found:', forms.length);
  forms.forEach((f, i) => console.log(`Form ${i}:\n`, f.slice(0, 1000)));

  // Find scripts
  const scripts = [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  scripts.forEach((s, i) => {
    if (s.includes('otp') || s.includes('Otp') || s.includes('OTP')) {
      console.log(`Script ${i} OTP snippet:\n`, s.slice(0, 600));
    }
  });
}

checkMultiAuth().catch(console.error);
