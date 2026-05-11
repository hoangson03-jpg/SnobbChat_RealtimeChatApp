import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import { UserCache } from "../services/redisServices.js";
import redisClient from "../config/redis.js";
import User from "../models/User.js";

export const authMe = async (req, res) => {
    try {
        const user = req.user;

        return res.status(200).json({user})
    } catch (error) {
        console.error('Lỗi khi gọi AuthMe', error);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
}

export const test = async (req,res) => {
    return res.sendStatus(204);
}

export const searchUserByUsername = async (req, res) => {
    try {
        const {username} = req.query;

        if(!username || username.trim() === "") {
            return res.status(400).json({message: "Cần cung cấp username trong query"})
        }

        const cacheKey = `user:username:${username}`;

        // Kiểm tra cache trước khi truy vấn DB, nếu có thì trả về ngay, không cần đợi DB
        const cachedUser = await redisClient.get(cacheKey);

        if (cachedUser) {
            return res.status(200).json({ user: JSON.parse(cachedUser) }); // Trả về ngay lập tức
        }

        const user = await User.findOne({username}).select("_id displayName username avatarURL");

        if(user) {
            // set cache với TTL 1 giờ
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));
        }
        return res.status(200).json({user});
    } catch (error) {
        console.error("Lỗi xảy ra khi searchUserByUsername")
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
}

export const searchUsers = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        const currentUserId = req.user._id;

        const skip = (Number(page) - 1) * Number(limit);

        // Tìm user có username hoặc displayName chứa từ khóa, không phân biệt hoa thường
        const users = await User.find({
            _id: { $ne: currentUserId }, // Không tìm chính mình
            $or: [
                { username: { $regex: q, $options: "i" } },
                { displayName: { $regex: q, $options: "i" } }
            ]
        })
        .select('_id username displayName avatarURL')
        .skip(skip)
        .limit(Number(limit))
        .lean();

        // Kiểm tra xem còn data để load thêm không
        const hasMore = users.length === Number(limit);

        return res.status(200).json({ users, hasMore });
    } catch (error) {
        console.error("Lỗi tìm kiếm user:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
}

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if(!file) {
            return res.status(400).json({message: "No file uploaded"});
        }

        const result = await uploadImageFromBuffer(file.buffer);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { avatarURL: result.secure_url, avatarID: result.public_id },
            { new: true }
        ).select("avatarURL username");

        if(!updatedUser.avatarURL){
            return res.status(400).json({message: "Avatar trả về null"});
        }

        // Khi update thành công, phải xóa cache cũ đi 
        // để lần search sau nó lấy data mới có avatar mới
        await UserCache.invalidate(updatedUser.username);

        return res.status(200).json({avatarURL: updatedUser.avatarURL});
    } catch (error) {
        console.error("Lỗi xảy ra khi upload avatar", error);
        return res.status(500).json({message: "Avatar uploaded fail!"});
    }
}