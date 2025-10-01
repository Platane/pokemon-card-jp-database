export const elements = ["grass","none","fire","water","electric","psychic","fighting","dark","steel","dragon","void"] as const;
export type Element = (typeof elements)[number];
export const editions = ["M2","MBD","MBG","M1L","M1S","MA","SV11B","SV11W","SV10","SV9a","SVOD","SVOM","SV9","SVN","SV8a","SVM","SV8","SV7a","SVLN","SVLS","SV7","SVK","SV6a","SVJL","SVJP","SV6","SV5a","SVI","SV5K","SV5M","SVHK","SVHM","SV4a","SVG","SV4K","SV4M","SV3a","SVEM","SVEL","SV3","WCS23","SVD","SV2a","SVP1","SV2P","SV2D","SVC","SV1a","SV1S","SV1V","SVAM","SVAL","SVAW","M-P","SV-P"] as const;
export type Edition = (typeof editions)[number];
export type Card = {
	      cardId: string;
				name: string;
        element: Element;
        edition: Edition;
        description: string | undefined;
        dimension: string | undefined;
        health: number;
        numero: number | undefined;
        attacks: {
            name: string;
            damage: string;
            effect: string;
            cost: Element[];
        }[];
			};