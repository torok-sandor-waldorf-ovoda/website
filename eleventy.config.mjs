import { readdir } from "node:fs/promises";
import { register } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

async function buildGalleryClient() {
  await esbuild.build({
    entryPoints: [path.join(rootDir, "src/js/gallery.client.jsx")],
    bundle: true,
    outfile: path.join(rootDir, "src/js/gallery.js"),
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    jsx: "automatic",
    loader: { ".css": "text" },
    logLevel: "silent",
  });
}
import { evaluate } from "@mdx-js/mdx";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";

// Must be called before any dynamic .mdx import() below
register("@mdx-js/node-loader", import.meta.url);

// ── Global components ──────────────────────────────────────────────────────
// Loaded once, then injected into every MDX page as `components`.
// This means page .mdx files need NO import statements for these.
const componentsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "src/_components",
);

let _components = null;
async function getComponents() {
  if (_components) return _components;
  const files = (await readdir(componentsDir)).filter((f) =>
    f.endsWith(".mdx"),
  );
  const entries = await Promise.all(
    files.map(async (file) => {
      const name = path.basename(file, ".mdx");
      const mod = await import(`./src/_components/${file}`);
      return [name, mod[name]];
    }),
  );
  _components = Object.fromEntries(entries);
  return _components;
}

export default function (eleventyConfig) {
  eleventyConfig.on("eleventy.before", async () => {
    await buildGalleryClient();
  });
  eleventyConfig.addWatchTarget("src/js/gallery.client.jsx");

  // ── MDX support (with frontmatter) ────────────────────────────────────────
  eleventyConfig.addTemplateFormats("mdx");
  eleventyConfig.addExtension("mdx", {
    compile: async (str, inputPath) => {
      const { default: mdxContent } = await evaluate(str, {
        ...runtime,
        baseUrl: pathToFileURL(inputPath),
      });

      return async function (data) {
        const components = await getComponents();
        const res = await mdxContent({ components, ...data });
        return renderToStaticMarkup(res);
      };
    },
  });

  // ── Static assets ──────────────────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/dokumentumok");
  eleventyConfig.addPassthroughCopy("src/dev-editor.html");

  // Don't process HTML/legacy files inside asset directories as templates
  eleventyConfig.ignores.add("src/images/**");
  // Don't process component MDX files as pages
  eleventyConfig.ignores.add("src/_components/**");
  // Still watch them: ignored paths are not templates, but pages import these at runtime
  eleventyConfig.addWatchTarget("src/_components/**");

  eleventyConfig.on("eleventy.beforeWatch", (changedFiles) => {
    if (changedFiles.some((f) => f.includes("_components"))) {
      _components = null;
    }
  });

  // ── Directory config ───────────────────────────────────────────────────────
  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
      includes: "_includes",
      data: "_data",
    },
  };
}
