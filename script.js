const searchBar = document.querySelector(".searchBar");
const cardRow = document.getElementById("cardRow");
const noResults = document.getElementById("noResults");
const totalCardCount = document.getElementById("totalCardCount");
const filterButtons = document.querySelectorAll(".filter-button");
const ownershipFilter = document.getElementById("ownershipFilter")
const ownershipstorageKey = "aespa-card-ownership";
const releaseFilter = document.getElementById("releaseFilter");

let allCards = [];
let activeFilter = "All";

fetch("aespa/cards.csv")
  .then((response) => response.text())
  .then((csvText) => {
    allCards = parseCSV(csvText);
    populateReleaseFilter(allCards);

    try {
      const savedOwnership = JSON.parse(
        localStorage.getItem(ownershipstorageKey) || "{}"
      );

      allCards.forEach((card) => {
        if (typeof savedOwnership?.[card.id] === "boolean") {
          card.owned = savedOwnership[card.id];
        }
      });
    }
    
    catch (error) {
      console.warn("Could not load saved ownership:", error)
    }
    renderCards(allCards);
    //updateTotalCardCount(allCards);
  })

  .catch((error) => {
    console.error("Error loading CSV:", error);
  });

function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const card = {};

    headers.forEach((header, index) => {
      card[header] = values[index]?.trim() || "";
    });

    card.owned = (card.owned || "false").toLowerCase() === "true";

    return card;
  });
}

function renderCards(cards) {
  const filteredCards = cards.filter((card) => {
    const matchesMember = activeFilter === "All" || card.member.toLowerCase() === activeFilter.toLowerCase();
    const searchText = searchBar.value.toLowerCase().trim();

    const matchesSearch = searchText === "" ||
      `${card.member} ${card.release} ${card.version}`.toLowerCase().includes(searchText);

    const matchesOwnership = 
      ownershipFilter.value === "all" || (ownershipFilter.value === "owned" && card.owned) ||
      (ownershipFilter.value === "missing" && !card.owned);

    const matchesRelease = releaseFilter.value === "all" || card.release === releaseFilter.value;
    
    return matchesMember && matchesSearch && matchesOwnership && matchesRelease;
  });

  const sortedCards = sortCardsByNumber(filteredCards);
  updateTotalCardCount(allCards, sortedCards.length);

  if (sortedCards.length === 0) {
    cardRow.innerHTML = "";
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  cardRow.innerHTML = sortedCards.map((card) => {
    return `
      <div class="col-6 col-md-4 col-lg-3 card-wrapper">
        <div class="card-custom">
          <img
            src="aespa-images/${card.image}"
            class="card-img"
            alt="${card.member} ${card.release} ${card.version}"
          >
        </div>
        <div class="card-caption">
          <strong>${card.member}</strong><br>
          ${card.release} · ${card.version}<br>
          ${card.owned ? "Owned" : "Not owned"}
          <br>
          <button
            type="button"
            class="btn btn-outline-primary ownership-toggle mt-2"
            data-id="${card.id}"
          >
            ${card.owned ? "Mark as not owned" : "Mark as owned"}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function sortCardsByNumber(cards) {
  return [...cards].sort((a, b) => {
    return a.id.localeCompare(b.id);
  });
}

function updateTotalCardCount(cards, visibleCount) {
  const ownedCounter = cards.filter((card) => card.owned).length;

  totalCardCount.textContent = `Showing ${visibleCount} of ${cards.length} cards ~ Owned: ${ownedCounter}`;
}

function saveOwnership() {
  const ownership = {}

  allCards.forEach((card) => {
    ownership[card.id] = card.owned;
  });

  localStorage.setItem(
    ownershipstorageKey,JSON.stringify(ownership)
  );
}

function populateReleaseFilter(cards) {
  const releases = [...new Set(cards.map((card) => card.release))];
  releases.sort()

  releaseFilter.replaceChildren(new Option("All releases", "all"));

  releases.forEach((release) => {
    releaseFilter.add(new Option(release, release));
  });
}

searchBar.addEventListener("input", () => {
  renderCards(allCards);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.getAttribute("data-filter");
    renderCards(allCards);
  });
});

ownershipFilter.addEventListener("change", () => {
  renderCards(allCards);
})

cardRow.addEventListener("click", (event) => {
    const btn = event.target.closest(".ownership-toggle");

    if (!btn) return;

    const card = allCards.find((card) => card.id === btn.dataset.id);

    if (!card) return;

    card.owned = !card.owned;

    saveOwnership();

    renderCards(allCards);
    //updateTotalCardCount(allCards);
});

releaseFilter.addEventListener("change", () => {
  renderCards(allCards);
});