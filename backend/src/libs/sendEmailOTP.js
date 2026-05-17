import dotenv from "dotenv";
dotenv.config();

export const sendOTP = async (email, otp) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            console.error("LỖI: BREVO_API_KEY chưa được cấu hình.");
            return;
        }

        console.log(`Đang gửi mail tới: ${email} qua Brevo API...`);

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: "SnobbChat Support",
                    email: process.env.EMAIL_USER // Email bạn dùng đăng ký Brevo
                },
                to: [
                    {
                        email: email
                    }
                ],
                subject: "Mã OTP xác thực - SnobbChat",
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                        <h2 style="color: #3b82f6;">Xác thực tài khoản</h2>
                        <p>Chào bạn,</p>
                        <p>Mã OTP của bạn là:</p>
                        <div style="background: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; color: #333;">
                            ${otp}
                        </div>
                        <p>Mã này có hiệu lực trong 10 phút. Đừng chia sẻ với bất kỳ ai.</p>
                        <p>Trân trọng,<br>Đội ngũ SnobbChat</p>
                    </div>
                `
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("GỬI MAIL THÀNH CÔNG! Message ID:", result.messageId);
        } else {
            console.error("LỖI TỪ BREVO API:", result);
        }

    } catch (error) {
        console.error("LỖI HỆ THỐNG KHI GỬI MAIL:", error.message);
    }
};