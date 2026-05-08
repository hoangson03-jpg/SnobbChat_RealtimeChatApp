import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = "10M"; // thường là dưới 15 phút, nhưng hiện tại ta sẽ giữ là 30' vì sau này khi test API của chat app sẽ cần access token cho hầu như mọi API
// Thậm chí đối với app có độ bảo mật cao thì nó chỉ sống trong vòng 1 phút

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày 24 giờ 60 phút 60 giây 1000 mili giây 

export const signUp = async (req, res) => {
    console.log("🔥 API signup được gọi");
    try {
        const {username, password, email, firstName, lastName} = req.body;

        if(!username || !password || !email || !firstName || !lastName){
            return res.status(400).json({message: "Không thể thiếu username, password, email, firstname, lastname"});
        }

        // Kiểm tra username tồn tại chưa
        const duplicate = await User.findOne({username});

        // Kiểm tra email tồn tại chưa
        const emailDuplicate = await User.findOne({email});

        if (duplicate){
            return res.status(409).json({message: "username đã tồn tại!"})
        }

        if (emailDuplicate){
            return res.status(409).json({message: "email đã tồn tại!"})
        }

        // mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10) // 10 ở đây là số lần bcrypt thực hiện việc mã hóa lặp đi lặp lại để ra được chuỗi mã hóa cuối cùng
        // Trước khi tiến hành mã hóa bcrypt sẽ tiến hành tạo ra một chuỗi ngẫu nhiên gọi là salt và trộn với password gốc rồi thực hiện mã hóa nhiều lần
        // Số 10 có nghĩa là 2^10 lần mã hóa


        // tạo user
        const newUser = await User.create({
            username,
            hashedPassword: hashedPassword, // Lưu ý: hãy kiểm tra tên field trong Model của bạn là 'password' hay 'hashedPassword' nhé
            email,
            displayName: `${firstName} ${lastName}`
        });

        // return
        return res.status(201).json({
            message: "Đăng ký thành công",
            user: {
                id: newUser._id,
                username: newUser.username
            }
        });
    } catch (error) {
        console.error('Lỗi khi gọi signup', error);
        return res.status(500).json({
        message: "Lỗi hệ thống!",
        dev_message: error.message, 
        error_code: error.code      
    });
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
