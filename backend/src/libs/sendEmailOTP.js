import * as SibApiV3Sdk from '@getbrevo/brevo';
import dotenv from "dotenv";
dotenv.config();

export const sendOTP = async (email, otp) => {
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi(); // API client của Brevo
    
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    // 2. Tạo nội dung email
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Mã xác thực OTP - SnobbChat";
    sendSmtpEmail.htmlContent = `
        <html>
            <body>
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Xác thực tài khoản của bạn</h2>
                    <p>Mã OTP của bạn là: <b style="font-size: 24px; color: #3b82f6;">${otp}</b></p>
                    <p>Mã này có hiệu lực trong 10 phút.</p>
                </div>
            </body>
        </html>
    `;
    

    sendSmtpEmail.sender = { "name": "SnobbChat Support", "email": process.env.EMAIL_USER };
    

    sendSmtpEmail.to = [{ "email": email }];

    try {
        if (!process.env.BREVO_API_KEY) {
            throw new Error("BREVO_API_KEY chưa được cấu hình!");
        }

        console.log(`Đang gửi mail Brevo tới: ${email}`);
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Gửi thành công! Message ID:', data.messageId);
        
    } catch (error) {
        console.error("Lỗi gửi mail Brevo:");
        // In chi tiết lỗi từ Brevo để dễ debug
        if (error.response && error.response.body) {
            console.error(JSON.stringify(error.response.body, null, 2));
        } else {
            console.error(error.message);
        }
    }
};