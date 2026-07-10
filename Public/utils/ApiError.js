class ApiError extends Error {
    constructor(
        statuscode,
        message = "Internal Server Error",
        error = [],
        stack = ""

   ){
    super(message)
    this.statusCode = statuscode
    this.error = error
    this.stack = stack
    this.data = null
    this.message = message
    this.success = false

    if (stack) {
        this.stack = stack
    } else{
        Error.captureStackTrace(this, this.constructor)
    }

   }
}

export {ApiError}