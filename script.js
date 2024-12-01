let bookList = [];

// Load the library from local storage on page load
window.onload = () => {
  const storedLibrary = localStorage.getItem('bookLibrary');
  if (storedLibrary) {
    bookList = JSON.parse(storedLibrary);
    updateDisplay();
  }
};

// Save the library to local storage whenever it changes
function saveLibraryToLocalStorage() {
  localStorage.setItem('bookLibrary', JSON.stringify(bookList));
}

// Initialize scanner when the button is clicked
document.getElementById("start-scanner").addEventListener("click", () => {
  const scanner = document.getElementById("barcode-scanner");
  scanner.style.display = "block";
  initializeScanner();
});

// Initialize Quagga for barcode scanning
function initializeScanner() {
  Quagga.init(
    {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector("#barcode-scanner"), // The element where the video will be displayed
        constraints: {
          facingMode: "environment", // Prefer rear camera for scanning
        },
      },
      decoder: {
        readers: ["ean_reader"], // For ISBN barcodes (EAN)
      },
      locate: true,
    },
    function (err) {
      if (err) {
        console.error("Error initializing scanner:", err);
        alert("Error initializing scanner. Please check console for details.");
        return;
      }
      Quagga.start(); // Start the scanner
    }
  );

  // Process the barcode once it's detected
  Quagga.onDetected((result) => {
    const isbn = result.codeResult.code;
    if (isbn) {
      console.log("Barcode detected:", isbn);
      fetchBookDetails(isbn);
      Quagga.stop(); // Stop scanning after detection
      document.getElementById("barcode-scanner").style.display = "none";
    }
  });
}

// Event listener for manual book title search
document.getElementById("search-book").addEventListener("click", () => {
  const title = document.getElementById("book-title").value.trim();
  if (title) {
    searchBookByTitle(title);
  } else {
    alert("Please enter a book title.");
  }
});

// Function to search for a book by its title using Google Books API
function searchBookByTitle(title) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.items && data.items.length > 0) {
        // Use the first book found
        const book = data.items[0].volumeInfo;
        addBookToSection(book);
      } else {
        console.error("Book not found");
        alert("Book not found. Please try another title.");
      }
    })
    .catch(err => {
      console.error("Error fetching book details:", err);
      alert("Error fetching book details. Please check console for details.");
    });
}

// Add book to the list and sort
function addBookToSection(book) {
  const bookDetails = {
    title: book.title,
    author: book.authors ? book.authors[0] : "Unknown Author",
    category: book.categories ? book.categories[0] : "General",
    dewey: book.industryIdentifiers ? getDeweyDecimal(book.industryIdentifiers) : "N/A",
    coverImage: book.imageLinks ? book.imageLinks.thumbnail : "https://via.placeholder.com/128x195?text=No+Cover"
  };

  bookList.push(bookDetails);

  // Sort alphabetically by title
  bookList.sort((a, b) => a.title.localeCompare(b.title));

  saveLibraryToLocalStorage();  // Save changes to local storage
  updateDisplay();
}

// Function to get Dewey Decimal from the identifiers
function getDeweyDecimal(identifiers) {
  // This function assumes identifiers contain Dewey; you might have to customize this based on actual data structure.
  const deweyIdentifier = identifiers.find(identifier => identifier.type === "DEWEY");
  return deweyIdentifier ? deweyIdentifier.identifier : "N/A";
}

// Update the displayed book list
function updateDisplay() {
  const listElement = document.getElementById("book-list");
  listElement.innerHTML = "";

  bookList.forEach((book, index) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <img src="${book.coverImage}" alt="${book.title} cover" style="width: 100px; height: auto; vertical-align: middle; margin-right: 10px;">
      <b>${book.title}</b> by ${book.author} <br>
      <i>Category: ${book.category}</i>, Dewey Decimal: ${book.dewey} <br>
      <button onclick="deleteBook(${index})">Delete</button>
    `;
    listElement.appendChild(listItem);
  });

  // Enable the "Generate Labels" button once books are added
  document.getElementById("generate-labels").style.display = bookList.length > 0 ? "block" : "none";
}

// Delete book from the list
function deleteBook(index) {
  bookList.splice(index, 1);
  saveLibraryToLocalStorage();  // Save changes to local storage
  updateDisplay();
}

// Generate printable labels
document.getElementById("generate-labels").addEventListener("click", () => {
  const labelsContainer = document.getElementById("labels");
  labelsContainer.innerHTML = "";

  bookList.forEach((book) => {
    const label = document.createElement("div");
    label.className = "label";
    label.innerHTML = `
      <img src="${book.coverImage}" alt="${book.title} cover" style="width: 50px; height: auto; vertical-align: middle; margin-bottom: 10px;">
      <p><b>${truncate(book.title, 20)}</b></p>
      <p>${book.author}</p>
      <p>${book.category}</p>
      <p>Dewey Decimal: ${book.dewey}</p>
    `;
    labelsContainer.appendChild(label);
  });

  document.getElementById("labels-container").style.display = "block";
});

// Helper to truncate long titles
function truncate(str, length) {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

// Print labels
document.getElementById("print-labels").addEventListener("click", () => {
  window.print();
});

// Export the library to a JSON file
document.getElementById("export-library").addEventListener("click", () => {
  const dataStr = JSON.stringify(bookList, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "bookLibrary.json";
  a.click();

  URL.revokeObjectURL(url);
});

// Import the library from a JSON file
document.getElementById("import-library").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          bookList = importedData;
          saveLibraryToLocalStorage();  // Save imported data to local storage
          updateDisplay();  // Update the display with the imported data
        } else {
          alert("Invalid file format. Please select a valid JSON file.");
        }
      } catch (error) {
        alert("Error reading file. Please ensure it is a valid JSON file.");
      }
    };
    reader.readAsText(file);
  }
});
