import nodemailer from "nodemailer";
import dns from "node:dns"; // Import thêm dns

export const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465, // Chuyển sang port 465 ổn định hơn cho SSL
            secure: true, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // LỚP KHÓA 1: Ép dùng IPv4 ở mức socket
            family: 4, 
            // LỚP KHÓA 2: Ép DNS chỉ tìm địa chỉ IPv4
            lookup: (hostname, options, callback) => {
                dns.lookup(hostname, { family: 4 }, callback);
            }
        });

        console.log("Đang gửi mail tới:", email);

        const info = await transporter.sendMail({
            from: `"SnobbChat Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Mã OTP xác thực",
            text: `Mã OTP của bạn là: ${otp}`,
            html: `<b>Mã OTP của bạn là: ${otp}</b>`
        });

        console.log("Gửi thành công! Message ID:", info.messageId);
    } catch (err) {
        console.error("LỖI GỬI MAIL CHI TIẾT:", err);
    }
};