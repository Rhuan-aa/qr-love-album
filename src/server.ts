import { createStartHandler, defaultRenderHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

// Standard TanStack Start handler
const startHandler = createStartHandler({
  createRouter: getRouter,
  renderHandler: defaultRenderHandler,
});

// Explicitly export as 'handler' for Netlify/AWS Lambda compatibility
export const handler = async (event: any, context: any) => {
  // TanStack Start's handler is compatible with the Fetch API. 
  // We call it via its fetch-based entry point if needed, or directly if adapted.
  return startHandler(event, context);
};

export default startHandler;
