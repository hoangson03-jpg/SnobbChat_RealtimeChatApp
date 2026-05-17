export const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Không nhất thiết phải transporter.verify() mỗi lần gửi để giảm độ trễ
        
        await transporter.sendMail({
            from: `"SnobbChat Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "OTP xác thực",
            html: `<h1>Mã OTP của bạn là: ${otp}</h1>`
        });

        console.log("MAIL SENT TO:", email);
    } catch (err) {
        console.error("LỖI GỬI MAIL:", err);
    }
};