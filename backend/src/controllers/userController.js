import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
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

        const user = await User.findOne({username}).select("_id displayName username avatarURL");

        return res.status(200).json({user});
    } catch (error) {
        console.error("Lỗi xảy ra khi searchUserByUsername")
        return res.status(500).json({message: "Lỗi hệ thống!"});
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
            {
                avatarURL: result.secure_url,
                avatarID: result.public_id
            },
            {
                new: true,
            }
        ).select("avatarURL");

        if(!updatedUser.avatarURL){
            return res.status(400).json({message: "avatar trả về null"});
        }

        return res.status(200).json({avatarURL: updatedUser.avatarURL});
    } catch (error) {
        console.error("Lỗi xảy ra khi upload avatar", error);
        return res.status(500).json({message: "Avatar uploaded fail!"});
    }
}