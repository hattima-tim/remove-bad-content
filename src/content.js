const banglaBadNewsKeywords = [
  "ধর্ষণ",
  "খুনি",
  "খুন",
  "মৃত্যু",
  "মরদেহ",
  "ধর্ষক",
  "লাশ",
  "হত্যা",
  "আত্মহত্যা",
  "নিহত",
  "ধর্ষণের",
  "প্রতিশোধ",
  "নৃশংস",
  "জখম",
  "শ্লীলতাহানি",
  "ধর্ষিত",
  "যৌন",
];

let isModifyingDOM = false;

let allNewsLinksText;
let allNewsLinks;

const setToggleBlurImageValue = async (value) => {
  const toggleValue = await chrome.storage.local.get(["blurAllImages"]);

  const shouldBlur = value?.blurAllImages
    ? value.blurAllImages
    : toggleValue.blurAllImages;

  if (shouldBlur) {
    document.body.classList.add("blur-images");
  } else {
    document.body.classList.remove("blur-images");
  }
};

setToggleBlurImageValue();

chrome.runtime.onMessage.addListener(async (request) => {
  if ("removeNewsWithAi" in request) {
    window.location.reload();
  } else {
    setToggleBlurImageValue(request);
  }
});

const showErrorToaster = () => {
  const toaster = document.getElementById("remove_bad_news_toaster");
  if (toaster) {
    toaster.textContent = "Something went wrong, please try again later";

    setTimeout(() => {
      toaster.hidePopover();
      isModifyingDOM = false;
    }, 3000);
  }
};

async function getBadNewsTitlesFromAI() {
  try {
    const response = await fetch("http://localhost:3000/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: allNewsLinksText }),
    });

    if (!response.ok) {
      showErrorToaster();
      return [];
    }

    const toaster = document.getElementById("remove_bad_news_toaster");
    toaster?.hidePopover();
    isModifyingDOM = false;

    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    showErrorToaster();
    return [];
  }
}

const removeContent = (link) => {
  const contentArea =
    link.closest(".wide-story-card") ||
    link.closest(".news_item_content") ||
    link.closest(".news_with_item") ||
    link.closest(".related-story-wrapper") ||
    link.closest(".also-read") ||
    link.closest(".news_with_no_image") ||
    link.closest(".numbered-story-headline") ||
    link.closest(".card-with-image-zoom");

  contentArea?.remove();
};

const storeRemoveNewsCount = async (newsLinks) => {
  const prevRemovedNewsCount = await chrome.storage.local.get([
    "removedNewsCount",
  ]);

  await chrome.storage.local.set({
    removedNewsCount:
      (prevRemovedNewsCount.removedNewsCount ?? 0) + newsLinks.length,
  });

  await chrome.runtime.sendMessage({ removedNewsCount: newsLinks.length });
};

const handleRemovingContent = () => {
  if (isModifyingDOM) return;
  isModifyingDOM = true;

  const toaster = document.getElementById("remove_bad_news_toaster");
  toaster?.showPopover();

  setTimeout(async () => {
    const badNewsTitles = await getBadNewsTitlesFromAI();

    const newsLinks = badNewsTitles.flatMap((text) =>
      Array.from(allNewsLinks).filter((link) => link.innerText === text)
    );

    newsLinks.forEach(removeContent);

    storeRemoveNewsCount(newsLinks);
  }, 2000);
};

const handleRemovingContentWithoutAI = (allNewsLinks) => {
  const newsLinks = Array.from(allNewsLinks).filter((newsLink) => {
    return banglaBadNewsKeywords.some((keyword) =>
      newsLink.innerText.includes(keyword)
    );
  });

  newsLinks.forEach(removeContent);

  storeRemoveNewsCount(newsLinks);
};

const invalidNodes = ["IMG", "SCRIPT", "NOSCRIPT", "OPTION"];
let timeoutId;

window.addEventListener("load", async () => {
  const newsContainer = document.querySelector(".container");
  const toaster = document.createElement("div");
  toaster.id = "remove_bad_news_toaster";
  toaster.popover = "manual";
  toaster.textContent = "News being removed....";
  newsContainer?.appendChild(toaster);

  const removeNewsWithAi = await chrome.storage.local.get(["removeNewsWithAi"]);
  removeNewsWithAi.removeNewsWithAi && toaster.showPopover();

  const observer = new MutationObserver((mutations) => {
    const lastMutationValue = mutations[mutations.length - 1];

    allNewsLinks = document.querySelectorAll("a");
    allNewsLinksText = Array.from(allNewsLinks).map(
      (link) => link.querySelector("span")?.innerText ?? ""
    );

    if (
      !lastMutationValue.addedNodes ||
      lastMutationValue.removedNodes.length > 0 ||
      Array.from(lastMutationValue.addedNodes)[0]?.id ===
        "remove_bad_news_toaster" ||
      invalidNodes.includes(
        Array.from(lastMutationValue.addedNodes)[0]?.nodeName
      )
    )
      return;

    handleRemovingContentWithoutAI(allNewsLinks);

    if (removeNewsWithAi.removeNewsWithAi) {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(handleRemovingContent, 1000);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.navigation.addEventListener("navigate", () => {
    observer.observe(document.body, { childList: true, subtree: true });

    removeNewsWithAi.removeNewsWithAi && toaster.showPopover();
  });
});
