// src/services/searchService.js
// Basic search implementation pattern.
// In production, integrate Algolia or Typesense.

import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export const searchService = {
  /**
   * Search Instructors (Simple Name Match)
   * Firestore doesn't support full-text search locally.
   * This is a "starts-with" search pattern.
   */
  searchInstructors: async (searchTerm) => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const term = searchTerm.toLowerCase(); // Requires 'searchKey' or similar in DB for robust match
      // Basic implementation: Fetch recent/top and filter client side if dataset small
      // OR use >= and <= pattern on a 'slug' field.
      
      const strFrontCode = term.slice(0, term.length - 1);
      const strEndCode = term.slice(term.length - 1, term.length);
      const endCode = strFrontCode + String.fromCharCode(strEndCode.charCodeAt(0) + 1);
      
      // Assuming 'fullName' is the field, but Firestore is case-sensitive.
      // We need a 'searchName' (lowercase) field for this to work well.
      // For now, returning empty to indicate 'Implementation Pending Indexing'.
      console.warn("Search requires 'searchName' (lowercase) field index.");
      
      return [];
  },
  
  /**
   * Generate PDF Report (Stub)
   * Use 'jspdf' and 'jspdf-autotable' in production.
   */
  generateReport: async (instructorId) => {
      console.log(`Generating report for ${instructorId}...`);
      // 1. Fetch Stats
      // 2. Fetch Remarks
      // 3. new jsPDF()...
      return true;
  }
};
