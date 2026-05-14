import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true, // bắt buộc phải điền
        unique: true, // độc nhất
        trim: true, // bỏ khoảng trắng
        lowercase: true
    },
    hashedPassword:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    displayName:{
        type: String,
        required: true,
    },
    avatarURL:{
        type: String // Lưu CDN để hiển thị hình
    },
    avatarID:{
        type: String // Cloudinary public_id để xóa ảnh trên Cloudinary
    },
    bio:{
        type: String,
        maxlength: 1000,
    },
    phone:{
        type: String,
        sparse: true, // cho phép giá trị để trống nhưng nếu nhập giá trị thì phải đảm bảo là không bị trùng
        trim: true
    },
    isVerified: { // trạng thái xác thực khi gửi email xác thực hoặc OTP
        type: Boolean,
        default: false 
    },
    verificationOTP: { // Lưu mã OTP
        type: String 
    },
    otpExpiresAt: { // Lưu thời gian hết hạn OTP (VD: 10 phút)
        type: Date 
    },
    }, // Phần 2 của schema là cấu hình
    {
        timestamps: true // Mongoose sẽ tạo 2 trường CreatedAt và UpdatedAt
    }
);

const User = mongoose.model("User", userSchema);
export default User;