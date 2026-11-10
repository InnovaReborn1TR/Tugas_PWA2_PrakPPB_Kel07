import { useState } from 'react'
import { ArrowLeft, Star, Send, Loader, Share2 } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import reviewService from '../../services/reviewService'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import { shareCatalog } from '../../utils/share'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger delete flow
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete, onArchive }) {
  const imageUrls = Array.isArray(gun.image_urls) && gun.image_urls.length > 0
    ? gun.image_urls
    : [gun.image_url || gun.image || '/guns/pistol.svg']
  const [selectedImage, setSelectedImage] = useState(imageUrls[0])
  const imgSrc = selectedImage || imageUrls[0]
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [editingReview, setEditingReview] = useState(null)
  const [reviewVotes, setReviewVotes] = useState({})

  const handleShare = async () => {
    try {
      const result = await shareCatalog(gun)
      setShareMessage(result === 'copied' ? 'Catalog link copied.' : 'Catalog shared.')
      setTimeout(() => setShareMessage(''), 2500)
    } catch (error) {
      if (error?.name !== 'AbortError') setShareMessage(error.message || 'Unable to share catalog.')
    }
  }

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const handleUpdateReview = async (event) => {
    event.preventDefault()
    if (!editingReview) return
    try {
      await reviewService.updateReview(editingReview.id, editingReview)
      setEditingReview(null)
      refetchReviews()
    } catch (error) {
      setReviewError(error.message || 'Could not update review.')
    }
  }

  const handleVote = async (review, vote) => {
    const current = reviewVotes[review.id]
    const next = current === vote ? null : vote
    setReviewVotes((votes) => ({ ...votes, [review.id]: next }))
    if (next) {
      try {
        await reviewService.voteReview(review.id, next)
      } catch {
        // Keep the local vote usable when the optional vote endpoint is unavailable.
      }
    }
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-gallery">
          <img className="detail-img" src={imgSrc} alt={gun.name} decoding="async" />
          {imageUrls.length > 1 && (
            <div className="detail-gallery-thumbs" aria-label="Catalog images">
              {imageUrls.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  className={`detail-gallery-thumb ${url === selectedImage ? 'active' : ''}`}
                  onClick={() => setSelectedImage(url)}
                  aria-label={`Show image ${index + 1} of ${gun.name}`}
                  aria-pressed={url === selectedImage}
                >
                  <img src={url} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            {gun.id && (
              <button type="button" className="btn btn--outline" onClick={handleShare}>
                <Share2 size={16} /> Share
              </button>
            )}
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete
              </button>
            )}
            {onArchive && (
              <button type="button" className="btn btn--outline" onClick={() => onArchive(gun)}>
                Archive
              </button>
            )}
          </div>
          {shareMessage && <p className="form-success" role="status">{shareMessage}</p>}
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                  <span className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? 'var(--brass)' : 'none'}
                        stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                      />
                    ))}
                  </span>
                </div>
                {rev.comment && <p className="review-comment">{rev.comment}</p>}
                <div className="review-actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => handleVote(rev, 'like')} aria-pressed={reviewVotes[rev.id] === 'like'}>👍 {rev.likes || 0}</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => handleVote(rev, 'dislike')} aria-pressed={reviewVotes[rev.id] === 'dislike'}>👎 {rev.dislikes || 0}</button>
                  {(rev.owner_id === getUserIdentifier() || rev.user_identifier === getUserIdentifier()) && (
                    <>
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditingReview({ id: rev.id, rating: rev.rating, comment: rev.comment || '' })}>Edit</button>
                      <button type="button" className="btn btn--danger-ghost btn--sm" onClick={async () => { if (window.confirm('Delete this review?')) { await reviewService.deleteReview(rev.id); refetchReviews() } }}>Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
      {editingReview && (
        <div className="profile-modal-backdrop">
          <form className="profile-modal" onSubmit={handleUpdateReview}>
            <h2>Edit Review</h2>
            <label htmlFor="edit-review-comment" className="form-label">Comment</label>
            <textarea id="edit-review-comment" className="form-textarea" rows={4} value={editingReview.comment} onChange={(event) => setEditingReview({ ...editingReview, comment: event.target.value })} />
            <div className="form-actions-bar"><button type="button" className="btn btn--outline" onClick={() => setEditingReview(null)}>Cancel</button><button type="submit" className="btn btn--primary">Save Review</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
