require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`📄 API docs at http://localhost:${PORT}/api/docs`);
  });
}).catch(err => {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
});
