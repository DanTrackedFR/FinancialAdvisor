/**
 * Direct Configuration for PDF.js Worker
 * This file is served statically and helps ensure the worker is properly
 * loaded regardless of bundling issues in the main application.
 */

(function() {
  try {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      console.log('Setting up PDF.js worker configuration...');
      
      // Set worker source directly to CDN
      // Since our application specifically uses version 3.11.174, use that version directly
      // This avoids potential version mismatch issues and ensures consistency
      const defaultVersion = '3.11.174';
      const version = window.pdfjsLib.version || defaultVersion;
      console.log('Detected PDF.js version:', version);
      
      // Always use the known working version to avoid mismatches
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${defaultVersion}/build/pdf.worker.min.js`;
      
      // Optional: Set font support options
      window.pdfjsLib.GlobalWorkerOptions.StandardFontDataUrl = 
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${defaultVersion}/standard_fonts/`;
        
      console.log('PDF.js worker configured to use version:', defaultVersion);
      
      console.log('PDF.js worker successfully configured via static config script');
    } else {
      console.warn('PDF.js not found - worker config not applied');
    }
  } catch (error) {
    console.error('Error configuring PDF.js worker:', error);
  }
})();