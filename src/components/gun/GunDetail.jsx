import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  Archive,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import reviewService from '../../services/reviewService'
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
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const images = Array.isArray(gun.images) && gun.images.length ? gun.images : [imgSrc]
  const [activeImage, setActiveImage] = useState(0)
  const activeImageIndex = Math.min(activeImage, images.length - 1)
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Reviews
  const reviewId = String(gun.id || '').startsWith('local-') ? null : gun.id
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(reviewId)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [editingReview, setEditingReview] = useState(null)
  const [reviewMutationError, setReviewMutationError] = useState('')
  const [openReviewMenu, setOpenReviewMenu] = useState(null)
  const [shareFeedback, setShareFeedback] = useState('')

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

    try {
      const result = editingReview
        ? await reviewService.updateReview(editingReview.id, {
          rating,
          comment: comment.trim(),
        })
        : await createReview(gun.id, {
          user_identifier: getUserIdentifier(),
          rating,
          comment: comment.trim(),
        })

      if (result) {
        setReviewSuccess(editingReview ? 'Review updated!' : 'Review submitted!')
        setComment('')
        setRating(5)
        setEditingReview(null)
        refetchReviews()
      } else {
        setReviewError('Could not submit review. The server may be unavailable.')
      }
    } catch (error) {
      setReviewError(error.message || 'Could not update review.')
    }
  }

  const handleDeleteReview = async (review) => {
    setOpenReviewMenu(null)
    if (!window.confirm('Delete this review permanently?')) return
    try {
      await reviewService.deleteReview(review.id)
      refetchReviews()
    } catch (error) {
      setReviewMutationError(error.message || 'Could not delete review.')
    }
  }

  const handleReaction = async (review, reaction) => {
    try {
      setReviewMutationError('')
      await reviewService.reactToReview(
        review.id,
        review.user_reaction === reaction ? null : reaction,
        getUserIdentifier(),
      )
      refetchReviews()
    } catch (error) {
      setReviewMutationError(error.message || 'Could not update review reaction.')
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
          <div className="detail-gallery-stage">
            <img
              className="detail-img"
              src={images[activeImageIndex]}
              alt={`${gun.name} view ${activeImageIndex + 1} of ${images.length}`}
              width="520"
              height="390"
              loading="eager"
              decoding="async"
            />
            {images.length > 1 && (
              <>
                <button type="button" className="detail-gallery-control detail-gallery-control--prev" onClick={() => setActiveImage((index) => (index - 1 + images.length) % images.length)} aria-label="Previous catalog image">
                  <ChevronLeft size={22} />
                </button>
                <button type="button" className="detail-gallery-control detail-gallery-control--next" onClick={() => setActiveImage((index) => (index + 1) % images.length)} aria-label="Next catalog image">
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="detail-gallery-dots" role="tablist" aria-label="Catalog images">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`detail-gallery-dot ${index === activeImageIndex ? 'detail-gallery-dot--active' : ''}`}
                  onClick={() => setActiveImage(index)}
                  role="tab"
                  aria-selected={index === activeImageIndex}
                  aria-label={`Show catalog image ${index + 1}`}
                />
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
            <button
              type="button"
              className="btn btn--outline"
              onClick={async () => {
                try {
                  const result = await shareCatalog(gun)
                  setShareFeedback(result === 'shared' ? 'Catalog shared.' : 'Catalog link copied.')
                  window.dispatchEvent(new CustomEvent('catalog:feedback', {
                    detail: result === 'shared' ? 'Catalog shared.' : 'Catalog link copied.',
                  }))
                } catch (error) {
                  if (error?.name !== 'AbortError') {
                    setShareFeedback(error.message || 'Unable to share catalog.')
                    window.dispatchEvent(new CustomEvent('catalog:feedback', {
                      detail: error.message || 'Unable to share catalog.',
                      error: true,
                    }))
                  }
                }
              }}
            >
              <Share2 size={16} /> Share
            </button>
            {onArchive && (
              <button type="button" className="btn btn--outline" onClick={() => onArchive(gun)}>
                <Archive size={16} /> Archive
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
          </div>
        </div>
      </div>
      {shareFeedback && <p className="form-success" role="status">{shareFeedback}</p>}

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
              <><Send size={16} /> {editingReview ? 'Update Review' : 'Submit Review'}</>
            )}
          </button>
          {editingReview && (
            <button type="button" className="btn btn--outline" onClick={() => {
              setEditingReview(null)
              setComment('')
              setRating(5)
            }}>
              Cancel Edit
            </button>
          )}

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {reviewMutationError && <p className="form-error">{reviewMutationError}</p>}
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
            {reviews.map((rev) => {
              const isOwnReview = (rev.owner_id && String(rev.owner_id) === String(getUserIdentifier()))
                || (!rev.owner_id && String(rev.user_identifier) === String(getUserIdentifier()))
              return (
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
                <div className="review-controls">
                  <button
                    type="button"
                    className={`btn btn--outline btn--sm${rev.user_reaction === 'like' ? ' review-reaction--active' : ''}`}
                    onClick={() => handleReaction(rev, 'like')}
                    aria-pressed={rev.user_reaction === 'like'}
                  >
                    👍 {rev.likes || 0}
                  </button>
                  <button
                    type="button"
                    className={`btn btn--outline btn--sm${rev.user_reaction === 'dislike' ? ' review-reaction--active' : ''}`}
                    onClick={() => handleReaction(rev, 'dislike')}
                    aria-pressed={rev.user_reaction === 'dislike'}
                  >
                    👎 {rev.dislikes || 0}
                  </button>
                  {isOwnReview && (
                    <div className="review-menu">
                      <button
                        type="button"
                        className="btn btn--outline btn--sm review-menu-trigger"
                        aria-label={`Review options for ${rev.user_identifier || 'your review'}`}
                        aria-expanded={openReviewMenu === rev.id}
                        onClick={() => setOpenReviewMenu(openReviewMenu === rev.id ? null : rev.id)}
                      >
                        <MoreVertical size={17} />
                      </button>
                      {openReviewMenu === rev.id && (
                        <div className="review-menu-popover" role="menu">
                          <button type="button" role="menuitem" onClick={() => {
                            setEditingReview(rev)
                            setRating(rev.rating)
                            setComment(rev.comment || '')
                            setOpenReviewMenu(null)
                          }}>Edit</button>
                          <button type="button" role="menuitem" onClick={() => handleDeleteReview(rev)}>Delete</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
