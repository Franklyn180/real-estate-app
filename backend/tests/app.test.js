const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const { initializeDatabase } = require('../db');

test.before(async () => {
  await initializeDatabase();
});

test('GET /api/health returns a healthy response', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect(200);

  assert.strictEqual(response.body.status, 'ok');
  assert.strictEqual(response.body.service, 'real-estate-backend');
});

test('POST /api/enquiries rejects requests without name or email', async () => {
  const response = await request(app)
    .post('/api/enquiries')
    .send({
      message: 'I am interested in this property.'
    })
    .expect(400);

  assert.strictEqual(response.body.error, 'Name and email are required.');
});

test('POST /api/enquiries accepts a valid enquiry', async () => {
  const response = await request(app)
    .post('/api/enquiries')
    .send({
      name: 'John Doe',
      email: 'john@example.com',
      propertyId: 1,
      message: 'I am interested in this property.'
    })
    .expect(201);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(
    response.body.message,
    'Your enquiry has been received. An advisor will contact you soon.'
  );
  assert.strictEqual(response.body.enquiry.name, 'John Doe');
  assert.strictEqual(response.body.enquiry.email, 'john@example.com');
});

test('GET /api/properties returns a list of properties', async () => {
  const response = await request(app)
    .get('/api/properties')
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0);
  assert.ok(response.body[0].title);
  assert.ok(response.body[0].location);
});

test('GET /api/properties/:id returns 404 for a missing property', async () => {
  const response = await request(app)
    .get('/api/properties/999999')
    .expect(404);

  assert.strictEqual(response.body.error, 'Property not found.');
});

test('GET /api/agents returns a list of agents', async () => {
  const response = await request(app)
    .get('/api/agents')
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0);
  assert.ok(response.body[0].name);
  assert.ok(response.body[0].email);
});