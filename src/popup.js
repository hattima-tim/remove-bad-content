const updatePopoverData = async () => {
  const { blurAllImages } = await chrome.storage.local.get(["blurAllImages"]);
  const { removedNewsCount = 0 } = await chrome.storage.local.get([
    "removedNewsCount",
  ]);
  const removeNewsWithAi = await chrome.storage.local.get(["removeNewsWithAi"]);

  const removeNewsWithAiInput = document.getElementById("removeNewsWithAi");
  const blurImageInput = document.getElementById("blurImageInput");
  const removedNewsCountSpan = document.querySelector(".removedNewsCount");

  removedNewsCountSpan.textContent = removedNewsCount;
  blurImageInput.checked = blurAllImages ?? false;
  removeNewsWithAiInput.checked = removeNewsWithAi;
};

updatePopoverData();

const toggleBtnHandler = async (btn, featureName) => {
  const [tab] = await chrome.tabs.query({
    active: true,
  });

  chrome.storage.local.set({ [featureName]: btn.checked });
  chrome.tabs.sendMessage(tab.id, { [featureName]: btn.checked });
};

const toggleButton = document.getElementById("blurImageInput");
toggleButton?.addEventListener("change", () =>
  toggleBtnHandler(toggleButton, "blurAllImages")
);

const removeNewsWithAiBtn = document.getElementById("removeNewsWithAi");
removeNewsWithAiBtn?.addEventListener("change", () =>
  toggleBtnHandler(removeNewsWithAiBtn, "removeNewsWithAi")
);

chrome.runtime.onMessage.addListener(async ({ removedNewsCount }) => {
  if (removedNewsCount !== undefined) {
    const { removedNewsCount: prevRemovedNews = 0 } =
      await chrome.storage.local.get(["removedNewsCount"]);
    const removedNewsCountSpan = document.querySelector(".removedNewsCount");

    removedNewsCountSpan.textContent = removedNewsCount + prevRemovedNews;
  }
});
