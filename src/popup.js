const updatePopoverData = async () => {
  const { blurAllImages } = await chrome.storage.local.get(["blurAllImages"]);
  const { removedNewsCount = 0 } = await chrome.storage.local.get([
    "removedNewsCount",
  ]);

  const blurImageInput = document.getElementById("blurImageInput");
  const removedNewsCountSpan = document.querySelector(".removedNewsCount");

  removedNewsCountSpan.textContent = removedNewsCount;
  blurImageInput.checked = blurAllImages ?? false;
};

updatePopoverData();

const toggleButton = document.getElementById("blurImageInput");
toggleButton?.addEventListener("change", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
  });

  chrome.storage.local.set({ blurAllImages: toggleButton.checked });
  chrome.tabs.sendMessage(tab.id, { blurAllImages: toggleButton.checked });
});

chrome.runtime.onMessage.addListener(async ({ removedNewsCount }) => {
  if (removedNewsCount !== undefined) {
    const { removedNewsCount: prevRemovedNews = 0 } =
      await chrome.storage.local.get(["removedNewsCount"]);
    const removedNewsCountSpan = document.querySelector(".removedNewsCount");

    removedNewsCountSpan.textContent = removedNewsCount + prevRemovedNews;
  }
});
