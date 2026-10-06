/** Reviews: written by a signed-in shopper, shown on the product at once, hidden by management. */

export function validateReview({ rating, text }) {
  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return { ok: false, reason: 'rating', message: 'Choose a rating — a whole number of stars from 1 to 5.' };
  }
  if (!String(text || '').trim()) {
    return { ok: false, reason: 'text', message: 'Write your review before you submit it — an empty one cannot be saved.' };
  }
  return { ok: true, rating: value, review_text: String(text).trim() };
}

export function ratingSummary(reviews) {
  const shown = (reviews || []).filter((review) => review.visibility !== 'hidden');
  if (!shown.length) return { count: 0, average: 0, bars: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percent: 0 })) };
  const total = shown.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return {
    count: shown.length,
    average: Math.round((total / shown.length) * 10) / 10,
    bars: [5, 4, 3, 2, 1].map((star) => {
      const count = shown.filter((review) => Number(review.rating) === star).length;
      return { star, count, percent: Math.round((count / shown.length) * 100) };
    }),
  };
}
