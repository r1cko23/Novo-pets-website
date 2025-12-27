// Quick test script to verify the availability endpoint works
const fetch = require('node-fetch');

async function testAvailability() {
  const testDate = '2025-12-27';
  const url = `http://localhost:3000/api/availability?date=${testDate}`;
  
  console.log(`Testing availability endpoint: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (data.success && data.availableTimeSlots) {
      console.log(`\n✅ Success! Found ${data.availableTimeSlots.length} time slots`);
      const available = data.availableTimeSlots.filter(s => s.available).length;
      const booked = data.availableTimeSlots.length - available;
      console.log(`   - Available: ${available}`);
      console.log(`   - Booked: ${booked}`);
    } else {
      console.log(`\n❌ Error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`\n❌ Fetch error:`, error.message);
    console.error(`   Make sure the server is running on port 3000`);
  }
}

testAvailability();

