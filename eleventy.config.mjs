import pluginWebc from "@11ty/eleventy-plugin-webc";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginWebc, {
    components: "src/_components/**/*.webc",
  });

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/dokumentumok");
  eleventyConfig.addPassthroughCopy("src/admin");

  eleventyConfig.ignores.add("src/images/**");
  eleventyConfig.ignores.add("src/_components/**");
  eleventyConfig.ignores.add("src/admin/**");

  eleventyConfig.addCollection("posts", (api) => {
    return api
      .getFilteredByGlob("src/blog/posts/**/*.md")
      .sort((a, b) => b.date - a.date);
  });

  return {
    pathPrefix: process.env.PATH_PREFIX || "",
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "webc",
  };
}
