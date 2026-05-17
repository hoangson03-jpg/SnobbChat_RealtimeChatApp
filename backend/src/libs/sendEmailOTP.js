import { TransactionalEmailsApi, SendSmtpEmail, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import dotenv from "dotenv";
dotenv.config();

export const sendOTP = async (email, otp) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            console.error("LỖI: BREVO_API_KEY chưa được cấu hình trong Environment.");
            return;
        }

        const apiInstance = new TransactionalEmailsApi(); // API

        apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY); // API config

        const sendSmtpEmail = new SendSmtpEmail(); // email data

        sendSmtpEmail.subject = "Mã xác thực OTP - SnobbChat";
        sendSmtpEmail.htmlContent = `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                        <h2 style="color: #3b82f6;">Xác thực tài khoản của bạn</h2>
                        <p>Chào bạn,</p>
                        <p>Mã OTP để hoàn tất đăng ký SnobbChat là:</p>
                        <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; text-align: center; background: #f1f5f9; padding: 10px; border-radius: 8px;">
                            ${otp}
                        </p>
                        <p>Mã này có hiệu lực trong <b>10 phút</b>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #64748b;">Đây là email tự động, vui lòng không phản hồi.</p>
                    </div>
                </body>
            </html>
        `;

        sendSmtpEmail.sender = { 
            name: "SnobbChat Support", 
            email: process.env.EMAIL_USER 
        };

        sendSmtpEmail.to = [{ email: email }];

        console.log(`Đang gửi mail qua Brevo tới: ${email}...`);

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail); // call brevo API
        
        console.log("Gửi thành công! Message ID:", result.body.messageId);

    } catch (error) {
        console.error("LỖI GỬI MAIL BREVO:");
        
        if (error.response && error.response.body) {
            console.error("Chi tiết lỗi API:", JSON.stringify(error.response.body, null, 2));
        } else {
            console.error("Thông báo lỗi:", error.message);
        }
    }
};