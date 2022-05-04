const axios = require('axios');
const cheerio = require('cheerio');
const { Feed } = require('feed');
const fs = require('fs');
const sites = require('./sites.json');

async function scrape(source) {
  try {
    const { data } = await axios.get(source.url);
    const $ = cheerio.load(data);
    const items = $(source.articleSelector);
    const articles = [];

    items.each((index, el) => {
      const article = {
        title:
          source.articleSelector === source.titleSelector
            ? $(el).text()
            : $(el).find(source.titleSelector).text(),
        link:
          source.articleSelector === source.linkSelector
            ? $(el).attr('href')
            : $(el).find(source.linkSelector).attr('href'),
        description: $(el).find(source.descriptionSelector).text(),
        image: $(el).find(source.imageSelector).attr('src'),
      };
      articles.push(article);
    });

    return articles;
  } catch (err) {
    console.error(err);
  }
}

async function createFeed(source) {
  const articles = await scrape(source);
  const feed = new Feed({
    title: source.name,
    description: source.channelDescription,
    link: source.url,
    language: 'en',
    image: source.channelImage,
  });

  articles.forEach((article) => {
    feed.addItem(article);
  });

  const rssFeed = feed.rss2();

  fs.mkdir('./feeds', { recursive: true }, (err) => {
    if (err) return console.log(err);
  });

  fs.writeFile(`./feeds/${source.slug}.xml`, rssFeed, (err) => {
    if (err) return console.log(err);
  });
}

sites.forEach((site) => {
  createFeed(site);
});
