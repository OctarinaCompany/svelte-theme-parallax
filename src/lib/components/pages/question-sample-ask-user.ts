/**
 * The shape an agent's "ask the user" tool call carries — a question, a short header naming
 * what it is about, the choices with a line of context each, and whether more than one may be
 * picked. The Question page renders one of these to show the component covering a real tool
 * payload rather than hand-written options.
 */
export type AskUserQuestionOption = {
	/** The choice as the reader sees it — also the value the response carries. */
	label: string;
	/** One line saying what picking it means. */
	description: string;
};

export type AskUserQuestion = {
	/** The full question, in the prompt slot. */
	question: string;
	/** A two-or-three-word topic, rendered as the micro-label above the prompt. */
	header: string;
	options: AskUserQuestionOption[];
	/** `true` maps to `selectionMode="multiple"`. */
	multiSelect: boolean;
};

export const askUserQuestionSample: AskUserQuestion[] = [
	{
		question: "Which authentication method should the new API use?",
		header: "Auth method",
		multiSelect: false,
		options: [
			{
				label: "Session cookies",
				description: "Server-side sessions, simplest for a browser app.",
			},
			{
				label: "JWT bearer tokens",
				description: "Stateless, suits mobile and third-party clients.",
			},
			{
				label: "OAuth 2.0 with PKCE",
				description: "Delegated login through an identity provider.",
			},
		],
	},
	{
		question: "Which environments should the deployment pipeline target?",
		header: "Environments",
		multiSelect: true,
		options: [
			{ label: "Staging", description: "Deploys on every merge to main." },
			{ label: "Production", description: "Deploys on a tagged release, behind an approval." },
			{ label: "Preview", description: "One ephemeral environment per pull request." },
		],
	},
];
