require('dotenv').config();
const express = require('express');
const app = express();

// Chỉ giữ lại kết nối tới Models/Sequelize
const { sequelize } = require('./apps/models'); 

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Server đang chạy, vui lòng kiểm tra console để xem trạng thái CSDL.');
});

app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    
    try {
        // Kiểm tra kết nối
        await sequelize.authenticate();
        console.log('✅ Database connected successfully (SQL Server).');
      
        
    } catch (err) {
        console.error('❌ Database connection failed:');
        console.error(err.message);
    }
});