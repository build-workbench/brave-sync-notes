/**
 * Text highlighting utilities for search results
 */

/**
 * Highlight matched text in a string with mark tags
 * @param {string} text - Original text
 * @param {string} query - Search query to highlight
 * @param {Object} options - Highlight options
 * @param {string} options.highlightClassName - CSS class for highlighted text
 * @param {boolean} options.caseSensitive - Case sensitive matching (default: false)
 * @returns {string} HTML string with highlighted matches
 */
export function highlightText(text, query, options = {}) {
  if (!text || !query || query.trim() === '') {
    return text || '';
  }

  const {
    highlightClassName = 'bg-orange-500/30 text-orange-600 dark:text-orange-400 px-0.5 rounded',
    caseSensitive = false,
  } = options;

  // Escape special regex characters in query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create regex with optional case sensitivity
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escapedQuery})`, flags);

  // Split text by matches and wrap matches in mark tags
  const parts = text.split(regex);

  // Build result with highlighted matches
  return parts
    .map((part) => {
      // Check if this part matches the query
      const isMatch = caseSensitive
        ? part === query
        : part.toLowerCase() === query.toLowerCase();

      if (isMatch) {
        return `<mark class="${highlightClassName}">${escapeHtml(part)}</mark>`;
      }

      return escapeHtml(part);
    })
    .join('');
}

/**
 * Highlight multiple search terms
 * @param {string} text - Original text
 * @param {string[]} terms - Array of search terms
 * @param {Object} options - Highlight options
 * @returns {string} HTML string with highlighted matches
 */
export function highlightMultipleTerms(text, terms, options = {}) {
  if (!text || !terms || terms.length === 0) {
    return text || '';
  }

  const {
    highlightClassName = 'bg-orange-500/30 text-orange-600 dark:text-orange-400 px-0.5 rounded',
    caseSensitive = false,
  } = options;

  // Filter out empty terms
  const validTerms = terms.filter((term) => term && term.trim() !== '');

  if (validTerms.length === 0) {
    return text;
  }

  // Escape special regex characters in all terms
  const escapedTerms = validTerms.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  // Create regex that matches any term
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escapedTerms.join('|')})`, flags);

  // Split and highlight
  const parts = text.split(regex);

  return parts
    .map((part) => {
      const isMatch = caseSensitive
        ? validTerms.includes(part)
        : validTerms.some((term) => part.toLowerCase() === term.toLowerCase());

      if (isMatch) {
        return `<mark class="${highlightClassName}">${escapeHtml(part)}</mark>`;
      }

      return escapeHtml(part);
    })
    .join('');
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Get content preview with highlighted match
 * @param {string} content - Full content
 * @param {string} query - Search query
 * @param {number} maxLength - Maximum preview length (default: 100)
 * @returns {string} Preview text with highlighted match
 */
export function getContentPreview(content, query, maxLength = 100) {
  if (!content) {
    return '';
  }

  if (!query || query.trim() === '') {
    const stripped = content.replace(/[#*_`[\]]/g, '').trim();
    return stripped.length > maxLength
      ? stripped.substring(0, maxLength) + '...'
      : stripped;
  }

  // Find the position of the query in content
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerContent.indexOf(lowerQuery);

  if (matchIndex === -1) {
    // No match found, return beginning of content
    const stripped = content.replace(/[#*_`[\]]/g, '').trim();
    return stripped.length > maxLength
      ? stripped.substring(0, maxLength) + '...'
      : stripped;
  }

  // Calculate window around the match
  const windowStart = Math.max(0, matchIndex - Math.floor(maxLength / 2));
  const windowEnd = Math.min(
    content.length,
    matchIndex + query.length + Math.floor(maxLength / 2)
  );

  // Extract window
  let preview = content.substring(windowStart, windowEnd);

  // Add ellipsis if truncated
  if (windowStart > 0) {
    preview = '...' + preview;
  }
  if (windowEnd < content.length) {
    preview = preview + '...';
  }

  // Strip markdown syntax for cleaner preview
  preview = preview.replace(/[#*_`[\]]/g, '').trim();

  return preview;
}

/**
 * React component for highlighted text
 * @param {Object} props - Component props
 * @param {string} props.text - Text to display
 * @param {string} props.query - Search query to highlight
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Span with highlighted text
 */
export function HighlightedText({ text, query, className = '' }) {
  if (!text) {
    return null;
  }

  if (!query || query.trim() === '') {
    return <span className={className}>{text}</span>;
  }

  const highlightedHtml = highlightText(text, query);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
}
