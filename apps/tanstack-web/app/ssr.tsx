import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import "./styles.css";

import { createRouter } from "./router";

export default createStartHandler({
	createRouter,
	getRouterManifest,
})(defaultStreamHandler);
