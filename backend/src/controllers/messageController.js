import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js';
import { emitNewMessage, updateConversationAfterCreateMessage } from '../utils/messageHelper.js';
import { io } from '../socket/index.js';


export const sendDirectMessage = async (req, res) => {
    // console.log("Body received:", req.body);
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Request body không được để trống" });
        }
        const {recipientId, content, conversationId} = req.body;
        const senderId = req.user._id;

        let conversation;

        if(!content){
            return res.status(400).json({ message: "Thiếu nội dung"});
        }

        if(conversationId){
            conversation = await Conversation.findById(conversationId);
        }

        if(!conversation) {
           conversation = await Conversation.create({
            type: 'direct',
            participants: [{
                userId: senderId,
                joinedAt: new Date()
            },
            {
                userId: recipientId,
                joinedAt: new Date()       
            }],
        lastMessage: new Date(),
        unreadCounts: new Map()
           }) 
           const members = [senderId, recipientId];

   members.forEach((id) => {
     io.to(id.toString()).emit("new-conversation", {
       conversation
     });
   });
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            recipientId,
            content,
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);

        await conversation.save();

        emitNewMessage(io, conversation, message);

        return res.status(201).json({message});
    } catch (error) {
        console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
        return res.status(500).json({message:"Lỗi hệ thống"});
    }
};


export const sendGroupMessage = async (req, res) => {
    try {
        const {conversationId, content} = req.body;
        const senderId = req.user._id
        const conversation = req.conversation; // được truyền vào từ Friend middleware

        if(!content){
            return res.status(400).json({message: "Thiếu nội dung"});
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content
        })

        updateConversationAfterCreateMessage(conversation, message, senderId);

        await conversation.save();

        emitNewMessage(io, conversation, message);

        return res.status(201).json({message});

    } catch (error) {
        console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
    
};