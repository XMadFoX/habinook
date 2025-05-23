import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<div className="p-2">
			<h3 className="text-red-500">Welcome Home!</h3>
			<Button>dsfs</Button>
		</div>
	);
}
