import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // false cho port 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false // Bỏ qua kiểm tra chứng chỉ nếu cần
            }
        });

        console.log("Đang gửi mail tới:", email);

        const info = await transporter.sendMail({
            from: `"SnobbChat Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Mã OTP xác thực",
            text: `Mã OTP của bạn là: ${otp}`, // Thêm cả text thuần
            html: `<b>Mã OTP của bạn là: ${otp}</b>`
        });

        console.log("Gửi thành công! Message ID:", info.messageId);
    } catch (err) {
        console.error("LỖI GỬI MAIL CHI TIẾT:", err);
    }
};