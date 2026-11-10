import FavoriteButton from '../common/FavoriteButton'
import { formatPrice, truncate } from '../../utils/helpers'
import { Share2 } from 'lucide-react'
import { shareCatalog } from '../../utils/share'

/**
 * Product card used in the catalog grid.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onSelect  — called with the gun when clicked
 * @param {Function} [props.onEdit]  — called when Edit is clicked (admin)
 * @param {Function} [props.onDelete]— called when Delete is clicked (admin)
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete, onArchive }) {
  const imageUrls = Array.isArray(gun.image_urls) && gun.image_urls.length > 0
    ? gun.image_urls
    : [gun.image_url || gun.image || '/guns/pistol.svg']
  const imgSrc = imageUrls[0]
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0
  const handleShare = async (event) => {
    event.stopPropagation()
    try {
      await shareCatalog(gun)
    } catch (error) {
      if (error?.name !== 'AbortError') window.alert(error.message || 'Unable to share catalog.')
    }
  }

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <img
          className="card-img"
          src={imgSrc}
          alt={gun.name}
          width="240"
          height="180"
          loading="lazy"
          decoding="async"
        />
        {imageUrls.length > 1 && (
          <span className="card-gallery" aria-label={`${imageUrls.length} catalog images`}>
            {imageUrls.slice(0, 4).map((url, index) => (
              <img
                key={`${url}-${index}`}
                className="card-gallery-thumb"
                src={url}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ))}
            {imageUrls.length > 4 && (
              <span className="card-gallery-more">+{imageUrls.length - 4}</span>
            )}
          </span>
        )}

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />
        {gun.id && (
          <button
            type="button"
            className="card-act-btn"
            onClick={handleShare}
            aria-label={`Share ${gun.name}`}
            title="Share catalog"
          >
            <Share2 size={16} />
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
            aria-label={`Delete ${gun.name}`}
            title="Delete"
          >
            🗑️
          </button>
        )}
        {onArchive && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onArchive(gun) }}
            aria-label={`Archive ${gun.name}`}
            title="Archive"
          >
            📦
          </button>
        )}
      </div>
    </li>
  )
}
