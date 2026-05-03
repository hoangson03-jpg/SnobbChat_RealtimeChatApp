# SnobbChat_RealtimeChatApp
This is my first realtime chat app. It's still going on update
# Realtime Chat Application

## Giới thiệu

Đây là một ứng dụng chat realtime fullstack cho phép người dùng:

- Đăng ký / đăng nhập
- Kết bạn và quản lý danh sách bạn bè
- Tạo cuộc trò chuyện (direct và group)
- Gửi và nhận tin nhắn theo thời gian thực
- Theo dõi trạng thái online
- Đánh dấu đã xem (seen) và số tin chưa đọc (unread)

Ứng dụng được xây dựng với kiến trúc tách biệt frontend và backend, sử dụng WebSocket để xử lý realtime.

---

## Công nghệ sử dụng

### Frontend
- React + TypeScript
- Zustand (state management)
- Socket.IO Client
- TailwindCSS
- Infinite Scroll

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- Cloudinary (upload avatar)
- Multer (xử lý file)

---

## Kiến trúc tổng thể

### Frontend (Client)
- Quản lý state bằng Zustand:
  - useAuthStore: xác thực
  - useChatStore: hội thoại + tin nhắn
  - useSocketStore: socket + online users
  - useFriendStore: bạn bè

- Giao tiếp với backend qua:
  - REST API (axios)
  - WebSocket (socket.io)

---

### Backend (Server)

- REST API:
  - Auth
  - User
  - Friend
  - Conversation
  - Message

- Socket.IO:
  - Xác thực socket bằng middleware
  - Quản lý user online
  - Join room theo:
    - userId
    - conversationId

---

## Realtime Flow

### 1. Kết nối socket

Khi user đăng nhập:
- Client gửi accessToken qua socket
- Server xác thực và lưu:
  - userId -> socketId

- User join:
  - room userId
  - tất cả conversation mà user tham gia

---

### 2. Gửi tin nhắn

Frontend:
- Gọi API send message

Backend:
- Tạo message
- Cập nhật conversation:
  - lastMessage
  - unreadCounts
  - seenBy

- Emit sự kiện:
  - new-message

---

### 3. Nhận tin nhắn

Client lắng nghe:

- new-message:
  - thêm message vào store
  - update conversation
  - nếu đang mở chat thì markAsSeen

---

### 4. Tạo cuộc trò chuyện

Backend emit:
- new-conversation (direct)
- new-group (group)

Client:
- addConvo vào store
- tự động hiển thị trên UI

---

### 5. Đã xem tin nhắn

Khi user mở chat:
- Gọi API markAsSeen

Backend:
- update seenBy
- reset unreadCounts

- Emit:
  - read-message

Client:
- cập nhật trạng thái seen

---

## Quản lý trạng thái (Zustand)

### Chat State

- conversations: danh sách hội thoại
- messages: lưu theo conversationId
- activeConversationId

Các action chính:
- fetchConversations
- fetchMessages
- sendDirectMessage
- sendGroupMessage
- addMessage
- updateConversation
- markAsSeen
- createConversation

---

### Socket State

- socket instance
- onlineUsers

Các event:
- connect
- online-users
- new-message
- read-message
- new-group
- new-conversation

---

## Upload avatar

- Sử dụng multer memory storage
- Upload buffer trực tiếp lên Cloudinary
- Resize ảnh trước khi lưu

---

## Các vấn đề đã xử lý

### 1. Duplicate message
- Kiểm tra `_id` trước khi thêm vào store

### 2. Không nhận realtime
- Emit theo cả:
  - conversationId
  - userId

### 3. Conversation mới không hiển thị
- Thêm listener `new-conversation`

### 4. Trạng thái seen không cập nhật
- Đồng bộ qua socket `read-message`

---

## Chạy dự án

### Backend

```bash
npm install
npm run dev