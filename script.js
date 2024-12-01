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
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: { ideal: "environment" }, // Use rear camera on mobile
        },
      },
      decoder: {
        readers: ["ean_reader"], // For ISBN barcodes
      },
      locate: true, // Try to locate the barcode in the image
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

  // Display what is being processed by the scanner (debugging purposes)
  Quagga.onProcessed(function (result) {
    const drawingCanvas = Quagga.canvas.dom.overlay;
    const drawingContext = Quagga.canvas.ctx.overlay;

    if (result) {
      drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      if (result.boxes) {
        result.boxes.forEach((box) => {
          Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingContext, {
            color: "green",
            lineWidth: 2,
          });
        });
      }
      if (result.box) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingContext, {
          color: "#00F",
          lineWidth: 2,
        });
      }
      if (result.codeResult && result.codeResult.code) {
        Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingContext, {
          color: 'red',
          lineWidth: 3
        });
      }
    }
  });

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
        alert("Book not found. Please try another book.");
      }
    })
    .catch((err) => {
      console.error("Error fetching book details:", err);
      alert("Error fetching book details. Please check the console for details.");
    });
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
