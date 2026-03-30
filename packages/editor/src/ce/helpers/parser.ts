/**
 * @description function to extract all additional assets from HTML content
 * @param htmlContent
 * @returns {string[]} array of additional asset sources
 */
export const extractAdditionalAssetsFromHTMLContent = (htmlContent: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const assetSources: string[] = [];
  // Extract drawio block asset references (src attribute on pre[data-type="drawioBlock"])
  const drawioBlocks = doc.querySelectorAll('pre[data-type="drawioBlock"]');
  drawioBlocks.forEach((block) => {
    const src = block.getAttribute("data-src");
    if (src) assetSources.push(src);
  });
  return assetSources;
};

/**
 * @description function to replace additional assets in HTML content with new IDs
 * @param props
 * @returns {string} HTML content with replaced additional assets
 */
export const replaceAdditionalAssetsInHTMLContent = (props: {
  htmlContent: string;
  assetMap: Record<string, string>;
}): string => {
  const { htmlContent, assetMap } = props;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  // Replace drawio block asset references
  const drawioBlocks = doc.querySelectorAll('pre[data-type="drawioBlock"]');
  drawioBlocks.forEach((block) => {
    const oldSrc = block.getAttribute("data-src");
    if (oldSrc && assetMap[oldSrc]) {
      block.setAttribute("data-src", assetMap[oldSrc]);
    }
  });
  return doc.body.innerHTML;
};
