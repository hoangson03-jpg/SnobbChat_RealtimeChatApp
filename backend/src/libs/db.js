import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        // Đảm bảo biến môi trường đã được load
        const conn = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log(`Kết nối MongoDB thành công: ${conn.connection.host}`);
    } catch (error) {
        console.error('Lỗi khi kết nối db: ', error.message);
        process.exit(1); // Dừng app nếu không kết nối được DB
    }
}