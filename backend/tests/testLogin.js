const axios = require('axios');

const test = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'doctor@test.com',
      password: 'password123'
    });
    console.log('Doctor login success:', res.data);
  } catch (err) {
    console.error('Doctor login failed:', err.response ? err.response.data : err.message);
  }

  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    console.log('Admin login success:', res.data);
  } catch (err) {
    console.error('Admin login failed:', err.response ? err.response.data : err.message);
  }
};

test();
