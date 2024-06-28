const updatePopoverData = async () => {
  const { blurAllImages } = await chrome.storage.local.get(["blurAllImages"]);
  const { removedNewsCount = 0 } = await chrome.storage.local.get([
    "removedNewsCount",
  ]);
  const removeNewsWithAi = await chrome.storage.local.get(["removeNewsWithAi"]);

  const removeNewsWithAiInput = document.getElementById(
    "removeNewsWithAi"
  ) as HTMLInputElement;
  const blurImageInput = document.getElementById(
    "blurImageInput"
  ) as HTMLInputElement;
  const removedNewsCountSpan = document.querySelector(
    ".removedNewsCount"
  ) as HTMLElement;

  removedNewsCountSpan.textContent = removedNewsCount;
  blurImageInput.checked = blurAllImages ?? false;
  removeNewsWithAiInput.checked = removeNewsWithAi.removeNewsWithAi;
};

updatePopoverData();

const toggleBtnHandler = async (btn: HTMLInputElement, featureName: string) => {
  const [tab] = await chrome.tabs.query({
    active: true,
  });

  chrome.storage.local.set({ [featureName]: btn.checked });
  tab.id && chrome.tabs.sendMessage(tab.id, { [featureName]: btn.checked });
};

const toggleButton = document.getElementById(
  "blurImageInput"
) as HTMLInputElement;
toggleButton?.addEventListener("change", () =>
  toggleBtnHandler(toggleButton, "blurAllImages")
);

const removeNewsWithAiBtn = document.getElementById(
  "removeNewsWithAi"
) as HTMLInputElement;
removeNewsWithAiBtn?.addEventListener("change", () =>
  toggleBtnHandler(removeNewsWithAiBtn, "removeNewsWithAi")
);

chrome.runtime.onMessage.addListener(async ({ removedNewsCount }) => {
  if (removedNewsCount !== undefined) {
    const { removedNewsCount: prevRemovedNews = 0 } =
      await chrome.storage.local.get(["removedNewsCount"]);
    const removedNewsCountSpan = document.querySelector(
      ".removedNewsCount"
    ) as HTMLElement;

    removedNewsCountSpan.textContent = removedNewsCount + prevRemovedNews;
  }
});
