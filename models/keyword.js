const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
    word: {
        type: String,
        required: true,
        unique: true
    },
    isApproved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Keyword', keywordSchema);