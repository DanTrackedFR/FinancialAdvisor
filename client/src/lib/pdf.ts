import * as pdfjs from "pdfjs-dist";
import { createWorker } from "tesseract.js";

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

    // First try normal text extraction
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent({
        disableCombineTextItems: false,
      });
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ")
        .trim();
      text += pageText + "\n";
      totalCharacters += pageText.length;
    }

    const averageCharsPerPage = totalCharacters / pdf.numPages;

    // If very little text was found, try OCR
    if (averageCharsPerPage < 50) {
      console.log("Document appears to be scanned, attempting OCR...");

      // Initialize Tesseract worker
      const worker = await createWorker('eng');

      let ocrText = "";

      // Process each page with OCR
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`OCR processing page ${i} of ${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

        // Create a canvas to render the PDF page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (!context) throw new Error("Could not create canvas context");

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        // Perform OCR on the rendered page
        const { data: { text: pageText } } = await worker.recognize(canvas);
        ocrText += pageText + "\n";
      }

      // Clean up worker
      await worker.terminate();

      if (!ocrText.trim()) {
        throw new Error("No text could be extracted from the PDF, even after OCR processing.");
      }

      return ocrText.trim();
    }

    const finalText = text.trim();
    if (!finalText) {
      throw new Error("No text could be extracted from this PDF.");
    }

    return finalText;
  } catch (error: unknown) {
    console.error("PDF extraction failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}