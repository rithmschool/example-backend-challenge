const request = require('supertest');
const fs = require('fs');
const app = require('../app');

beforeAll(() => {
  // Write a default database before each run
  const DEFAULT_DATABASE_STATE = {
    '5432': [
      {
        sender: 'anson',
        message: "I'm a teapot",
        created: '2018-01-17T04:50:14.883Z'
      }
    ]
  };

  try {
    fs.writeFileSync(
      './__tests__/test_database.json',
      JSON.stringify(DEFAULT_DATABASE_STATE)
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
});

describe('POST /messages/ ', () => {
  test('It respond with a 201 for a correctly-formatted POST', async () => {
    const data = {
      sender: 'anson',
      conversation_id: '1234',
      message: "I'm a teapot"
    };
    const response = await request(app)
      .post('/messages/')
      .send(data);
    expect(response.body).toEqual(data);
    expect(response.statusCode).toBe(201);
  });
});

describe('GET /conversations/:id ', () => {
  test('It should have an ID and a messages array', async () => {
    const response = await request(app).get('/conversations/5432');
    expect(response.body).toEqual({
      id: '5432',
      messages: [
        {
          sender: 'anson',
          message: "I'm a teapot",
          created: '2018-01-17T04:50:14.883Z'
        }
      ]
    });
    expect(response.statusCode).toBe(200);
  });
});

afterAll(() => {
  // clean up file afterward
  try {
    fs.writeFileSync('./__tests__/test_database.json', JSON.stringify({}));
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
});
