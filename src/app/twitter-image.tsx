// X/Twitter uses the same branded card as Open Graph. Re-exporting keeps a
// single source of truth for the image while still emitting twitter:image tags.
export { default, alt, size, contentType } from "./opengraph-image";
