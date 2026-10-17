// Cross-component requests that don't belong in props.

/** Ask the header to reveal (on small screens) and focus the search field. */
export const FOCUS_SEARCH = 'ddm:focus-search';
export const requestSearchFocus = () => window.dispatchEvent(new Event(FOCUS_SEARCH));
