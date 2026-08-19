/**
 * QuickSort Module
 * 
 * Custom implementation of QuickSort algorithm for sorting:
 * 1. Habits by priority level
 * 2. Recommendations by relevance score (descending)
 * 
 * Implementation specifications:
 * - Algorithm: QuickSort
 * - Pivot Strategy: Median-of-Three
 * - Partition Scheme: Lomuto
 */

/**
 * Helper to swap elements in an array and track metrics
 */
function swap(arr, i, j, metrics) {
  if (i !== j) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
    metrics.swaps++;
  }
}

/**
 * Select pivot using Median-of-Three strategy
 */
function medianOfThree(arr, low, high, compareFn, metrics) {
  const mid = Math.floor((low + high) / 2);

  // Compare and swap low and mid
  metrics.comparisons++;
  if (compareFn(arr[mid], arr[low]) < 0) {
    swap(arr, low, mid, metrics);
  }

  // Compare and swap low and high
  metrics.comparisons++;
  if (compareFn(arr[high], arr[low]) < 0) {
    swap(arr, low, high, metrics);
  }

  // Compare and swap mid and high
  metrics.comparisons++;
  if (compareFn(arr[high], arr[mid]) < 0) {
    swap(arr, mid, high, metrics);
  }

  // Pivot is now at mid. Swap it with high to prep for Lomuto partition
  swap(arr, mid, high, metrics);

  return arr[high]; // return the pivot value
}

/**
 * Lomuto Partition Scheme
 */
function lomutoPartition(arr, low, high, compareFn, metrics) {
  const pivot = medianOfThree(arr, low, high, compareFn, metrics);
  let i = low;

  for (let j = low; j < high; j++) {
    metrics.comparisons++;
    if (compareFn(arr[j], pivot) <= 0) {
      swap(arr, i, j, metrics);
      i++;
    }
  }
  swap(arr, i, high, metrics);
  return i;
}

/**
 * QuickSort recursive function
 */
function quickSortRecursive(arr, low, high, compareFn, metrics) {
  if (low < high) {
    const pi = lomutoPartition(arr, low, high, compareFn, metrics);
    quickSortRecursive(arr, low, pi - 1, compareFn, metrics);
    quickSortRecursive(arr, pi + 1, high, compareFn, metrics);
  }
}

/**
 * QuickSort - Main entry point
 * 
 * @param {Array} arr - The array to sort
 * @param {Function} compareFn - Comparison function (a, b) => number
 * @returns {Object} { sortedArray, metrics }
 */
function quickSort(arr, compareFn) {
  const metrics = {
    comparisons: 0,
    swaps: 0,
    executionTimeMs: 0
  };

  if (!arr) {
    return { sortedArray: [], metrics };
  }

  // Work on a shallow copy to prevent original array mutation
  const sortedArray = [...arr];

  if (sortedArray.length <= 1) {
    return { sortedArray, metrics };
  }

  const start = performance.now();
  quickSortRecursive(sortedArray, 0, sortedArray.length - 1, compareFn, metrics);
  const end = performance.now();

  metrics.executionTimeMs = end - start;

  return { sortedArray, metrics };
}

module.exports = {
  quickSort,
  // Exported for testing purposes
  _medianOfThree: medianOfThree,
  _lomutoPartition: lomutoPartition,
};
