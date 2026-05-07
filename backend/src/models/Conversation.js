import mongoose from "mongoose";

const participantsSchema = new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        clearedAt: {
        type: Date,
        default: null // null nghĩa là chưa bao giờ xóa
    }
    },
    {
        _id: false,
    }
);

const groupSchema = new mongoose.Schema({
        name: {
            type: String,
            trim: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        _id: false
    }
);

const lastMessageSchema = new mongoose.Schema({
        _id: {type: String},
        content: {
            type: String,
            default: null,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        createdAt: {
            type: Date,
            default: null
        }
    },
    {
        _id: false
    }
)

const conversationSchema = new mongoose.Schema({
        type: {
            type: String,
            enum: ["direct", "group"],
            required: true
        },
        participants: {
            type: [participantsSchema],
            required: true
        },
        group: {
            type: groupSchema,
        },
        lastMessageAt: {
            type: Date
        },
        seenBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        lastMessage: {
            type: lastMessageSchema,
            default: null
        },
        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        }
    },
    {
        timestamps: true
    }
);

 conversationSchema.index({
    "participants.userId": 1, 
    lastMessageAt: -1
});

const  Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation; 
