import { createStartHandler, defaultRenderHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

const handler = createStartHandler({
  createRouter: getRouter,
  renderHandler: defaultRenderHandler,
});

// Dual compatibility export
const server = Object.assign(handler, { fetch: handler });

export default server;
