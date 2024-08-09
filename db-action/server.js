const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { router } = require('./routers/router'); // Убедитесь, что путь правильный
const helmet = require('helmet')
const app = express();

app.use(helmet())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
  origin: "http://127.0.0.1:5000",
  credentials: true
}));

app.use(router);


app.listen(5001, () => {
  console.log('Server is running on port 5001');
});