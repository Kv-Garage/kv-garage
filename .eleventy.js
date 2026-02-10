module.exports = function (eleventyConfig) {

  // Kill-switch for old image shortcodes
  eleventyConfig.addShortcode("image", () => "");

  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/images");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_includes",
      output: "_site"
    }
  };
};
