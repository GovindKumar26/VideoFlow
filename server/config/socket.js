let ioInstance = null;

export const setSocketServer = (io) => {
    ioInstance = io;
};

export const getSocketServer = () => ioInstance;

export const emitToUser = (userId, eventName, payload) => {
    if (!ioInstance || !userId) {
        return false;
    }

    ioInstance.to(`user:${userId}`).emit(eventName, payload);
    return true;
};
