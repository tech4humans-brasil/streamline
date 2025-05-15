const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const token = process.env.STREAMLINE_TOKEN;

const api = axios.create({
  baseURL: 'https://prod-streamline-services.azurewebsites.net/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const users = [{
  name: 'John Doe',
  email: 'john.doe@example.com',
}]

const createUser = async (user) => {
  const response = await api.post('/user', {
    ...user,
    password: 'password',
    roles: ['student'],
    isExternal: false,
    institutes: [
      {
        _id: '67d87ecf18dc32ba9051c789',
        name: 'Instituto Federal de Alagoas',
      },
    ],
  });
  return response.data?.data;
};

const createInstitute = async (institute) => {
  const response = await api.post('/institute', institute);
  return response.data?.data;
};

async function main() {
  for (const user of users) {
    const institute = await createInstitute({
      name: user.name,
      acronym: user.name.replace(/\s+/g, '').toLowerCase(),
    });

    const createdUser = await createUser({
      ...user,
      institutes: [institute._id],
    });
    console.log(`> Created user: ${createdUser._id} ${createdUser.name}`);
  }
}

main();

