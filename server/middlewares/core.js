// Response Handler
// Standard Response : 
// {
//     : "success" | "error",
//     message: "message", (on success)
//     data: {}
// }
const responseHandler = (req, res, next) => {
    res.sendResponse = (message, data, status = 200) => {
        const responseStatus = status >= 200 && status < 203 ? "success" : "error";
        return res.status(status).json({ status: responseStatus, message, data });
    };

    res.sendError = (message, status = 400) => {
        throw new Error(message, status);
    };

    next();
};

const errorHandler = (err, req, res, next) => {
    res.status(err.status || 500).json({ 
        message: err.message || "Something went wrong.", 
        status: "error"
    });
};

export { responseHandler, errorHandler };