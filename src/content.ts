import {
  handleRemovingContent,
  handleRemovingContentWithoutAI,
  setToggleBlurImageValue,
} from "./utils";

setToggleBlurImageValue();

chrome.runtime.onMessage.addListener(async (request) => {
  if ("removeNewsWithAi" in request) {
    window.location.reload();
  } else {
    setToggleBlurImageValue(request);
  }
});

const invalidNodes = ["IMG", "SCRIPT", "NOSCRIPT", "OPTION"];
let timeoutId: number | undefined;

window.addEventListener("load", async () => {
  const toaster = document.createElement("div");
  toaster.id = "remove_bad_news_toaster";
  toaster.textContent = "News being removed....";
  toaster.popover = "manual";
  document.body.appendChild(toaster);

  const removeNewsWithAi = await chrome.storage.local.get(["removeNewsWithAi"]);
  removeNewsWithAi.removeNewsWithAi && toaster.showPopover();

  handleRemovingContentWithoutAI();

  if (removeNewsWithAi.removeNewsWithAi) {
    timeoutId = setTimeout(() => handleRemovingContent(), 500);
  }

  const observer = new MutationObserver((mutations) => {
    const lastMutationValue = mutations[mutations.length - 1];

    if (
      !lastMutationValue.addedNodes ||
      lastMutationValue.removedNodes.length > 0 ||
      !Boolean(
        Array.from(lastMutationValue.addedNodes)[0] instanceof HTMLElement
      ) ||
      (Array.from(lastMutationValue.addedNodes)[0] as HTMLElement)?.id ===
        "remove_bad_news_toaster" ||
      invalidNodes.includes(
        Array.from(lastMutationValue.addedNodes)[0]?.nodeName
      )
    )
      return;

    handleRemovingContentWithoutAI();

    if (removeNewsWithAi.removeNewsWithAi) {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => handleRemovingContent(), 1000);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // @ts-ignore
  // window.navigation.addEventListener("navigate", (e) => {
  //   if (e.navigationType === "reload") return;

  //   observer.observe(document.body, { childList: true, subtree: true });

  //   removeNewsWithAi.removeNewsWithAi && toaster.showPopover();
  // });
});
