import * as pdfjs from "pdfjs-dist";
import { createWorker } from "tesseract.js";

// Use CDN as a fallback approach, but with a more reliable domain
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js";

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("Starting PDF extraction for:", file.name);
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    console.log("Loading PDF document...");
    
    const pdf = await pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 0,
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/",
      cMapPacked: true,
      disableFontFace: true, // Improve compatibility
      standardFontDataUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/standard_fonts/",
    }).promise;

    console.log(`PDF loaded successfully. Total pages: ${pdf.numPages}`);

    let text = "";
    let totalCharacters = 0;

    // First try normal text extraction
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      // Handle API changes in v4.10.38
      const content = await page.getTextContent();
      // Extract text from items (structure might change between versions)
      const pageText = content.items
        .map((item: any) => item.str || item.text || "")
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
        });

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
    // Provide more detailed error information
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.log("Error details:", error.name, error.message, (error as any).details || '');
    }
    
    // Check for various PDF loading errors and provide friendly messages
    if (errorMessage.includes("API version") && errorMessage.includes("Worker version")) {
      throw new Error(`PDF.js version mismatch: ${errorMessage}. Please try refreshing the page.`);
    } else if (errorMessage.includes("Failed to fetch")) {
      // This is likely a network issue with loading resources
      throw new Error(`Network error loading PDF resources. Please check your internet connection and try again.`);
    } else if (errorMessage.includes("InvalidPDFException")) {
      throw new Error(`The file does not appear to be a valid PDF document. Please upload a valid PDF file.`);
    } else if (errorMessage.includes("PasswordException")) {
      throw new Error(`This PDF is password protected. Please upload an unprotected PDF file.`);
    }
    
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}