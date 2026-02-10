module.exports = function (eleventyConfig) {

  // Dummy image shortcode (prevents Eleventy build errors)
  eleventyConfig.addShortcode("image", () => "");

  // Passthrough copy for images or other assets
  eleventyConfig.addPassthroughCopy("src/images");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
