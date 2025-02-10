import * as pdfjs from "pdfjs-dist";

// Set up PDF.js worker with a static configuration
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("Starting PDF extraction for:", file.name);
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    console.log("Loading PDF document...");
    const pdf = await pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 0,
      cMapUrl: `https://unpkg.com/pdfjs-dist@3.11.174/cmaps/`,
      cMapPacked: true,
      disableFontFace: true, // Improve compatibility
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/`,
    }).promise;

    console.log(`PDF loaded successfully. Total pages: ${pdf.numPages}`);

    let text = "";
    let totalCharacters = 0;

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ")
        .trim();
      text += pageText + "\n";
      totalCharacters += pageText.length;
    }

    const finalText = text.trim();
    console.log("PDF extraction completed successfully");

    // Check if the document appears to be scanned
    // A scanned document typically has very little or no extractable text
    const averageCharsPerPage = totalCharacters / pdf.numPages;
    if (averageCharsPerPage < 50) { // Threshold for detecting scanned documents
      throw new Error(
        "This appears to be a scanned document. Currently, we can only process PDFs with selectable text. " +
        "To analyze this document, please:\n" +
        "1. Use OCR software to convert it to searchable PDF\n" +
        "2. Save the Word document as PDF instead of scanning\n" +
        "3. Ensure the PDF contains selectable text"
      );
    }

    if (!finalText) {
      throw new Error("No text could be extracted from this PDF. Please ensure the document contains selectable text.");
    }

    return finalText;
  } catch (error: unknown) {
    console.error("PDF extraction failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}