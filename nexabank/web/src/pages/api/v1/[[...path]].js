// Unified NexaBank API Proxy (Next.js Page API)
import app from '../../../../../server/src/index';

export const config = {
  api: {
    bodyParser: false, // Let Express handle the body
    externalResolver: true, // Allow Express to send its own response
  },
};

export default (req, res) => {
  // Pass the request and response directly to the Express app
  return app(req, res);
};
