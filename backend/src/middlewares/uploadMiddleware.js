import multer from 'multer';
import { v2 as cloudinary} from 'cloudinary'

export const upload = multer({
    storage: multer.memoryStorage(), // khi dùng memory storage thì multer sẽ lưu file dưới dạng dữ liệu thô trong bộ nhớ RAM thay vì lưu file ở ổ đĩa cứng từ máy chủ
    //  Ram nhanh hơn đĩa cứng nhiều => tối ưu tốc độ khi gửi file từ RAM lên cloudinary
    limits: {
        fileSize: 1024*1024*2, // 1MB
    },
});

export const uploadImageFromBuffer = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: "snobbchat/avatars",
            resource_type: "image",
            transformation: [{width: 200, height: 200, crop: "fill"}],
            ...options
        },
        (error, result) => {
            if(error){
                reject(error);
            } else {
                resolve(result);
            }
        }
    );
    uploadStream.end(buffer);
    });
}