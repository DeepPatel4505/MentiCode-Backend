/**
 * Wraps an async Express route handler and forwards any errors to next().
 * @param {(req, res, next) => Promise<void>} fn
 * @returns {(req, res, next) => void}
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
