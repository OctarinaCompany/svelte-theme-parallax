/**
 * The payload both JSON viewer demos render, transcribed from upstream's
 * `json-viewer-demo.tsx:6-38` — the two demos there declare the same object twice.
 *
 * It is not arbitrary: every field exercises one branch of the renderer, which is why it is kept
 * verbatim rather than replaced with something shorter.
 *
 *   `website`             an `http(s)` string, which renders as a link
 *   `primaryColor`        a hex literal, which renders with a swatch
 *   `secondaryColor`      an `rgb()` literal, the other colour syntax
 *   `createdAt`           a millisecond epoch inside the 2000-2100 window, annotated as a date
 *   `updatedAt`           an ISO string, annotated the same way
 *   `isActive` / `null`   the boolean and null inks
 *   `description`         past 180 characters, so it clamps behind a Show more toggle
 *   `topping`             seven items, so array truncation has something to cut
 *
 * `example.com` is IANA's reserved documentation domain and resolves to nothing; the viewer never
 * fetches it either way — the value is only ever rendered as an `href`.
 */
export const jsonViewerSampleData = {
	id: "0001",
	type: "donut",
	name: "Cake",
	ppu: 0.55,
	website: "https://example.com/donuts/cake",
	primaryColor: "#FF5733",
	secondaryColor: "rgb(255, 255, 255)",
	createdAt: 1709251200000,
	updatedAt: "2026-03-06T12:00:00.000Z",
	isActive: true,
	isGlutenFree: false,
	discontinued: null,
	description:
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. In lobortis tellus eu justo hendrerit, a viverra turpis aliquam. Morbi sollicitudin accumsan lectus, eget sollicitudin magna tempus et. Cras fringilla risus sed libero consequat faucibus. Nulla facilisi. Quisque pretium, lorem id dignissim iaculis, est sem aliquet risus, sed suscipit elit sem sit amet dui. Vivamus tempor orci nec imperdiet molestie. Integer elit ex, elementum sed libero vitae, varius porta nisi.",
	batters: {
		batter: [
			{ id: "1001", type: "Regular" },
			{ id: "1002", type: "Chocolate" },
			{ id: "1003", type: "Blueberry" },
			{ id: "1004", type: "Devil's Food" },
		],
	},
	topping: [
		{ id: "5001", type: "None" },
		{ id: "5002", type: "Glazed" },
		{ id: "5005", type: "Sugar" },
		{ id: "5007", type: "Powdered Sugar" },
		{ id: "5006", type: "Chocolate with Sprinkles" },
		{ id: "5003", type: "Chocolate" },
		{ id: "5004", type: "Maple" },
	],
};
