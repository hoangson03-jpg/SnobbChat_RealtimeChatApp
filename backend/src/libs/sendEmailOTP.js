import nodemailer from "nodemailer";
import dns from "node:dns"; // Import thêm dns

import { Resend } from 'resend';
const resend = process.env.RESEND_API_KEY;

export const sendOTP = async (email, otp) => {
    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev', // Lúc đầu dùng tạm email này của nó
            to: email,
            subject: 'Mã OTP xác thực',
            html: `<strong>Mã OTP của bạn là: ${otp}</strong>`,
        });
        console.log("Gửi qua Resend thành công!");
    } catch (error) {
        console.error("Lỗi Resend:", error);
    }
};