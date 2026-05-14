import { createStartHandler, defaultRenderHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

export const handler = createStartHandler({
  createRouter: getRouter,
  renderHandler: defaultRenderHandler,
});

export default handler;
