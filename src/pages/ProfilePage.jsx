import { useState } from 'react'
import {
  Archive,
  Camera,
  Check,
  Copy,
  FileText,
  Heart,
  Pencil,
  Play,
  Shield,
  Trash2,
  RotateCcw,
  Save,
} from 'lucide-react'
import userService from '../services/userService'
import gunService from '../services/gunService'
import { useFavorites } from '../hooks/useFavorites'
import { useGuns } from '../hooks/useGuns'
import {
  deleteDraft,
  formatDraftTime,
  getAllDraftIds,
  getDraftTimestamp,
  loadDraft,
} from '../utils/draftStorage'
import { getArchivedIds, removeArchived } from '../utils/archiveStorage'
import About from './About'
import Contact from './Contact'
import GUNS_LOCAL from '../data/guns'

export default function ProfilePage({ onReplaySplash, onNavigate }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [, setDraftVersion] = useState(0)
  const [, setArchiveVersion] = useState(0)
  const { favorites } = useFavorites()
  const { guns } = useGuns({ limit: 50 })

  const draftIds = getAllDraftIds()
  const archivedIds = getArchivedIds()
  const localGuns = GUNS_LOCAL.map((gun, index) => ({ ...gun, id: gun.id || `local-${index}` }))
  const catalogGuns = [...guns, ...localGuns].filter((gun, index, list) => (
    list.findIndex((item) => String(item.id) === String(gun.id)) === index
  ))
  const archivedGuns = catalogGuns.filter((gun) => (
    gun.is_archived || archivedIds.includes(String(gun.id))
  ))

  const notify = (message) => {
    setFeedback(message)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleSaveProfile = (event) => {
    event.preventDefault()
    const result = userService.saveUserProfile({
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    })
    if (!result.success) {
      notify('Failed to save profile.')
      return
    }
    setProfile(result.data)
    setEditing(false)
    notify('Profile successfully updated.')
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      notify('Avatar image must be under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result)
      userService.updateAvatar(reader.result)
      notify('Avatar updated.')
    }
    reader.onerror = () => notify('Unable to read avatar image.')
    reader.readAsDataURL(file)
  }

  const handlePermanentDelete = async (gun) => {
    if (!window.confirm(`Permanently delete "${gun.name}"?`)) return
    try {
      if (!String(gun.id).startsWith('local-')) {
        await gunService.deleteGun(gun.id)
      }

      removeArchived(gun.id)
      setArchiveVersion((version) => version + 1)
      notify('Catalog permanently deleted.')
    } catch (error) {
      notify(error.message || 'Unable to permanently delete catalog.')
    }
  }

  const handleRestore = async (gun) => {
    try {
      if (!String(gun.id).startsWith('local-')) {
        await gunService.updateGun(gun.id, { is_archived: false })
      }
      removeArchived(gun.id)
      setArchiveVersion((version) => version + 1)
      notify('Catalog restored.')
    } catch (error) {
      notify(error.message || 'Unable to restore catalog.')
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead profile-heading">
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">Operator credentials, drafts, archives, and contact details.</p>
        </div>
        <div className="profile-heading-actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Edit Profile
          </button>
          {onReplaySplash && (
            <button type="button" className="btn btn--outline btn--sm" onClick={onReplaySplash}>
              <Play size={14} /> Replay Intro
            </button>
          )}
        </div>
      </section>

      {feedback && <div className="toast toast--success" role="status"><Check size={18} /> {feedback}</div>}

      <section className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {avatar ? <img src={avatar} alt={profile.username} className="avatar-img" /> : (
              <div className="avatar-placeholder"><Shield size={36} stroke="var(--brass)" /></div>
            )}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
              <Camera size={14} />
              <input id="avatar-file-input" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden-file-input" />
            </label>
          </div>
          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button type="button" className="icon-btn" onClick={() => {
                navigator.clipboard.writeText(profile.userId)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }} title="Copy User ID">
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item"><Heart size={20} className="stat-icon" stroke="var(--brass)" /><div className="stat-val">{favorites.length}</div><div className="stat-label">Favorites</div></div>
          <div className="stat-item"><FileText size={20} className="stat-icon" stroke="var(--steel)" /><div className="stat-val">{draftIds.length}</div><div className="stat-label">Drafts</div></div>
          <div className="stat-item"><Archive size={20} className="stat-icon" stroke="var(--steel)" /><div className="stat-val">{archivedGuns.length}</div><div className="stat-label">Archived</div></div>
        </div>
      </section>

      {editing && (
        <form onSubmit={handleSaveProfile} className="profile-form profile-edit-panel">
          <div className="section-title-row"><h2 className="section-title">Edit Profile</h2><button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(false)}>Cancel</button></div>
          <div className="form-group"><label htmlFor="prof-name" className="form-label">Callsign / Operator Alias</label><input id="prof-name" type="text" value={username} onChange={(event) => setUsername(event.target.value)} className="form-input" /></div>
          <div className="form-group"><label htmlFor="prof-bio" className="form-label">Armory Notes / Station Bio</label><textarea id="prof-bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className="form-textarea" /></div>
          <button type="submit" className="btn btn--primary"><Save size={16} /> Save Profile</button>
        </form>
      )}

      <section className="profile-section">
        <div className="section-title-row"><h2 className="section-title">Drafts</h2><span className="count">{draftIds.length}</span></div>
        {draftIds.length === 0 ? <p className="detail-empty">No saved catalog drafts.</p> : (
          <ul className="profile-list">{draftIds.map((id) => {
            const draft = loadDraft(id)
            return <li key={id} className="profile-list-item"><div><strong>{draft?.formData?.name || 'Untitled catalog'}</strong><small>Saved {formatDraftTime(getDraftTimestamp(id))}</small></div><div className="profile-list-actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => onNavigate?.(id === 'create' ? 'Create' : 'Edit', draft?.formData ? { id, ...draft.formData } : { id })}>Resume</button><button type="button" className="icon-btn" onClick={() => { deleteDraft(id); setDraftVersion((version) => version + 1) }} aria-label={`Delete draft ${id}`}><Trash2 size={15} /></button></div></li>
          })}</ul>
        )}
      </section>

      <section className="profile-section">
        <div className="section-title-row"><h2 className="section-title">Archived Catalogs</h2><span className="count">{archivedGuns.length}</span></div>
        {archivedGuns.length === 0 ? <p className="detail-empty">No archived catalogs.</p> : (
          <ul className="profile-list">{archivedGuns.map((gun) => <li key={gun.id} className="profile-list-item"><div><strong>{gun.name}</strong><small>{gun.type || 'Catalog'}</small></div><div className="profile-list-actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => handleRestore(gun)}><RotateCcw size={14} /> Restore</button><button type="button" className="btn btn--danger-ghost" onClick={() => handlePermanentDelete(gun)}><Trash2 size={14} /> Delete forever</button></div></li>)}</ul>
        )}
      </section>

      <section className="profile-info-grid">
        <About />
        <Contact />
      </section>
    </div>
  )
}
