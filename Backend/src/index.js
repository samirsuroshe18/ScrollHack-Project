import dotenv from 'dotenv'
import connectDB from './database/database.js'
dotenv.config()
import app from './app.js';


connectDB().then(() => {
    app.listen(process.env.PORT || 8000, process.env.SERVER_HOST, async () => {
        console.log(`Server is running at on : http://${process.env.SERVER_HOST}:${process.env.PORT}`);
    })
}).catch((err) => {
    console.log('MongoDB Failed !!!', err);
});