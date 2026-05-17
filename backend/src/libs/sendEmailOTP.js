import nodemailer from 'nodemailer';
import dotenv from "dotenv";

export const sendOTP = async (email, otp) => {
    try {
        console.log("kiem tra email:", process.env.EMAIL_USER);
        
        const transporter = nodemailer.createTransport({
            // service: 'gmail',
            
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, 
            
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS 
            },
            // Bây giờ family: 4 mới thực sự có tác dụng!
            family: 4
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
        console.log("Đã gửi OTP thành công đến email:", email);
    } catch (error) {
        console.error("Lỗi khi gửi email:", error);
        throw error; 
    }
};