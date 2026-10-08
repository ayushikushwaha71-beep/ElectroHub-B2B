async function run() {
  try {
    const loginRes = await fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@test.com', password: 'Test1234!' })
    });
    const loginData = await loginRes.json();
    const token = loginData.access;

    const rfqRes = await fetch('http://127.0.0.1:8000/api/quotations/rfq/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const rfqData = await rfqRes.json();
    console.log("Type of rfqData:", typeof rfqData);
    console.log("Is array?", Array.isArray(rfqData));
    console.log("Keys:", Object.keys(rfqData));
    if (rfqData.results) {
        console.log("Type of results:", typeof rfqData.results);
        console.log("Is results array?", Array.isArray(rfqData.results));
    }
  } catch (err) {
    console.error(err);
  }
}
run();
