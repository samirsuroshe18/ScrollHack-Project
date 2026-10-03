// must stay first: ES imports are hoisted, and the modules below read process.env
import 'dotenv/config';
import http from 'http';
import connectDB from './database/database.js';
import app from './app.js';
import { initSocket } from './socket.js';

// REST and chat share one HTTP server
const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
    server.listen(process.env.PORT || 8000, process.env.SERVER_HOST, async () => {
        console.log(`Server is running at on : http://${process.env.SERVER_HOST}:${process.env.PORT}`);
    })
}).catch((err) => {
    console.log('MongoDB Failed !!!', err);
});
