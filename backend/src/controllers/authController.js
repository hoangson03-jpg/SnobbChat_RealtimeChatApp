import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
import { sendOTP } from '../libs/sendEmailOTP.js';

const ACCESS_TOKEN_TTL = "10M"; // thường là dưới 15 phút, nhưng hiện tại ta sẽ giữ là 30' vì sau này khi test API của chat app sẽ cần access token cho hầu như mọi API
// Thậm chí đối với app có độ bảo mật cao thì nó chỉ sống trong vòng 1 phút

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày 24 giờ 60 phút 60 giây 1000 mili giây 

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin!" });
        }

        // 1. Kiểm tra Email đã tồn tại chưa
        let existingUserByEmail = await User.findOne({ email });

        if (existingUserByEmail) {
            // Nếu email đã tồn tại và ĐÃ XÁC THỰC -> Chặn luôn
            if (existingUserByEmail.isVerified) {
                return res.status(409).json({ message: "Email này đã được sử dụng bởi một tài khoản khác!" });
            }
            // Nếu email đã tồn tại nhưng CHƯA XÁC THỰC -> Chúng ta sẽ dùng tiếp bản ghi này (Ghi đè bên dưới)
        }

        // 2. Kiểm tra Username đã tồn tại chưa
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            // Nếu username đã tồn tại và ĐÃ XÁC THỰC -> Chặn
            if (existingUserByUsername.isVerified) {
                return res.status(409).json({ message: "Tên đăng nhập đã tồn tại!" });
            }
            // Lưu ý: Nếu username này trùng với một tài khoản chưa xác thực của NGƯỜI KHÁC, 
            // chúng ta vẫn nên yêu cầu chọn username khác để tránh xung đột.
            if (existingUserByEmail && existingUserByEmail.username !== username) {
                 return res.status(409).json({ message: "Tên đăng nhập này đang được chờ xác thực bởi một email khác!" });
            }
        }

        // 3. Chuẩn bị dữ liệu mới
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 phút

        if (existingUserByEmail) {
            // --- CÁCH 2: GHI ĐÈ ---
            existingUserByEmail.username = username;
            existingUserByEmail.hashedPassword = hashedPassword;
            existingUserByEmail.displayName = `${firstName} ${lastName}`;
            existingUserByEmail.verificationOTP = otp;
            existingUserByEmail.otpExpiresAt = otpExpiresAt;
            
            await existingUserByEmail.save();
            console.log("Đã cập nhật (ghi đè) tài khoản chưa xác thực cũ");
        } else {
            // --- TẠO MỚI HOÀN TOÀN ---
            await User.create({
                username,
                hashedPassword,
                email,
                displayName: `${firstName} ${lastName}`,
                verificationOTP: otp,
                otpExpiresAt: otpExpiresAt,
                isVerified: false
            });
            console.log("Đã tạo tài khoản mới");
        }

        // 4. Gửi Email OTP
        await sendOTP(email, otp);

        return res.status(201).json({
            message: "Mã xác thực đã được gửi đến email của bạn!",
            email: email
        });

    } catch (error) {
        console.error('Lỗi khi gọi signup', error);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};

export const signIn = async (req ,res) => {
    try {
        // Lấy inputs
        const {username, password} = req.body;

        if(!username || !password){
            return res.status(400).json({message: "Vui lòng không để trống thông tin đăng nhập!"}) ;
        } 

        const userFind = await User.findOne({username})

        if(!userFind){
            return res.status(401).json({message: "username không đúng. Xin hãy kiểm tra lại"});
        }

        if (!userFind.isVerified) {
        return res.status(403).json({ message: "Tài khoản chưa được xác thực email. Vui lòng xác thực trước." });
        }  

        // Kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, userFind.hashedPassword);
        

        if (!passwordCorrect) {
            return res.status(401).json({message: "password không đúng"});
        }

        // nếu khớp, tạo accessToken với JWT
        const accessToken = jwt.sign({userId: userFind._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL})

        // tạo refresh token
        const refreshToken = crypto.randomBytes(64).toString('hex');

        // tạo session mới để lưu refresh token
        await Session.create({
            userId: userFind._id,
            refreshToken,
            expiredAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });

        // trả refresh token về trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, // Chặn javascript truy cập
            secure: true, // Đảm bảo chỉ gửi qua https
            sameSite: 'none', // cho phép backend, frontend chạy trên 2 domain khác nhau
            maxAge: REFRESH_TOKEN_TTL, // Thời hạn của token
        });

        // trả access token trong response
        return res.status(200).json({message: `${userFind.displayName} đã đăng nhập`, accessToken});
        
    } catch (error) {
        console.error("Lỗi khi gọi signIn", error);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
};

export const signOut = async (req, res) => { 
    try {
        // lấy refresh token từ cookie
        const token = req.cookies?.refreshToken;

        if(token){

        // xóa refresh token trong Session
            await Session.deleteOne({refreshToken: token});

        // xóa refresh token trong Session
            res.clearCookie("refreshToken");

            return res.status(200).json({message: "Đăng xuất thành công"});
        }

        return res.sendStatus(204); 
    } catch (error) {
        console.error("Lỗi khi gọi signOut", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
}

// Tạo access token mới từ refresh token
export const refreshToken = async (req, res) => {
    try {
        // lấy refresh token từ cookie 
        const token = req.cookies?.refreshToken;
        if(!token){
            return res.status(401).json({message: "Token không tồn tại"});
        }

        // so sánh với refresh token trong db
        const session = await Session.findOne({refreshToken: token});
        if (!session){
            return res.status(403).json({message: "Token không hợp lệ hoặc đã hết hạn"});
        }
        
        // kiểm tra refresh token hết hạn chưa
        if(session.expiredAt < new Date()){
            return res.status(403).json({message: "Token đã hết hạn"});
        }

        // tạo access token mới
        const accessToken = jwt.sign(
            {userId: session.userId},
            process.env.ACCESS_TOKEN_SECRET, 
            {expiresIn: ACCESS_TOKEN_TTL});

        // trả access token mới
        return res.status(200).json({accessToken})

        } catch (error) {
        console.error("Lỗi khi gọi refreshToken");
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
}

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Vui lòng cung cấp email và mã OTP" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Tài khoản này đã được xác thực rồi" });
        }

        if (user.verificationOTP !== otp) {
            return res.status(400).json({ message: "Mã OTP không chính xác" });
        }

        if (user.otpExpiresAt < new Date()) {
            return res.status(400).json({ message: "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới" });
        }

        // Nếu đúng hết -> Cập nhật trạng thái
        user.isVerified = true;
        user.verificationOTP = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        return res.status(200).json({ message: "Xác thực email thành công! Bây giờ bạn có thể đăng nhập." });

    } catch (error) {
        console.error("Lỗi khi verify OTP", error);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};

export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
        if (user.isVerified) return res.status(400).json({ message: "Tài khoản đã xác thực rồi" });

        // Tạo mã mới
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationOTP = newOtp;
        user.otpExpiresAt = new Date(Date.now() + 1 * 60 * 100); // 1 phút nữa
        await user.save();

        // Gửi lại mail
        await sendOTP(email, newOtp);

        return res.status(200).json({ message: "Mã OTP mới đã được gửi!" });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống khi gửi lại mã" });
    }
};