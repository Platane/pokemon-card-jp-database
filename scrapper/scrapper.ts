import * as cheerio from "cheerio";
import { fetch } from "./fetch";

export const getCards = async () => {
	const cardIds: string[] = [];

	const url = new URL("https://www.pokemon-card.com/card-search/resultAPI.php");
	url.searchParams.set("page", "1");
	url.searchParams.set("se_ta", "pokemon");

	let page = 1;
	while (true) {
		url.searchParams.set("page", page + "");
		const res = await fetch(url).then((res) => res.json());

		cardIds.push(...res.cardList.map((c: any) => c.cardID));

		if (res.maxPage === res.thisPage) break;
		page++;
	}

	const cards = (
		await Promise.all(
			cardIds.map(async (cardId, i) => {
				const uri = `https://www.pokemon-card.com/card-search/details.php/card/${cardId}/`;

				const html = await fetch(uri).then((res) => res.text());

				console.log(cardIds.length, i);

				const $ = cheerio.load(html);

				const name = $("h1").text();
				const health = $(".TopInfo .hp-num").text();
				const element = getElementFromIconClassName(
					$(".TopInfo .icon").attr("class"),
				);
				const numeroLiteral = $(".LeftBox .card h4")
					.text()
					.match(/No.(\d+)/)?.[1];

				const attacks = $(".RightBox h4")
					.map((_, el) => {
						const $el = $(el);
						const damage = $el.find(".f_right").text() ?? "";
						let name = $el.text();
						if (damage) name = name.slice(0, -damage.length);
						name = name.trim();
						const effect = $el.find("+ p").text();
						const cost = $el
							.find(".icon")
							.map((_, el) => getElementFromIconClassName($(el).attr("class")))
							.toArray();

						return { name, damage, effect, cost };
					})
					.toArray();

				return {
					cardId,
					name,
					element,
					health: +health,
					numero: numeroLiteral ? parseInt(numeroLiteral) : undefined,
					attacks,
				};
			}),
		)
	).filter((x) => x !== undefined);

	return cards;
};

const getElementFromIconClassName = (className?: string) =>
	className
		?.split(" ")
		.find((x) => x.startsWith("icon-"))
		?.split("icon-")[1];
