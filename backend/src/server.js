import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
import router from "./routes/userRoute.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import friendRoute from "./routes/friendRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import messageRoute from "./routes/messageRoute.js";
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import fs from 'fs';
import {app,server} from './socket/index.js';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const PORT = 3000; // Ép cứng cổng 3000 để debug cho dễ

// middleware
app.use(cors({origin: [process.env.CLIENT_URL, "http://localhost:5173"], credentials: true}))
app.use(express.json());
app.use(cookieParser());
// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// swagger
const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf8"));

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument))

// public route
// 1. ROUTE KIỂM TRA NHANH (Gọi cái này trước trong Postman)
app.get("/api/test", (req, res) => {
    res.status(200).json({ message: "Chúc mừng! Server thực sự đang sống và lắng nghe tại cổng 3000" });
});

// private route
// 2. ROUTES CHÍNH
app.use('/api/auth', authRoute);
app.use(protectedRoute);
app.use('/api/users', router);
app.use('/api/friends', friendRoute);
app.use('/api/messages', messageRoute);
app.use('/api/conversations', conversationRoute);
// 3. LOGIC KHỞI ĐỘNG CÓ BẮT LỖI CHI TIẾT
const startServer = () => {
    try {
        server.listen(PORT, '0.0.0.0', () => {
            console.log("-----------------------------------------");
            console.log(`[OK] Server đang mở cổng tại: http://localhost:${PORT}`);
            console.log(`[HINT] Thử gọi GET: http://localhost:${PORT}/api/test trong Postman`);
            console.log("-----------------------------------------");

            // Sau khi mở cổng thành công mới gọi kết nối DB
            console.log("[WAIT] Đang thử kết nối MongoDB...");
            connectDB()
                .then(() => console.log("[OK] Kết nối MongoDB thành công!"))
                .catch(err => console.error("[ERROR] Lỗi kết nối MongoDB:", err.message));
        });

        // Bắt lỗi nếu cổng 3000 bị chiếm dụng bởi phần mềm khác
        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error(`[FATAL] Cổng ${PORT} đã bị ứng dụng khác chiếm dụng. Hãy đổi PORT!`);
            } else {
                console.error("[FATAL] Lỗi Server:", e);
            }
        });

    } catch (err) {
        console.error("[FATAL] Không thể khởi động Server:", err.message);
    }
};

startServer();