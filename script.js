const searchBar = document.querySelector(".searchBar");
const cardRow = document.getElementById("cardRow");
const noResults = document.getElementById("noResults");
const totalCardCount = document.getElementById("totalCardCount");
const filterButtons = document.querySelectorAll(".filter-button");
const ownershipFilter = document.getElementById("ownershipFilter")
const ownershipstorageKey = "aespa-card-ownership";
const releaseFilter = document.getElementById("releaseFilter");
const resetFilter = document.getElementById("resetFilter");
const themeSelector = document.getElementById("themeSelector");
const themestorageKey = "aespa-theme";
const collectionProgress = document.getElementById("collectionProgress");
const collectionProgressText = document.getElementById("collectionProgressText");
const cardViewer = document.getElementById("cardViewer");
const closeCardViewer = document.getElementById("closeCardViewer");
const cardViewerTitle = document.getElementById("cardViewerTitle");
const cardViewerImage = document.getElementById("cardViewerImage");
const cardViewerDetails = document.getElementById("cardViewerDetails");
const previousCard = document.getElementById("previousCard");
const nextCard = document.getElementById("nextCard");
const viewerPosition = document.getElementById("viewerPosition");
const exportCollection = document.getElementById("exportCollection");
const importCollection = document.getElementById("importCollection");
const importCollectionFile = document.getElementById("importCollectionFile");
const catalogStatus = document.getElementById("catalogStatus");
const wishlistStorageKey = "aespa-card-wishlist";
const wishlistFilter = document.getElementById("wishlistFilter");
const versionFilter = document.getElementById("versionFilter");
const releaseProgressList = document.getElementById("releaseProgressList");

try {
  const savedTheme = localStorage.getItem(themestorageKey);

  if (["minimal", "metallic", "pastel"].includes(savedTheme)) {
    document.documentElement.dataset.theme = savedTheme;
    themeSelector.value = savedTheme;
  }
} catch (error) {
  console.warn("Could not load saved theme:", error);
}

let allCards = [];
let visibleCards = [];
let currentViewerIndex = -1;
let activeFilter = "All";

fetch("aespa/cards.csv")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Could not load cards: ${response.status}`);
    }
  return response.text();
  })

  .then((csvText) => {
    allCards = parseCSV(csvText);
    populateReleaseFilter(allCards);
    populateVersionFilter(allCards);

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

    try {
      const savedWishlist = JSON.parse(
        localStorage.getItem(wishlistStorageKey) || "{}"
      );

      allCards.forEach((card) => {
        if (typeof savedWishlist?.[card.id] === "boolean") {
          card.wishlisted = savedWishlist[card.id];
        }
      });
    }

    catch(error) {
      console.warn("Could not load saved wishlist:", error)
    }
    renderCards(allCards);
    catalogStatus.hidden = true;
  })

  .catch((error) => {
    console.error("Error loading catalog:", error);
    catalogStatus.hidden = false;

    catalogStatus.textContent = `Could not load the catalog! Please try again!: ${error.message}`;;
  });

function parseCSV(csvText) {
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/);
  const requiredFields = [
    "id", "member", "release", "version", "image", "owned"
  ];
  
  const headers = lines[0].split(",").map((header) => header.trim());

  if (
    headers.some((header) => header === "") ||
    new Set(headers).size !== headers.length
  ) {
    throw new Error("CSV row 1: headers must be nonempty and unique.");
  }

  requiredFields.forEach((field) => {
    if (!headers.includes(field)) {
      throw new Error(`CSV row 1: missing "${field}" column.`);
    }
  });

  const seenIds = new Set();
  const cards = [];

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;

    if (line.trim() === "") return;

    const values = line.split(",").map((value) => value.trim());

    if (values.length !== headers.length) {
      throw new Error(
        `CSV row ${rowNumber}: expected ${headers.length} columns, ` +
        `but found ${values.length}.`
      );
    }

    const card = {};

    headers.forEach((header, columnIndex) => {
      card[header] = values[columnIndex];
    });

    requiredFields.forEach((field) => {
      if (card[field] === "") {
        throw new Error(
          `CSV row ${rowNumber}: "${field}" cannot be empty.`
        );
      }
    });

    if (seenIds.has(card.id)) {
      throw new Error(
        `CSV row ${rowNumber}: duplicate ID "${card.id}".`
      );
    }

    const ownedValue = card.owned.toLowerCase();

    if (!["true", "false"].includes(ownedValue)) {
      throw new Error(
        `CSV row ${rowNumber}: owned must be true or false.`
      );
    }

    seenIds.add(card.id);
    card.owned = ownedValue === "true";
    card.wishlisted = false;
    cards.push(card);
  });

  return cards;
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

    const matchesVersion = versionFilter.value === "all" || card.version === versionFilter.value;

    const matchesWishlist = !wishlistFilter.checked || card.wishlisted;
    
    return matchesMember && matchesSearch && matchesOwnership && matchesRelease && matchesWishlist && matchesVersion;
  });

  const sortedCards = sortCardsByNumber(filteredCards);
  visibleCards = sortedCards;
  updateTotalCardCount(allCards, sortedCards.length);

  if (sortedCards.length === 0) {
    cardRow.innerHTML = "";
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  cardRow.innerHTML = sortedCards.map((card) => {
    return `
      <div class="col-6 col-md-4 col-lg-3 card-wrapper ${card.owned ? "is-owned" : ""}">
        <button
        type="button"
        class="card-custom card-preview"
        data-id="${card.id}"
        aria-label="View ${card.member} ${card.release} ${card.version}"
      >
        <img
          src="aespa-images/${card.image}"
          class="card-img"
          alt="${card.member} ${card.release} ${card.version}"
          loading="lazy"
          decoding="async"
        >
      </button>
        <div class="card-caption">
          <strong>${card.member}</strong><br>
          ${card.release} · ${card.version}<br>
          <span class="ownership-badge">
            ${card.owned ? "✓ Owned" : "Not owned"}
          </span>
          ${card.wishlisted ? '<span class="wishlist-badge"> ♡ Wishlist</span>' : ""}
          <br>
          <button
            type="button"
            class="btn btn-outline-primary ownership-toggle mt-2"
            data-id="${card.id}"
          >
            ${card.owned ? "Mark as not owned" : "Mark as owned"}
          </button>
          <br>
          <button
            type="button"
            class="btn btn-outline-secondary wishlist-toggle mt-2"
            data-id="${card.id}"
            aria-pressed="${card.wishlisted}"
          >
            ${card.wishlisted ? "Remove from wishlist" : "Add to wishlist"}
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
  const wishlistCount = cards.filter((card) => card.wishlisted).length;


  const percent = cards.length === 0 ? 0 : Math.round((ownedCounter / cards.length) * 100);

  totalCardCount.textContent = `Showing ${visibleCount} of ${cards.length} cards ~ Owned: ${ownedCounter} ~ Wishlist: ${wishlistCount}`;

  collectionProgress.value = percent;

  collectionProgressText.textContent = `${percent}% completed ~ ${cards.length - ownedCounter} cards remaining`;

  renderReleaseProgress(cards);
}

function saveOwnership() {
  const ownership = {}

  allCards.forEach((card) => {
    ownership[card.id] = card.owned;
  });

  try {
    localStorage.setItem(
      ownershipstorageKey,JSON.stringify(ownership)
    );
  return true;

  } catch (error) {
    console.error("Could not save ownership:", error)
    return false;
  }
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
    activeFilter = button.dataset.filter;

    updateMemberButtons();
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

    const previousOwned = card.owned;

    card.owned = !card.owned;

    if (!saveOwnership()) {
      card.owned = previousOwned;

      alert("Your ownership change could not be saved. " + "Please check that browser storage is available and try again.");
    
      return;
    }

    renderCards(allCards);
    //updateTotalCardCount(allCards);
});

releaseFilter.addEventListener("change", () => {
  populateVersionFilter(allCards);
  renderCards(allCards);
});

resetFilter.addEventListener("click", () => {
  searchBar.value = "";
  activeFilter = "All";
  releaseFilter.value = "all";

  populateVersionFilter(allCards);

  ownershipFilter.value = "all";
  wishlistFilter.checked = false;

  updateMemberButtons();

  renderCards(allCards);
})


themeSelector.addEventListener("change", () => {

  const selectedTheme = themeSelector.value;
  document.documentElement.dataset.theme = selectedTheme;

  try {
    localStorage.setItem(themestorageKey, selectedTheme);
  } catch (error) {
    console.warn("Could not save theme:", error);
  }
});

closeCardViewer.addEventListener("click", () => {
  cardViewer.close();
});

function openCardViewer(card) {
  currentViewerIndex = visibleCards.findIndex(
    (visibleCard) => visibleCard.id === card.id
  );

  if (currentViewerIndex === -1) return;

  cardViewerTitle.textContent = `${card.member} ~ ${card.release}`;
  cardViewerImage.src = `aespa-images/${card.image}`;

  cardViewerImage.alt = `${card.member} ${card.release} ${card.version}`;

  cardViewerDetails.textContent = `${card.version} ${card.id} ${card.owned ? "Owned" : "Not owned"}`;
  
  viewerPosition.textContent = `${currentViewerIndex + 1} of ${visibleCards.length}`;
  previousCard.disabled = currentViewerIndex === 0;
  nextCard.disabled = currentViewerIndex === visibleCards.length - 1;

  if (!cardViewer.open) {
    cardViewer.showModal();
  }
}

cardRow.addEventListener("click", (event) => {
  const preview = event.target.closest(".card-preview");
  if (!preview) return;

  const card = allCards.find((card) => card.id === preview.dataset.id);

  if (!card) return;

  openCardViewer(card);
});

previousCard.addEventListener("click", () => {
  if (currentViewerIndex > 0) {
    openCardViewer(visibleCards[currentViewerIndex - 1]);
  }
});

nextCard.addEventListener("click", () => {
  if (currentViewerIndex < visibleCards.length - 1) {
    openCardViewer(visibleCards[currentViewerIndex + 1]);
  }
});

cardViewer.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previousCard.click();
  }
  else if (event.key === "ArrowRight"){
    event.preventDefault();
    nextCard.click();
  }
});

exportCollection.addEventListener("click", () => {
  if (allCards.length === 0) {
    alert("Wait until all the cards have loaded before exporting.");
    return;
  }

  const ownership = {};
  const wishlist ={}

  allCards.forEach((card) => {
    ownership[card.id] = card.owned;
    wishlist[card.id] = card.wishlisted;
  });

  const backup = {
    format: "aespa-collection",
    version: 2,
    exportedAt: new Date().toISOString(), ownership, wishlist
  };

  const file = new Blob(
    [JSON.stringify(backup, null, 2)],
    {
      type: "application/json"
    }
  );

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = "aespa-collection-backup.json"

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

importCollection.addEventListener("click", () => {
  if (allCards.length === 0) {
    alert("Wait until all the cards have loaded before importing");
    return;
  }

  importCollectionFile.click();
});

importCollectionFile.addEventListener("change", async () => {
  const file = importCollectionFile.files[0];

  if (!file) return;

  try {
    const backup = JSON.parse(await file.text());

    if (
      !backup || backup.format !== "aespa-collection" || ![1,2].includes(backup.version)
    )
    {
      throw new Error("This is not a support aespa collection backup!");
    }
  
    if (!isValidcardChoices(backup.ownership)) {
      throw new Error("The backup contains invalid ownership values!")
    }

    if (backup.version === 2 && !isValidcardChoices(backup.wishlist)) {
      throw new Error("The backup contains invalid wishlist values")
    }

  const importedWishlist = backup.version === 2 ? backup.wishlist : {};

  const matchingCards = allCards.filter((card) =>
  Object.hasOwn(backup.ownership, card.id) ||
  Object.hasOwn(importedWishlist, card.id)
  );

  if (matchingCards.length === 0) {
    throw new Error("No card IDs in this backup match the current catalog");
  }

  const choicesLabel = backup.version === 2
  ? "ownership and wishlist choices"
  : "ownership choices";

  const approved = confirm(`Import ${choicesLabel} for ${matchingCards.length} cards? ` + "Cards missing from the backup will keep their current status");

  if (!approved) return;

  const updatedCards = allCards.map((card) => ({
    ...card, owned:Object.hasOwn(backup.ownership, card.id)
    ? backup.ownership[card.id]
    : card.owned,
    wishlisted: Object.hasOwn(importedWishlist, card.id)
    ? importedWishlist[card.id]
    : card.wishlisted
  }));

  const ownership = {}
  const wishlist = {}

  updatedCards.forEach((card) => {
    ownership[card.id] = card.owned;
    wishlist[card.id] = card.wishlisted;
  });

  saveImportedChoices(ownership, wishlist);

  allCards = updatedCards;
  renderCards(allCards);

  alert("Collection imported and saved!");

} catch(error) {
  alert(`Could not import the backup: ${error.message}`);
} finally {
  importCollectionFile.value = "";
}

})

cardRow.addEventListener("click", (event) => {
  const button = event.target.closest(".wishlist-toggle");

  if (!button) return;

  const card = allCards.find((card) => card.id === button.dataset.id);

  if (!card) return;
  
  const previousWishlisted = card.wishlisted;

  card.wishlisted = !card.wishlisted;

  if (!saveWishlist()) {
    card.wishlisted = previousWishlisted;
    alert("Your wishlist change could not be saved. Try again");
    return;
  }

  renderCards(allCards);
});

function saveWishlist() {
  const wishlist = {};

  allCards.forEach((card) => {
    wishlist[card.id] = card.wishlisted;
  })

  try {
    localStorage.setItem(
      wishlistStorageKey,
      JSON.stringify(wishlist)
    );
    return true;
  }
  catch (error) {
    console.error("Could not save wishlist:", error);
    return false;
  }
}

wishlistFilter.addEventListener("change", () => {
  renderCards(allCards);
});

function isValidcardChoices(choices){
  return choices !== null &&
  typeof choices === "object" && !Array.isArray(choices) && Object.entries(choices).every(([id, value]) => 
  id.trim().length > 0 && typeof value === "boolean"
  );
}

function saveImportedChoices(ownership, wishlist) {
  const ownershipJSON = JSON.stringify(ownership);
  const wishlistJSON = JSON.stringify(wishlist);
  const previousWishlist = localStorage.getItem(wishlistStorageKey);

  localStorage.setItem(wishlistStorageKey, wishlistJSON);

  try {
    localStorage.setItem(ownershipstorageKey, ownershipJSON);
  } catch (error) {
    try {
      if (previousWishlist === null) {
        localStorage.removeItem(wishlistStorageKey);
      } else {
        localStorage.setItem(wishlistStorageKey, previousWishlist);
      }
    } catch (restoreError) {
        console.error("Could not restore wishlist:", restoreError);
        throw new Error("Import only partially saved. Export only the current collection before refreshing to preserve your choices.");
    }
    throw error;
  }
}

function populateVersionFilter(cards) {
  const releaseCards = cards.filter((card) =>
    releaseFilter.value === "all" || releaseFilter.value
  );

  const versions = [
    ...new Set(releaseCards.map((card) => card.version))
  ].filter((version) => version !== "");

  versions.sort()

  versionFilter.replaceChildren(
    new Option("All versions", "all")
  );

  versions.forEach((version) => {
    versionFilter.add(new Option(version, version));
  });
}

versionFilter.addEventListener("change", () => {
  renderCards(allCards);
});

function renderReleaseProgress(cards) {
  const releases = new Map();

  cards.forEach((card) => {
    if (!releases.has(card.release)) {
      releases.set(card.release, { total: 0, owned: 0 });
    }

    const counter = releases.get(card.release);
    counter.total += 1;

    if (card.owned) {
      counter.owned += 1;
    }
  });

  releaseProgressList.replaceChildren();

  const sortedReleases = [...releases.entries()].sort(
    ([nameA], [nameB]) => nameA.localeCompare(nameB)
  );

  sortedReleases.forEach(([release, counter]) => {
    const percentage = Math.round(
      (counter.owned / counter.total) * 100
    );

    const row = document.createElement("div");
    row.className = "release-progress-row";

    const label = document.createElement("div");
    label.className = "release-progress-label";

    const name = document.createElement("span");
    name.textContent = release;

    const count = document.createElement("span");
    count.textContent =
      `${counter.owned} / ${counter.total} owned ~ ${percentage}%`;

    const progress = document.createElement("progress");
    progress.max = counter.total;
    progress.value = counter.owned;
    progress.setAttribute("aria-label", `${release} collection completion`);

    label.append(name, count);
    row.append(label, progress);
    releaseProgressList.append(row);
  });
}

function updateMemberButtons() {
  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === activeFilter;

    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected))
  })
}