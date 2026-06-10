import multer from 'multer';

const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the full error for debugging

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
        }
    }
    
    if (err.message === 'Invalid file type. Only JPEG, PNG, and GIF are allowed.') {
        return res.status(400).json({ message: err.message });
    }

    // For any other kind of error, send a generic 500 response
    return res.status(500).json({ message: 'Something went wrong on the server.', error: err.message });
};

export default errorHandler;
