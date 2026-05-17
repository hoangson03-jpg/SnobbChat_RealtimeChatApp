import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", // Dùng host thay vì service
            port: 465,              // Port 465 (SSL)
            secure: true,           // Bắt buộc true cho port 465
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // Cấu hình quan trọng nhất ở đây:
            family: 4 
        });

        // Thêm log để kiểm tra khi chạy trên Render
        console.log("Đang gửi mail tới:", email);

        await transporter.sendMail({
            from: `"SnobbChat Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "OTP xác thực",
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2>Mã OTP của bạn</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #4CAF50;">${otp}</p>
                    <p>Mã này sẽ hết hạn sau 2 phút.</p>
                </div>
            `
        });

        console.log("MAIL SENT SUCCESS via IPv4");
    } catch (err) {
        console.error("LỖI GỬI MAIL CHI TIẾT:", err);
    }
};