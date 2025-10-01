import * as fs from "node:fs";
import * as cheerio from "cheerio";
import * as fetcher from "./fetch";

/**
 * the bot detection mecanism is pretty aggressive for this website
 * I ended up not scrapping it
 */
export const scrappePokemonCards_us = async (name: string) => {
	const uris = await scrapeResultUrl(name);
	const cards = await Promise.all(uris.slice(0, 5).map(scrapeCardPage));

	return cards;
};

const fetch = async (
	u: Parameters<typeof fetcher.fetch>[0],
	o?: Parameters<typeof fetcher.fetch>[1],
) => {
	const res = await fetcher.fetch(u, o);
	const text = await res.text();

	if (
		text.includes(
			"As you were browsing something about your browser made us think you were a bot.",
		) ||
		text.includes("Pardon Our Interruption") ||
		text.includes("Request unsuccessful. Incapsula incident")
	) {
		fetcher.invalidateCache(u);
		throw new Error("bot detection triggered");
	}

	return res;
};

const scrapeResultUrl = async (name: string) => {
	const uris: string[] = [];

	let searchResultUrl: URL | string | undefined = new URL(
		"https://www.pokemon.com/us/pokemon-tcg/pokemon-cards",
	);
	searchResultUrl.searchParams.set("cardName", name);
	while (searchResultUrl) {
		const html = await fetch(searchResultUrl).then((res) => res.text());

		const $ = cheerio.load(html);

		// fs.writeFileSync(__dirname + "/list-" + name + ".html", html);

		const hrefs = $("#cardResults li a")
			.map((_, el) => $(el).attr("href"))
			.toArray()
			.map((u) => new URL(u, searchResultUrl).href);

		uris.push(...hrefs);

		const loadMore = $("#cards-load-more a")
			.filter((_, el) => $(el).text().toLowerCase().includes("next"))
			.first();

		searchResultUrl = loadMore.attr("href");
	}

	return uris;
};

const scrapeCardPage = async (url: string) => {
	const html = await fetch(url).then((res) => res.text());

	// fs.writeFileSync(__dirname + "/page-" + "" + ".html", html);

	const $ = cheerio.load(html);

	const $section = $("section.card-detail");

	const title = $section.find(".card-description h1").text();
	const hp = parseInt(
		$section.find(".card-description .card-hp").text().match(/\d+/)![0],
		10,
	);
	const element = $section.find(".card-description .energy").attr("title")!;

	const attacks = $section
		.find(".pokemon-abilities .ability")
		.map((_, el) => {
			const $el = $(el);
			const cost = $el
				.find("ul li")
				.map((_, el) => $(el).attr("title"))
				.toArray();

			const title = $el.find("h4").text();
			const damage = $el.find("span").text();
			const effect = $el.find("pre").text();

			return { title, cost, effect, damage };
		})
		.toArray();

	const serie = $section.find(".stats-footer h3").text().trim();

	return {
		title,
		hp,
		element,
		attacks,
		serie,
	};
};
