import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {

    try {

        const transporter = nodemailer.createTransport({

            host: "74.125.68.108", // Host cứng của google mail để tránh lỗi ipv6 không hỗ trợ

            port: 587,

            secure: false,

            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },

            tls: {
                servername: "smtp.gmail.com"
            }
        });

        await transporter.verify();

        console.log("SMTP READY");

        await transporter.sendMail({

            from: `"SnobbChat Support" <${process.env.EMAIL_USER}>`,

            to: email,

            subject: "OTP xác thực",

            html: `<h1>${otp}</h1>`

        });

        console.log("MAIL SENT");

    } catch (err) {

        console.error(err);

    }
};