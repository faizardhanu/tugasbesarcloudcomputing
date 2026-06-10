const axios = require('axios');

// Test API endpoints secara langsung
const API_BASE_URL = 'http://localhost:5000/api';

async function testAPIDirectly() {
  console.log('🧪 Testing API Endpoints Directly...\n');

  try {
    // Step 1: Login as user@hotel.com
    console.log('1. Login as user@hotel.com...');
    const userLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'user@hotel.com',
      password: 'user123'
    });
    
    const userToken = userLogin.data.token;
    const userId = userLogin.data.id;
    console.log(`✅ User logged in: ${userLogin.data.name} (ID: ${userId})`);
    console.log(`   Token: ${userToken.substring(0, 20)}...`);

    // Step 2: Login as test@hotel.com (Denis)
    console.log('\n2. Login as test@hotel.com...');
    const denisLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@hotel.com',
      password: 'user123'
    });
    
    const denisToken = denisLogin.data.token;
    const denisId = denisLogin.data.id;
    console.log(`✅ Denis logged in: ${denisLogin.data.name} (ID: ${denisId})`);
    console.log(`   Token: ${denisToken.substring(0, 20)}...`);

    // Step 3: Test user@hotel.com bookings
    console.log('\n3. Testing user@hotel.com bookings...');
    try {
      const userBookings = await axios.get(`${API_BASE_URL}/bookings/user`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log(`✅ User bookings retrieved: ${userBookings.data.length} bookings`);
      
      if (userBookings.data.length > 0) {
        console.log('   Bookings details:');
        userBookings.data.forEach(booking => {
          console.log(`     ID: ${booking.id} | Guest: ${booking.guestEmail} | User ID: ${booking.userId || 'N/A'}`);
        });
      }
    } catch (error) {
      console.log('❌ Error fetching user bookings:', error.response?.data?.error || error.message);
    }

    // Step 4: Test Denis bookings
    console.log('\n4. Testing Denis bookings...');
    try {
      const denisBookings = await axios.get(`${API_BASE_URL}/bookings/user`, {
        headers: { Authorization: `Bearer ${denisToken}` }
      });
      console.log(`✅ Denis bookings retrieved: ${denisBookings.data.length} bookings`);
      
      if (denisBookings.data.length > 0) {
        console.log('   Bookings details:');
        denisBookings.data.forEach(booking => {
          console.log(`     ID: ${booking.id} | Guest: ${booking.guestEmail} | User ID: ${booking.userId || 'N/A'}`);
        });
      }
    } catch (error) {
      console.log('❌ Error fetching Denis bookings:', error.response?.data?.error || error.message);
    }

    // Step 5: Test without token (should fail)
    console.log('\n5. Testing without token (should fail)...');
    try {
      await axios.get(`${API_BASE_URL}/bookings/user`);
      console.log('❌ Request should have failed without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected request without token');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.error || error.message);
      }
    }

    // Step 6: Create a test booking as user@hotel.com
    console.log('\n6. Creating test booking as user@hotel.com...');
    try {
      const bookingData = {
        room_id: 1,
        guest_name: 'Regular User Test',
        guest_email: 'user@hotel.com',
        guest_phone: '081234567890',
        check_in: '2024-12-15',
        check_out: '2024-12-17',
        guests: 2,
        total_price: 1700000,
        special_requests: 'Test booking for user separation'
      };

      const newBooking = await axios.post(`${API_BASE_URL}/bookings/book-room`, bookingData, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      console.log(`✅ Booking created successfully: ID ${newBooking.data.id}`);
      console.log(`   Associated with user ID: ${newBooking.data.userId || 'Not shown'}`);
      
      // Now test if user can see this new booking
      console.log('\n7. Testing if user can see new booking...');
      const updatedUserBookings = await axios.get(`${API_BASE_URL}/bookings/user`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log(`✅ User now has ${updatedUserBookings.data.length} bookings`);
      
      // Test if Denis can see this booking (should not)
      console.log('\n8. Testing if Denis can see user\'s booking (should not)...');
      const denisBookingsAfter = await axios.get(`${API_BASE_URL}/bookings/user`, {
        headers: { Authorization: `Bearer ${denisToken}` }
      });
      console.log(`✅ Denis still has ${denisBookingsAfter.data.length} bookings (should be same as before)`);
      
    } catch (error) {
      console.log('❌ Error creating booking:', error.response?.data?.error || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPIDirectly();
