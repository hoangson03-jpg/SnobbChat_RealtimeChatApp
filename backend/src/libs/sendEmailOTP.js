import nodemailer from 'nodemailer';
import dotenv from "dotenv";


export const sendOTP = async (email, otp) => {
    try {
        console.log("kiem tra email:", process.env.EMAIL_USER);

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,

            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },

            tls: {
                family: 4
            }
        });

        const mailOptions = {
            from: `"SnobbChat Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Mã xác thực tài khoản SnobbChat',
            html: `
                <h2>Chào mừng bạn đến với SnobbChat!</h2>
                <p>Mã xác thực (OTP) của bạn là: <strong>${otp}</strong></p>
                <p>Mã này sẽ hết hạn trong vòng 1 phút.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        console.log("Đã gửi OTP thành công đến:", email);

    } catch (error) {
        console.error("Lỗi khi gửi email:", error);
        throw error;
    }
};