const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const Schema = mongoose.Schema;

// Đây chỉ là transaction cho thanh toán & chuyển khoản
// không có giao dịch hay gì liên quan đến nợ nần
const nofifySchema = new Schema(
	{
        notify_id: Number,
        sender_account_number: String,
        sender_fullname : String,
        receiver_account_number: String,
        receiver_fullname: String,
        message: String,    // Nội dung cần chuyển, Ví dụ: "gửi trả nợ cho ông A"
        created_at: String
    }
);

notifySchema.plugin(AutoIncrement, { inc_field: 'notify_id' });

module.exports = mongoose.model("Notify", notifySchema);


