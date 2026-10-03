import { User } from '../models/user.model.js';
import { disconnectUser } from '../socket.js';

// Ends every session of a user: access tokens issued so far stop being accepted,
// the refresh token is forgotten and open chat connections are closed.
// Used on logout and after a password reset.
const endSessions = async (userId) => {
    await User.updateOne(
        { _id: userId },
        { $inc: { tokenVersion: 1 }, $unset: { refreshToken: 1 } }
    );

    disconnectUser(userId);
};

export { endSessions }
