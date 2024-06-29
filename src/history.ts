interface NewsData {
  date: string;
  link: {
    text: string;
    url: string;
  };
  hostname: string;
}
[];

const headers = ["Date", "Newspaper", "News"];

async function createNewsHistoryTable() {
  const { removedNews = [] } = (await chrome.storage.local.get([
    "removedNews",
  ])) as {
    removedNews: NewsData[];
  };

  const container = document.getElementById("tableContainer") as HTMLDivElement;
  const table = document.createElement("table");

  const headerRow = document.createElement("tr");
  headers.forEach((headerText) => {
    const header = document.createElement("th");
    header.textContent = headerText;
    headerRow.appendChild(header);
  });
  table.appendChild(headerRow);

  removedNews.reverse().forEach((newsData) => {
    const row = document.createElement("tr");

    Object.entries(newsData).forEach(([key, value]) => {
      const cell = document.createElement("td");

      if (key === "date" || key === "hostname") {
        cell.id = key;
        cell.textContent = value;
      } else {
        const link = document.createElement("a");
        link.href = value.url;
        link.textContent = value.text;

        cell.id = key;
        cell.appendChild(link);
      }

      row.appendChild(cell);
    });
    table.appendChild(row);
  });

  container.appendChild(table);
}

createNewsHistoryTable();
