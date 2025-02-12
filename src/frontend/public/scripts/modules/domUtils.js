async function loadHTML(selector, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    const html = await response.text();
    document.querySelector(selector).innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}
