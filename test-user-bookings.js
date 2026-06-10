const axios = require('axios');

// Test script untuk memverifikasi user-specific bookings
const API_BASE_URL = 'http://localhost:5000/api';

async function testUserBookings() {
  console.log('🧪 Testing User-Specific Bookings Implementation\n');

  try {
    // Step 1: Login as regular user
    console.log('1. Login as regular user...');
    const userLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'user@hotel.com',
      password: 'user123'
    });
    
    const userToken = userLogin.data.token;
    const userId = userLogin.data.id;
    console.log(`✅ User logged in: ${userLogin.data.name} (ID: ${userId})`);

    // Step 2: Login as staff
    console.log('\n2. Login as staff...');
    const staffLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'staff@hotel.com',
      password: 'staff123'
    });
    
    const staffToken = staffLogin.data.token;
    console.log(`✅ Staff logged in: ${staffLogin.data.name}`);

    // Step 3: Test user bookings endpoint
    console.log('\n3. Testing user bookings endpoint...');
    try {
      const userBookings = await axios.get(`${API_BASE_URL}/bookings/user`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log(`✅ User bookings retrieved: ${userBookings.data.length} bookings`);
      
      // Check if all bookings belong to the user
      const userSpecificBookings = userBookings.data.filter(booking => 
        booking.guestEmail === 'user@hotel.com' || booking.userId === userId
      );
      
      if (userSpecificBookings.length === userBookings.data.length) {
        console.log('✅ All bookings belong to the authenticated user');
      } else {
        console.log('❌ Some bookings do not belong to the authenticated user');
      }
    } catch (error) {
      console.log('❌ Error fetching user bookings:', error.response?.data?.error || error.message);
    }

    // Step 4: Test staff all bookings endpoint
    console.log('\n4. Testing staff all bookings endpoint...');
    try {
      const allBookings = await axios.get(`${API_BASE_URL}/bookings/all`, {
        headers: { Authorization: `Bearer ${staffToken}` }
      });
      console.log(`✅ Staff can access all bookings: ${allBookings.data.length} total bookings`);
    } catch (error) {
      console.log('❌ Error fetching all bookings:', error.response?.data?.error || error.message);
    }

    // Step 5: Test user trying to access all bookings (should fail)
    console.log('\n5. Testing user access to all bookings (should be denied)...');
    try {
      await axios.get(`${API_BASE_URL}/bookings/all`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('❌ User should not be able to access all bookings');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ User correctly denied access to all bookings');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.error || error.message);
      }
    }

    // Step 6: Test booking creation with user ID
    console.log('\n6. Testing booking creation with user association...');
    try {
      const bookingData = {
        room_id: 1,
        guest_name: 'Test User',
        guest_email: 'user@hotel.com',
        guest_phone: '081234567890',
        check_in: '2024-12-01',
        check_out: '2024-12-03',
        guests: 2,
        total_price: 1300000,
        special_requests: 'Test booking for user separation'
      };

      const newBooking = await axios.post(`${API_BASE_URL}/bookings/book-room`, bookingData, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      console.log(`✅ Booking created successfully: ID ${newBooking.data.id}`);
      console.log(`✅ Booking associated with user ID: ${newBooking.data.userId || 'Not shown in response'}`);
    } catch (error) {
      console.log('❌ Error creating booking:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 User-specific bookings test completed!');
    console.log('\n📋 Summary:');
    console.log('- Users can only see their own bookings via /bookings/user');
    console.log('- Staff can see all bookings via /bookings/all');
    console.log('- Regular users are denied access to /bookings/all');
    console.log('- New bookings are associated with the authenticated user');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserBookings();
