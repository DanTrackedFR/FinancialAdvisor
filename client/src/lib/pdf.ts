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
    }

    const finalText = text.trim();
    console.log("PDF extraction completed successfully");

    if (!finalText) {
      throw new Error("This appears to be a scanned document. Currently, we can only process PDFs with selectable text. Please try a different PDF or convert your scanned document to text first.");
    }

    return finalText;
  } catch (error: unknown) {
    console.error("PDF extraction failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}