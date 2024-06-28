let isModifyingDOM = false;

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

const getBadNewsTitlesFromAI = async (allNewsLinksText: string[]) => {
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
};

export const setToggleBlurImageValue = async (value?: {
  blurAllImages: boolean;
}) => {
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

export const showErrorToaster = () => {
  const toaster = document.getElementById("remove_bad_news_toaster");
  if (toaster) {
    toaster.textContent = "Something went wrong, please try again later";

    setTimeout(() => {
      toaster.hidePopover();
      isModifyingDOM = false;
    }, 3000);
  }
};

export const removeContent = (link: HTMLAnchorElement) => {
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

const storeRemoveNewsCount = async (newsLinks: HTMLAnchorElement[]) => {
  const prevRemovedNewsCount = await chrome.storage.local.get([
    "removedNewsCount",
  ]);

  await chrome.storage.local.set({
    removedNewsCount:
      (prevRemovedNewsCount.removedNewsCount ?? 0) + newsLinks.length,
  });

  await chrome.runtime.sendMessage({ removedNewsCount: newsLinks.length });
};

export const handleRemovingContent = async (
  allNewsLinksText: string[],
  allNewsLinks: NodeListOf<HTMLAnchorElement>
) => {
  if (isModifyingDOM) return;
  isModifyingDOM = true;

  const toaster = document.getElementById("remove_bad_news_toaster");
  if (toaster) {
    toaster.textContent = "News being removed....";
    toaster.showPopover();
  }

  const badNewsTitles = await getBadNewsTitlesFromAI(allNewsLinksText);

  const newsLinks = badNewsTitles.flatMap((text: string) =>
    Array.from(allNewsLinks).filter((link) => link.innerText === text)
  );

  newsLinks.forEach(removeContent);

  storeRemoveNewsCount(newsLinks);
};

export const handleRemovingContentWithoutAI = (
  allNewsLinks: NodeListOf<HTMLAnchorElement>
) => {
  const newsLinks = Array.from(allNewsLinks).filter((newsLink) => {
    return banglaBadNewsKeywords.some((keyword) =>
      newsLink.innerText.includes(keyword)
    );
  });

  newsLinks.forEach(removeContent);

  storeRemoveNewsCount(newsLinks);
};
