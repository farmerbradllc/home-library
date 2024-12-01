let bookList = [];

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
  };

  bookList.push(bookDetails);

  // Sort alphabetically by title
  bookList.sort((a, b) => a.title.localeCompare(b.title));

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
