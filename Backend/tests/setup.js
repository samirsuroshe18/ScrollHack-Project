import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.ACCESS_TOKEN_SECRET = 'test-access';
process.env.ACCESS_TOKEN_EXPIRY = '1d';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
process.env.REFRESH_TOKEN_EXPIRY = '10d';
process.env.FRONTEND_URL = 'http://localhost:5173';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});
