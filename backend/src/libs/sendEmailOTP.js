import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },

            family: 4 
        });

        await transporter.sendMail({
            from: `"SnobbChat Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "OTP xác thực",
            html: `<h1>Mã OTP của bạn là: ${otp}</h1>`
        });

        console.log("MAIL SENT SUCCESS via IPv4");
    } catch (err) {
        console.error("LỖI GỬI MAIL:", err);
    }
};