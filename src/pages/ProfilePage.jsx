import { useMemo, useState } from 'react'
import { Camera, Check, Copy, FileText, Heart, Play, Shield, Trash2, RotateCcw, X } from 'lucide-react'
import userService from '../services/userService'
import gunService from '../services/gunService'
import { useFavorites } from '../hooks/useFavorites'
import { useGuns } from '../hooks/useGuns'
import { deleteDraft, formatDraftTime, getAllDraftIds, getDraftTimestamp, loadDraft } from '../utils/draftStorage'
import { getArchivedIds, setArchived } from '../utils/archiveStorage'

export default function ProfilePage({ onReplaySplash }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const { favorites } = useFavorites()
  const { guns, refetch } = useGuns({ limit: 100 })
  const [draftIds, setDraftIds] = useState(getAllDraftIds)
  const [archivedIds, setArchivedIds] = useState(getArchivedIds)

  const archived = useMemo(
    () => guns.filter((gun) => gun.is_archived || archivedIds.includes(String(gun.id))),
    [guns, archivedIds],
  )

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
    if (result.success) {
      setProfile(result.data)
      setEditing(false)
      notify('Profile successfully updated.')
    } else notify('Failed to save profile.')
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return notify('Avatar image must be under 2MB.')
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result)
      userService.updateAvatar(reader.result)
      notify('Avatar updated.')
    }
    reader.readAsDataURL(file)
  }

  const restore = async (gun) => {
    try {
      await gunService.restoreGun(gun.id)
      setArchived(gun.id, false)
      setArchivedIds(getArchivedIds())
      refetch()
      notify('Catalog restored.')
    } catch (error) {
      notify(error.message || 'Failed to restore catalog.')
    }
  }

  const permanentlyDelete = async (gun) => {
    if (!window.confirm(`Permanently delete "${gun.name}"?`)) return
    try {
      await gunService.deleteGun(gun.id)
      setArchived(gun.id, false)
      setArchivedIds(getArchivedIds())
      refetch()
      notify('Catalog permanently deleted.')
    } catch (error) {
      notify(error.message || 'Failed to permanently delete catalog.')
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead profile-heading">
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">Profile, drafts, archived catalogs, and contact information.</p>
        </div>
        <div className="profile-heading-actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(true)}>Edit Profile</button>
          {onReplaySplash && <button type="button" className="btn btn--outline btn--sm" onClick={onReplaySplash}><Play size={14} /> Replay Intro</button>}
        </div>
      </section>

      {feedback && <div className="toast toast--success" role="status"><Check size={18} /> {feedback}</div>}

      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {avatar ? <img src={avatar} alt={profile.username} className="avatar-img" /> : <div className="avatar-placeholder"><Shield size={36} stroke="var(--brass)" /></div>}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
              <Camera size={14} />
              <input id="avatar-file-input" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden-file-input" />
            </label>
          </div>
          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button type="button" className="icon-btn" onClick={() => { navigator.clipboard.writeText(profile.userId); setCopied(true); setTimeout(() => setCopied(false), 2000) }} title="Copy User ID">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item"><Heart size={20} className="stat-icon" stroke="var(--brass)" /><div className="stat-val">{favorites.length}</div><div className="stat-label">Favorites</div></div>
          <div className="stat-item"><FileText size={20} className="stat-icon" stroke="var(--steel)" /><div className="stat-val">{draftIds.length}</div><div className="stat-label">Drafts</div></div>
          <div className="stat-item"><Shield size={20} className="stat-icon" stroke="var(--steel)" /><div className="stat-val">{archived.length}</div><div className="stat-label">Archived</div></div>
        </div>
      </div>

      <section className="detail-section">
        <h2>Draft Catalogs</h2>
        {draftIds.length === 0 ? <p className="detail-empty">No saved drafts.</p> : (
          <ul className="profile-list">
            {draftIds.map((id) => {
              const draft = loadDraft(id)
              return <li key={id} className="profile-list-item"><div><strong>{draft?.formData?.name || 'New catalog draft'}</strong><small>Saved {formatDraftTime(getDraftTimestamp(id))}</small></div><button type="button" className="icon-btn" title="Delete draft" onClick={() => { deleteDraft(id); setDraftIds(getAllDraftIds()) }}><Trash2 size={16} /></button></li>
            })}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h2>Archived Catalogs</h2>
        {archived.length === 0 ? <p className="detail-empty">No archived catalogs.</p> : (
          <ul className="profile-list">
            {archived.map((gun) => <li key={gun.id} className="profile-list-item"><div><strong>{gun.name}</strong><small>{gun.type || gun.category || 'Catalog item'}</small></div><div className="profile-list-actions"><button type="button" className="icon-btn" title="Restore catalog" onClick={() => restore(gun)}><RotateCcw size={16} /></button><button type="button" className="icon-btn" title="Delete permanently" onClick={() => permanentlyDelete(gun)}><Trash2 size={16} /></button></div></li>)}
          </ul>
        )}
      </section>

      <section className="profile-info-grid">
        <div className="detail-section"><h2>About</h2><p>Bore &amp; Barrel is a focused catalog for firearms and equipment, with clear specifications and honest pricing.</p></div>
        <div className="detail-section"><h2>Contact</h2><p>123 Range Road. Open Tuesday to Saturday, 10 to 6. Call (555) 010-0100.</p></div>
      </section>

      {editing && <div className="profile-modal-backdrop" role="presentation"><form className="profile-modal" onSubmit={handleSaveProfile}><div className="profile-modal-head"><h2>Edit Profile</h2><button type="button" className="icon-btn" onClick={() => setEditing(false)} aria-label="Close edit profile"><X size={18} /></button></div><label htmlFor="prof-name" className="form-label">Callsign / Operator Alias</label><input id="prof-name" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} /><label htmlFor="prof-bio" className="form-label">Station Bio</label><textarea id="prof-bio" className="form-textarea" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /><div className="form-actions-bar"><button type="button" className="btn btn--outline" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="btn btn--primary">Save Profile</button></div></form></div>}
    </div>
  )
}
