import fs from "node:fs";
import { getCards } from "./scrapper";

getCards().then((cards) => {
	const elements = new Set();

	for (const card of cards) {
		elements.add(card.element);
		for (const a of card.attacks) for (const e of a.cost) elements.add(e);
	}

	fs.writeFileSync(
		__dirname + "/../types.ts",
		"" +
			`export const elements = ${JSON.stringify([...elements.keys()])};` +
			"\n" +
			`export type Element = (typeof elements)[number];` +
			"\n" +
			`export type Card = {
	      cardId: string;
				name: string;
        element: Element;
        health: number;
        numero: number | undefined;
        attacks: {
            name: string;
            damage: string;
            effect: string;
            cost: Element[];
        }[];
			};`,
	);
	fs.writeFileSync(
		__dirname + "/../cards.json",
		JSON.stringify(
			{
				generatedDate: new Date().toISOString().slice(0, 10),
				cards: cards.sort(
					(a, b) => (a.numero ?? Infinity) - (b.numero ?? Infinity),
				),
			},
			null,
			2,
		),
	);
});
