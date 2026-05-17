import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "node:dns"; // Import thêm dns
import { Resend } from 'resend';
dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY); 

export const sendOTP = async (email, otp) => {
    try {
        // Kiểm tra xem API Key có tồn tại không để tránh lỗi im lặng
        if (!process.env.RESEND_API_KEY) {
            console.error("LỖI: Chưa cấu hình RESEND_API_KEY trong biến môi trường.");
            return;
        }

        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev', 
            to: email,
            subject: 'Mã OTP xác thực',
            html: `<strong>Mã OTP của bạn là: ${otp}</strong>`,
        });

        if (error) {
            return console.error("Lỗi từ Resend API:", error);
        }

        console.log("Gửi qua Resend thành công! ID:", data.id);
    } catch (error) {
        console.error("Lỗi hệ thống khi gửi Resend:", error);
    }
};