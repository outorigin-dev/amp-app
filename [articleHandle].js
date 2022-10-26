import Head from "next/head";
import * as _ from "lodash";
import humps from "humps";
import moment from "moment";
import { useAmp } from "next/amp";
import Layout from "~/components/amp/Layout";

import fetch from "isomorphic-unfetch";
import React from "react";
import RelatedArticle from "../../../../components/amp/Article/RelatedArticles";
import ShopTheBlog from "../../../../components/amp/Article/ShopTheBlog";

export const config = { amp: true };

const getSocialHtml = (article) => {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=https://www.100percentpure.com/${article.handle}`;
  const twitterUrl = `https://twitter.com/home?status=Check out this blog post from 100%25 PURE&reg;: https://www.100percentpure.com/${article.handle}`;
  const pinterestUrl = `https://www.pinterest.com/pin/create/button?url=https://www.100percentpure.com/${article.handle}`;
  const emailUrl = `mailto:mailto:customerservice@puritycosmetics.com?subject=I wanted you to see this site&amp;body=Check out this site https://www.100percentpure.com/blogs/feed/${article.handle}.`;
  return (
    '<section class="grid text-center p-v-sm text-md-lg">' +
    `<a class="icon-fallback-text no-borders inline m-h-sm" href="${facebookUrl}" target="_blank">` +
    '<span class="icon icon-facebook"></span>' +
    '<span class="fallback-text">Facebook</span>' +
    "</a>" +
    `<a class="icon-fallback-text no-borders inline m-h-sm" href="${twitterUrl}" target="_blank">` +
    '<span class="icon icon-twitter"></span>' +
    '<span class="fallback-text">Twitter</span>' +
    "</a>" +
    `<a class="icon-fallback-text no-borders inline m-h-sm pointer" href="${pinterestUrl}" target="_blank" data-pin-custom="true">` +
    '<span class="icon icon-pinterest"></span>' +
    '<span class="fallback-text">Pinterest</span>' +
    "</a>" +
    `<a class="icon-fallback-text no-borders inline m-h-sm pointer" href="${emailUrl}" target="_blank">` +
    '<span class="icon icon-mail"></span>' +
    '<span class="fallback-text">E-mail</span>' +
    "</a>" +
    "</section>"
  );
};

const convertHtml = (article) => {
  const tags = article.tags;
  const author = article.author.replace("®", "<sup>®</sup>");
  const html = article.bodyHtml;
  const additionsHtml =
    '<div class="center-text l-s-1x main-font text-base l-h-2x">' +
    tags
      .map(
        (tag) =>
          `<a href="/blogs/feed/tagged/${tag.url}">${tag.title}</a> <span class="closer-line inline m-r-xs">//</span> `
      )
      .join("") +
    moment(article.createdAt).format("MMM D, YYYY") +
    ` <span class="closer-line inline m-r-xs">//</span> ${author} ` +
    "</div>" +
    getSocialHtml(article);
  return html
    .replace(
      /<div class="additions"><\/div>/,
      `<div class="additions">${additionsHtml}</div>`
    )
    .replace(
      /<img(.*?)\/?>/g,
      '<div class="fixed-container"><amp-img class="contain" border="0" layout="fill" $1></amp-img></div>'
    )
    .replace(
      /<iframe.*?width="(.*?)".*?height="(.*?)".*?src="https:\/\/www\.youtube\.com\/embed\/(.*?)\/?".*?><\/iframe>/g,
      '<amp-youtube class="m-v" data-videoid="$3" width="$1" height="$2" layout="responsive"></amp-youtube>'
    );
};

const Index = (props) => {
  const isAmp = useAmp();
  const article = props.article;
  const tags = [];
  const body = convertHtml(article, tags);

  return (
    <Layout navigations={props.navigations}>
      <Head>
        <title>{props.article.title}</title>
        <link rel="canonical" href={props.canonicalUrl} />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <article className="grid__item large--one-whole">
        <header className="blog-header section-header">
          <div className="section-header__left">
            <h1 className="text-center ">{article.title}</h1>
          </div>
        </header>
        <div className="blog-body supports-fontface">
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </div>
        <ul className="inline-list">
          <li>
            <span>Tags: </span>
            {article.tags.map((tag) => {
              return (
                <>
                  <a href={`/blogs/feed/tagged/${tag.url}`} key={tag.url}>
                    {tag.title}
                  </a>
                  ,{" "}
                </>
              );
            })}
          </li>
        </ul>
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <RelatedArticle article={article} />
        )}
        {article.shopTheBlogProducts &&
          article.shopTheBlogProducts.length > 0 && (
            <ShopTheBlog article={article} />
          )}
      </article>
    </Layout>
  );
};

const getNavigations = async () => {
  const res = await fetch("http://localhost:3000/api/navigations");
  const data = await res.json();
  return humps.camelizeKeys(data);
};

const getArticle = async (blogHandle, articleHandle) => {
  const res = await fetch(
    `http://localhost:3000/api/blogs/${blogHandle}/${articleHandle}`
  );
  const data = await res.json();
  return humps.camelizeKeys(data);
};

const getTagMappings = async (blogHandle) => {
  const res = await fetch(
    `http://localhost:3000/api/blogs/${blogHandle}/tagMappings`
  );
  const data = await res.json();
  return humps.camelizeKeys(data);
};

const parseTags = (article, tagMappings) => {
  const tagMap = _.keyBy(tagMappings, "key");
  return article.tags
    .split(",")
    .map((tag) => {
      return tagMap[tag.trim().toLowerCase()];
    })
    .filter((x) => x != null);
};

const getRecentArticlesByTag = async (blogHandle, tag) => {
  const res = await fetch(
    `http://localhost:3000/api/blogs/${blogHandle}/tagged/${tag}`
  );
  const data = await res.json();
  return humps.camelizeKeys(data);
};

const getProduct = async (productHandle) => {
  const res = await fetch(
    `http://localhost:3000/api/products/${productHandle}`
  );
  const data = await res.json();
  return humps.camelizeKeys(data);
};

Index.getInitialProps = async function ({
  query: { blogHandle, articleHandle },
}) {
  const navigations = await getNavigations();
  const article = await getArticle(blogHandle, articleHandle);
  const tagMappings = await getTagMappings(blogHandle);

  article.tags = parseTags(article, tagMappings);
  article.relatedArticles = [];

  for (const tag of article.tags) {
    const articlesByTag = await getRecentArticlesByTag(blogHandle, tag.title);
    article.relatedArticles = article.relatedArticles.concat(articlesByTag);
  }

  // Shop the blog
  const products = [];
  if (article.shopTheBlogProductIds) {
    for (const productId of article.shopTheBlogProductIds) {
      try {
        const product = await getProduct(productId);
        if (product) {
          products.push(product);
        }
      } catch (e) {
        //
      }
    }
  } else {
    const metafield = _.find(article.metafields, {
      key: "product",
      namespace: "100pure",
    });
    const productHandles = metafield == null ? [] : metafield.value.split("|");

    if (productHandles && productHandles.length > 0) {
      for (const productHandle of productHandles) {
        try {
          const product = await getProduct(productHandle);
          if (product) {
            products.push(product);
          }
        } catch (e) {
          //
        }
      }
    }
  }

  article.shopTheBlogProducts = products;

  article.relatedArticles = _.uniqBy(article.relatedArticles, "handle");

  return {
    canonicalUrl: `https://www.100percentpure.com/blogs/${blogHandle}/${articleHandle}`,
    article,
    navigations,
  };
};

export default Index;
