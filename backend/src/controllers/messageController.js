import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js';
import { emitNewMessage, updateConversationAfterCreateMessage } from '../utils/messageHelper.js';
import {v2 as cloudinary} from 'cloudinary';
import { io } from '../socket/index.js';
import { MessageCache } from '../services/redisServices.js';


export const sendDirectMessage = async (req, res) => {
    // console.log("Body received:", req.body);
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Request body không được để trống" });
        }
        const {recipientId, content, conversationId, tempId} = req.body; 
        const senderId = req.user._id;

        if(!content){
            return res.status(400).json({ message: "Thiếu nội dung"});
        }

        const tempMessage = {
            _id: `temp_${Date.now()}`, // ID tạm thời
            conversationId: conversationId || null,
            senderId,
            recipientId,
            content,
            createdAt: new Date(),
        };

        try {
            // THỬ LƯU VÀO MONGODB
            let conversation;
            if(conversationId) conversation = await Conversation.findById(conversationId);

            if(!conversation) {
                conversation = await Conversation.create({
                    type: 'direct',
                    participants:[{ userId: senderId, joinedAt: new Date() }, { userId: recipientId, joinedAt: new Date() }],
                    lastMessage: new Date(),
                    unreadCounts: new Map()
                });
                const members = [senderId, recipientId];
                members.forEach((id) => io.to(id.toString()).emit("new-conversation", { conversation }));
            }

            tempMessage.conversationId = conversation._id;
            const message = await Message.create({
                conversationId: conversation._id,
                senderId,
                recipientId,
                content
            });

            updateConversationAfterCreateMessage(conversation, message, senderId);
            await conversation.save();

            // Lưu vào Redis cache để load nhanh
            await MessageCache.cacheRecentMessages(conversation._id, message);
            emitNewMessage(io, conversation, message);

            return res.status(201).json({message});

        } catch (dbError) {
            console.error("Lỗi MongoDB, đẩy tin nhắn vào Redis Queue:", dbError);
            
            // XỬ LÝ KHI MẤT MẠNG DB: Đẩy vào Redis Queue
            await MessageCache.pushToOfflineQueue({
                type: 'direct',
                senderId,
                recipientId,
                content,
                conversationId: tempMessage.conversationId,
                tempId: tempMessage._id // Gửi kèm tempId để Frontend biết
            });

            // Vẫn emit socket cho client để UI không bị khựng
            io.to(senderId.toString()).emit("new-message-offline", { 
                message: tempMessage,
                status: 'pending_sync' 
            });

            return res.status(201).json({ message: tempMessage, status: 'queued' });
        }
    } catch (error) {
        console.error("Lỗi xảy ra khi gửi tin nhắn", error);
        return res.status(500).json({message:"Lỗi hệ thống"});
    }
};


export const sendGroupMessage = async (req, res) => {
    try {
        const {conversationId, content, tempId} = req.body;
        const senderId = req.user._id;
        const conversation = req.conversation; // middleware đã cung cấp

        if(!content) return res.status(400).json({message: "Thiếu nội dung"});

        try {
            // Để MongoDB tự tạo _id chuẩn
            const message = await Message.create({
                conversationId,
                senderId,
                content
            });

            updateConversationAfterCreateMessage(conversation, message, senderId);
            await conversation.save();

            emitNewMessage(io, conversation, message);

            return res.status(201).json({message});

        } catch (dbError) {
            console.error("Lỗi MongoDB, đẩy tin nhắn nhóm vào Redis Queue:", dbError.message);
            
            // Queue lưu lại
            await MessageCache.pushToOfflineQueue({
                type: 'group',
                senderId,
                content,
                conversationId: conversationId,
                tempId: tempId 
            });

            return res.status(201).json({ status: 'queued' });
        }
    } catch (error) {
        console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const sendImageMessage = async (req, res) => {
    try {
        const {conversationId, tempId} = req.body;
        if(!req.file) return res.status(400).json({message: "Không tìm thấy file ảnh tải lên"});

        const senderId = req.user._id;

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: "chat_images",
            resource_type: "image"
        });

        const imgURL = uploadResponse.secure_url;

        let conversation;
        if (conversationId && conversationId !== 'undefined') {
            conversation = await Conversation.findById(conversationId);
        }

        if (!conversation && type === 'direct') {
            conversation = await Conversation.create({
                type: 'direct',
                participants: [
                    { userId: senderId, joinedAt: new Date() }, 
                    { userId: recipientId, joinedAt: new Date() }
                ],
                lastMessage: new Date(),
                unreadCounts: new Map()
            });

            const members = [senderId, recipientId];
            members.forEach((id) => io.to(id.toString()).emit("new-conversation", { conversation }));
        }

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content: "Đã gửi một ảnh", // Fallback text cho thông báo/lastMessage
            imgURL: imgURL
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });

    } catch (error) {

        console.error("Lỗi khi upload và gửi ảnh:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi gửi ảnh" });

    }
}