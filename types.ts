export const elements = ["grass","none","fire","water","electric","psychic","fighting","dark","steel","dragon","void"];
export type Element = (typeof elements)[number];
export type Card = {
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
			};