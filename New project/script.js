const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsList = document.getElementById("results-list");
const statusMessage = document.getElementById("status-message");
const resultsSummary = document.getElementById("results-summary");
const quickActionButtons = document.querySelectorAll(".quick-actions button");
const duckDuckGoBaseUrl = "https://duckduckgo.com/?q=";

function setStatus(message) {
  statusMessage.textContent = message;
}

function setSummary(message = "") {
  resultsSummary.textContent = message;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmptyState(message, isError = false) {
  resultsList.innerHTML = `
    <div class="empty-state${isError ? " error-state" : ""}">
      ${escapeHtml(message)}
    </div>
  `;
}

function runSearch(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    searchInput.focus();
    return;
  }

  setStatus(`Opening DuckDuckGo for "${trimmedQuery}"...`);
  setSummary("Static mode");
  window.location.href = `${duckDuckGoBaseUrl}${encodeURIComponent(trimmedQuery)}`;
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(searchInput.value);
});

quickActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const query = button.dataset.query || "";
    searchInput.value = query;
    runSearch(query);
  });
});
