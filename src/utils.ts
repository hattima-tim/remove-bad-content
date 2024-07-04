let isModifyingDOM = false;
let allNewsLinks: NodeListOf<HTMLAnchorElement>;
let allNewsLinksText: string[];

const englishBadNewsKeywords = [
  "rape",
  "murder",
  "corpse",
  "rapist",
  "dead",
  "death",
  "suicide",
  "kill",
  "molestation",
  "sexual",
  "die",
];

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
    const response = await fetch(
      "https://remove-bad-content-server.onrender.com/ai",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: allNewsLinksText }),
      }
    );

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
    link.closest(".card-with-image-zoom") ||
    link.closest(".card") || // for the daily star, tbs news
    link.closest("article"); // for all jazeera

  contentArea?.remove();
};

const storeRemoveNewsCount = async (newsLinks: HTMLAnchorElement[]) => {
  const { removedNews: prevRemovedNews = [] } = await chrome.storage.local.get([
    "removedNews",
  ]);

  const newsDataToSave = newsLinks.map((link) => {
    return {
      date: new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date()),
      link: {
        text: link.textContent,
        url: link.href,
      },
      hostname: window.location.hostname,
    };
  });

  await chrome.storage.local.set({
    removedNews: [...prevRemovedNews, ...newsDataToSave],
  });

  await chrome.runtime.sendMessage({ removedNews: newsDataToSave.length });
};

export const handleRemovingContent = async () => {
  if (isModifyingDOM) return;
  isModifyingDOM = true;

  allNewsLinks = document.querySelectorAll("a");
  allNewsLinksText = Array.from(allNewsLinks).map(
    (link) => link.textContent ?? ""
  );

  const toaster = document.getElementById("remove_bad_news_toaster");
  if (toaster) {
    toaster.textContent = "News being removed....";
    toaster.showPopover();
  }

  const badNewsTitles = await getBadNewsTitlesFromAI(allNewsLinksText);

  const newsLinks = Array.from(allNewsLinks).filter((link) =>
    badNewsTitles.includes(link.innerText)
  );

  newsLinks.forEach(removeContent);

  storeRemoveNewsCount(newsLinks);
};

export const handleRemovingContentWithoutAI = () => {
  allNewsLinks = document.querySelectorAll("a");
  allNewsLinksText = Array.from(allNewsLinks).map(
    (link) => link.querySelector("span")?.innerText ?? ""
  );

  const newsLinks = Array.from(allNewsLinks).filter((newsLink) => {
    let keywordsToUseForFiltering =
      window.location.hostname === "www.prothomalo.com"
        ? banglaBadNewsKeywords
        : englishBadNewsKeywords;

    return keywordsToUseForFiltering.some((keyword) =>
      newsLink.innerText.toLowerCase().includes(keyword)
    );
  });

  newsLinks.forEach(removeContent);

  storeRemoveNewsCount(newsLinks);
};
