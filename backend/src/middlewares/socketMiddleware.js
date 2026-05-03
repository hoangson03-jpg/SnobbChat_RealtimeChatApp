import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Socket } from 'socket.io';

export const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if(!token) {
            return next(new Error("Unauthorized - Token không tồn tại!"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if(!decoded) {
            return next(new Error("Unauthorized - Token không hợp lệ hoặc không tồn tại!"));
        }

        const user = await User.findById(decoded.userId).select("-hashedPassword");
        if(!user) {
            return next(new Error("User không tồn tại!"));
        }

        socket.user = user;

        next();
    } catch (error) {
        console.error("Lỗi khi verify jwt trong socket middleware ", error);
        next(new Error("Unauthorized"));
    }
}