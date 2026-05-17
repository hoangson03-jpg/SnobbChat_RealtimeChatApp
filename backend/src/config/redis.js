import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
    // Cấu trúc: redis[s]://username:password@host:port
    url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('🚀 Đã kết nối với Redis Cloud'));

// Kết nối không đồng bộ
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Không thể kết nối tới Redis:', err);
    }
})();

export default redisClient;