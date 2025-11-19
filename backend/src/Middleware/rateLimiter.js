import ratelimit from "../Config/upstash.js";

const rateLimiter = async (req, res, next) => {
  try {
    // Allow CORS preflight requests to pass through
    if (req.method === "OPTIONS") {
      return next();
    }

    // Use a per-client identifier to avoid globally throttling all users
    const identifier = req.ip || req.headers["x-forwarded-for"] || "global";
    const { success } = await ratelimit.limit(`rate:${identifier}`);

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later",
      });
    }
    next();
  } catch (error) {
    console.log("Rate limit error", error);
    // Do not block requests if the rate limiter backend fails
    next();
  }
};

export default rateLimiter;
