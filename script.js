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
        target: document.querySelector("#barcode-scanner"), // Display video preview here
        constraints: {
          width: { ideal: 1280 }, // Ideal width for the video stream
          height: { ideal: 720 }, // Ideal height for the video stream
          facingMode: "environment", // Use rear camera
        },
      },
      decoder: {
        readers: ["ean_reader"], // For ISBN barcodes
      },
    },
    function (err) {
      if (err) {
        console.error("Error initializing scanner:", err);
        alert("Error initializing scanner. Check console for details.");
        return;
      }
      Quagga.start(); // Start the scanner
    }
  );

  Quagga.onProcessed(function (result) {
    const drawingCanvas = Quagga.canvas.dom.overlay;
    const drawingContext = Quagga.canvas.ctx.overlay;

    if (result) {
      drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      if (result.boxes) {
        result.boxes
          .filter((box) => box !== result.box)
          .forEach((box) => {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingContext, {
              color: "green",
              lineWidth: 2,
            });
          });
      }
    }
  });

  Quagga.onDetected((result) => {
    const isbn = result.codeResult.code;
    fetchBookDetails(isbn);
    Quagga.stop(); // Stop scanning after detection
    document.getElementById("barcode-scanner").style.display = "none";
  });
}

// Fetch book details using Google Books API
function fetchBookDetails(isbn) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        addBookToSection(book);
      } else {
        console.error("Book not found");
      }
    })
    .catch((err) => console.error(err));
}

// Add book to the list and sort
function addBookToSection(book) {
  const bookDetails = {
    title: book.title,
    author: book.authors ? book.authors[0] : "Unknown Author",
    category: book.categories ? book.categories[0] : "General",
  };

  bookList.push(bookDetails);

  // Sort alphabetically by title
  bookList.sort((a, b) => a.title.localeCompare(b.title));

  updateDisplay();
}

// Update the displayed book list
function updateDisplay() {
  const listElement = document.getElementById("book-list");
  listElement.innerHTML = "";

  bookList.forEach((book) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${book.title} by ${book.author}`;
    listElement.appendChild(listItem);
  });
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
