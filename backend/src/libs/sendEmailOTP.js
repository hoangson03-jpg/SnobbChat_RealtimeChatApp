import nodemailer from 'nodemailer';
import dotenv from "dotenv";

export const sendOTP = async (email, otp) => {
    try {

        console.log("kiem tra email:", process.env.EMAIL_USER);
        console.log("kiem tra pass:", process.env.EMAIL_PASS ? "Đã có mật khẩu" : "BỊ UNDEFINED");
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Email của bạn (VD: ban@gmail.com)
                pass: process.env.EMAIL_PASS  // Mật khẩu ứng dụng (App Password)
            }
        });

        const mailOptions = {
            from: `"SnobbChat Support"`,
            to: email,
            subject: 'Mã xác thực tài khoản SnobbChat',
            html: `
                <h2>Chào mừng bạn đến với SnobbChat!</h2>
                <p>Mã xác thực (OTP) của bạn là: <strong>${otp}</strong></p>
                <p>Mã này sẽ hết hạn trong vòng 1 phút. Vui lòng không chia sẻ mã này cho ai.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("Đã gửi OTP đến email:", email);
    } catch (error) {
        console.error("Lỗi khi gửi email:", error);
    }
};