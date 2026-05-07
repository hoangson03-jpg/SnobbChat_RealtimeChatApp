const emojiMap: Record<string, string> = {
    ":)": "🙂",
    ":-)": "🙂",
    ":(": "☹️",
    ":-(": "☹️",
    ":D": "😀",
    ":-D": "😀",
    "XD": "😆",
    "<3": "❤️",
    "B)": "😎",
    ":P": "😛",
    ":-P": "😛",
    ";)": "😉",
    "o.O": "😳",
    ":O": "😮",
    ":'(": "😭",
};

export const replaceTextWithEmoji = (text: string): string => {
    if (!text) return "";

    let result = text;

    // Duyệt qua từng cặp trong map để xử lý riêng biệt
    Object.entries(emojiMap).forEach(([emoticon, emoji]) => {
        // Escape các ký tự đặc biệt như ( ) . * + ?
        const escaped = emoticon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        
        let regex: RegExp;

        // LOGIC ĐẶC BIỆT:
        // Nếu emoticon kết thúc bằng ')', '(', hoặc 'D' 
        // ta dùng Negative Lookahead (?!...) để đảm bảo đằng sau nó không có ký tự đó lặp lại
        if (emoticon.endsWith(')')) {
            regex = new RegExp(`${escaped}(?!\\))`, 'g');
        } else if (emoticon.endsWith('(')) {
            regex = new RegExp(`${escaped}(?!\\()`, 'g');
        } else if (emoticon.endsWith('D')) {
            regex = new RegExp(`${escaped}(?!D)`, 'g');
        } else {
            regex = new RegExp(`${escaped}`, 'g');
        }

        result = result.replace(regex, emoji);
    });

    return result;
};