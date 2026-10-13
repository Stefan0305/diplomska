export {};

declare global {
  namespace Express {
    interface Request {
      /** Set by the requireAuth middleware for authenticated requests. */
      userId?: string;
    }
  }
}
