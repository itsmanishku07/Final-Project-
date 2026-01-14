import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/FirebaseAuthContext'
import api from '../services/api'
import AILoadingAnimation from '../components/AILoadingAnimation'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  User, Mail, Phone, MapPin, Linkedin, Github, Globe, 
  Briefcase, Edit3, Save, X, ExternalLink, Plus, Trash2, 
  GraduationCap, Building, Code, ChevronDown, RefreshCw, FileText
} from 'lucide-react'

function Profile() {
  const { updateProfile: updateAuthProfile, isCandidate } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [profile, setProfile] = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const [hasResume, setHasResume] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [showScrollButton, setShowScrollButton] = useState(true)
  const containerRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: '', headline: '', phone: '', location: '',
    linkedin: '', github: '', portfolio: '', bio: '', skills: []
  })
  
  const [workExperience, setWorkExperience] = useState([])
  const [education, setEducation] = useState([])
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // Load profile and resume data in parallel
      const [profileRes, resumeRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/auth/profile/resume-data').catch(() => ({ data: { success: false } }))
      ])
      
      if (profileRes.data.success) {
        const userData = profileRes.data.user
        setProfile(userData)
        
        // Set form data from profile
        const profileData = userData.profile || {}
        setFormData({
          name: userData.name || '',
          headline: profileData.headline || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          linkedin: profileData.linkedin || '',
          github: profileData.github || '',
          portfolio: profileData.portfolio || '',
          bio: profileData.bio || '',
          skills: profileData.skills || []
        })
        setWorkExperience(profileData.work_experience || [])
        setEducation(profileData.education || [])
        
        // If resume data available and profile fields are empty, pre-populate
        if (resumeRes.data.success && resumeRes.data.has_resume) {
          setHasResume(true)
          setResumeData(resumeRes.data.resume_data)
          
          // Auto-populate empty fields from resume
          const rd = resumeRes.data.resume_data
          if (profileData.skills?.length === 0 && rd.skills?.length > 0) {
            setFormData(prev => ({ ...prev, skills: rd.skills }))
          }
          if (!profileData.phone && rd.contact_info?.phone) {
            setFormData(prev => ({ ...prev, phone: rd.contact_info.phone }))
          }
          if (!profileData.location && rd.contact_info?.location) {
            setFormData(prev => ({ ...prev, location: rd.contact_info.location }))
          }
          if (!profileData.linkedin && rd.contact_info?.linkedin) {
            setFormData(prev => ({ ...prev, linkedin: rd.contact_info.linkedin }))
          }
          if (!profileData.github && rd.contact_info?.github) {
            setFormData(prev => ({ ...prev, github: rd.contact_info.github }))
          }
          if (!profileData.portfolio && rd.contact_info?.portfolio) {
            setFormData(prev => ({ ...prev, portfolio: rd.contact_info.portfolio }))
          }
          // Pre-populate education if empty
          if (profileData.education?.length === 0 && rd.education) {
            setEducation([{
              id: Date.now().toString(),
              institution: '',
              degree: rd.education,
              field: '',
              start_date: '',
              end_date: '',
              grade: ''
            }])
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const syncFromResume = async () => {
    if (!hasResume) {
      toast.error('No resume uploaded yet. Please upload a resume first.')
      return
    }
    setSyncing(true)
    try {
      const response = await api.get('/auth/profile/resume-data')
      if (response.data.success && response.data.has_resume) {
        const rd = response.data.resume_data
        setResumeData(rd)
        
        // Update skills from resume
        if (rd.skills?.length > 0) {
          setFormData(prev => ({ ...prev, skills: rd.skills }))
        }
        // Update contact info from resume
        if (rd.contact_info) {
          setFormData(prev => ({
            ...prev,
            phone: rd.contact_info.phone || prev.phone,
            location: rd.contact_info.location || prev.location,
            linkedin: rd.contact_info.linkedin || prev.linkedin,
            github: rd.contact_info.github || prev.github,
            portfolio: rd.contact_info.portfolio || prev.portfolio
          }))
        }
        // Update education
        if (rd.education) {
          if (education.length === 0) {
            setEducation([{
              id: Date.now().toString(),
              institution: '',
              degree: rd.education,
              field: '',
              start_date: '',
              end_date: '',
              grade: ''
            }])
          }
        }
        toast.success('Profile synced from resume!')
      } else {
        toast.error('No processed resume found')
      }
    } catch (error) {
      toast.error('Failed to sync from resume')
    } finally {
      setSyncing(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const response = await api.put('/auth/profile', {
        name: formData.name.trim(),
        profile: {
          ...formData,
          skills: formData.skills,
          work_experience: workExperience,
          education: education
        }
      })
      if (response.data.success) {
        toast.success('Profile updated!')
        setProfile(response.data.user)
        setEditingSection(null)
        updateAuthProfile(response.data.user)
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Work Experience handlers
  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      id: Date.now().toString(),
      company: '', position: '', location: '',
      start_date: '', end_date: '', is_current: false,
      description: '', technologies: []
    }])
  }

  const updateWorkExperience = (index, field, value) => {
    const updated = [...workExperience]
    updated[index][field] = value
    if (field === 'is_current' && value) {
      updated[index].end_date = ''
    }
    setWorkExperience(updated)
  }

  const removeWorkExperience = (index) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index))
  }

  const addTechnology = (expIndex, tech) => {
    if (!tech.trim()) return
    const updated = [...workExperience]
    if (!updated[expIndex].technologies.includes(tech.trim())) {
      updated[expIndex].technologies = [...updated[expIndex].technologies, tech.trim()]
      setWorkExperience(updated)
    }
  }

  const removeTechnology = (expIndex, techIndex) => {
    const updated = [...workExperience]
    updated[expIndex].technologies = updated[expIndex].technologies.filter((_, i) => i !== techIndex)
    setWorkExperience(updated)
  }

  // Education handlers
  const addEducation = () => {
    setEducation([...education, {
      id: Date.now().toString(),
      institution: '', degree: '', field: '',
      start_date: '', end_date: '', grade: ''
    }])
  }

  const updateEducation = (index, field, value) => {
    const updated = [...education]
    updated[index][field] = value
    setEducation(updated)
  }

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  // Skills handlers
  const addSkill = () => {
    if (!newSkill.trim()) return
    if (!formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }))
    }
    setNewSkill('')
  }

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      // Hide button when near bottom (within 100px)
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
    }
  }

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]"><AILoadingAnimation message="Loading Profile" context="profile" size="medium" /></div>
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="max-w-4xl mx-auto space-y-6 h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide relative"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/30">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile?.name}</h1>
              {profile?.profile?.headline && <p className="text-blue-100 text-lg mt-1">{profile.profile.headline}</p>}
              <p className="text-blue-200 mt-1">{profile?.email}</p>
              <span className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-white/20">{profile?.role}</span>
            </div>
          </div>
          
          {/* Sync from Resume Button */}
          {isCandidate && (
            <button
              onClick={syncFromResume}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
              title="Sync profile data from your uploaded resume"
            >
              {syncing ? (
                <LoadingSpinner size="small" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">Sync from Resume</span>
            </button>
          )}
        </div>
        
        {/* Resume Data Info */}
        {isCandidate && hasResume && resumeData && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-200" />
            <div className="text-sm">
              <span className="text-blue-100">Resume analyzed: </span>
              <span className="text-white font-medium">{resumeData.experience_years} years experience</span>
              <span className="text-blue-200 mx-2">•</span>
              <span className="text-white font-medium">{resumeData.skills?.length || 0} skills detected</span>
              <span className="text-blue-200 mx-2">•</span>
              <span className="text-white font-medium">{resumeData.education || 'Education detected'}</span>
            </div>
          </div>
        )}
        
        {/* Quick Links */}
        {(profile?.profile?.linkedin || profile?.profile?.github || profile?.profile?.portfolio) && (
          <div className="flex gap-4 mt-6 pt-6 border-t border-white/20">
            {profile?.profile?.linkedin && (
              <a href={profile.profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-100 hover:text-white">
                <Linkedin className="w-5 h-5 mr-2" />LinkedIn
              </a>
            )}
            {profile?.profile?.github && (
              <a href={profile.profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-100 hover:text-white">
                <Github className="w-5 h-5 mr-2" />GitHub
              </a>
            )}
            {profile?.profile?.portfolio && (
              <a href={profile.profile.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-100 hover:text-white">
                <Globe className="w-5 h-5 mr-2" />Portfolio
              </a>
            )}
          </div>
        )}
      </div>

      {/* Basic Info Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />Basic Information
          </h2>
          <button onClick={() => setEditingSection(editingSection === 'basic' ? null : 'basic')}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <Edit3 className="w-4 h-4 mr-1" />{editingSection === 'basic' ? 'Cancel' : 'Edit'}
          </button>
        </div>
        
        {editingSection === 'basic' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input type="text" name="headline" value={formData.headline} onChange={handleInputChange}
                  placeholder="e.g., Senior Software Engineer" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange}
                  placeholder="City, Country" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input type="url" name="linkedin" value={formData.linkedin} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                <input type="url" name="github" value={formData.github} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
                <input type="url" name="portfolio" value={formData.portfolio} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                {saving ? <LoadingSpinner size="small" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={<Mail className="w-5 h-5 text-indigo-500" />} label="Email" value={profile?.email} />
            <InfoItem icon={<Phone className="w-5 h-5 text-green-500" />} label="Phone" value={profile?.profile?.phone} />
            <InfoItem icon={<MapPin className="w-5 h-5 text-red-500" />} label="Location" value={profile?.profile?.location} />
            <InfoItem icon={<Linkedin className="w-5 h-5 text-blue-600" />} label="LinkedIn" value={profile?.profile?.linkedin} isLink />
            <InfoItem icon={<Github className="w-5 h-5 text-gray-800" />} label="GitHub" value={profile?.profile?.github} isLink />
            <InfoItem icon={<Globe className="w-5 h-5 text-purple-500" />} label="Portfolio" value={profile?.profile?.portfolio} isLink />
            {profile?.profile?.bio && (
              <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">About</div>
                <p className="text-gray-700">{profile.profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Work Experience Section */}
      {isCandidate && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-600" />Work Experience
            </h2>
            <button onClick={() => setEditingSection(editingSection === 'experience' ? null : 'experience')}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              <Edit3 className="w-4 h-4 mr-1" />{editingSection === 'experience' ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {editingSection === 'experience' ? (
            <div className="space-y-6">
              {workExperience.map((exp, index) => (
                <div key={exp.id || index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between mb-3">
                    <span className="font-medium text-gray-700">Experience {index + 1}</span>
                    <button onClick={() => removeWorkExperience(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Company Name *" value={exp.company}
                      onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                    <input type="text" placeholder="Position/Title *" value={exp.position}
                      onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                    <input type="text" placeholder="Location" value={exp.location}
                      onChange={(e) => updateWorkExperience(index, 'location', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                    <div className="flex items-center gap-2">
                      <input type="month" placeholder="Start Date" value={exp.start_date}
                        onChange={(e) => updateWorkExperience(index, 'start_date', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg" />
                      {!exp.is_current && (
                        <input type="month" placeholder="End Date" value={exp.end_date}
                          onChange={(e) => updateWorkExperience(index, 'end_date', e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg" />
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={exp.is_current}
                        onChange={(e) => updateWorkExperience(index, 'is_current', e.target.checked)}
                        className="rounded" />
                      Currently working here
                    </label>
                  </div>
                  <textarea placeholder="Description of your role and achievements..."
                    value={exp.description} onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                    className="w-full mt-3 px-3 py-2 border rounded-lg resize-none" rows={2} />
                  
                  {/* Technologies */}
                  <div className="mt-3">
                    <label className="text-sm text-gray-600">Technologies Used</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {exp.technologies?.map((tech, techIdx) => (
                        <span key={techIdx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                          {tech}
                          <button onClick={() => removeTechnology(index, techIdx)} className="ml-1 text-blue-600 hover:text-blue-800">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input type="text" placeholder="Add tech..." className="px-2 py-1 border rounded-lg text-sm w-24"
                        onKeyDown={(e) => { if (e.key === 'Enter') { addTechnology(index, e.target.value); e.target.value = '' }}} />
                    </div>
                  </div>
                </div>
              ))}
              
              <button onClick={addWorkExperience}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center">
                <Plus className="w-5 h-5 mr-2" />Add Work Experience
              </button>
              
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                  {saving ? <LoadingSpinner size="small" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {workExperience.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No work experience added yet</p>
                  <button onClick={() => setEditingSection('experience')} className="mt-2 text-blue-600 hover:underline">Add your experience</button>
                </div>
              ) : (
                workExperience.map((exp, index) => (
                  <div key={exp.id || index} className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                        <p className="text-blue-600 flex items-center"><Building className="w-4 h-4 mr-1" />{exp.company}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                      </span>
                    </div>
                    {exp.location && <p className="text-sm text-gray-500 mt-1"><MapPin className="w-3 h-3 inline mr-1" />{exp.location}</p>}
                    {exp.description && <p className="text-gray-700 mt-2 text-sm">{exp.description}</p>}
                    {exp.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exp.technologies.map((tech, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Education Section */}
      {isCandidate && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />Education
              {hasResume && education.length > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">From Resume</span>
              )}
            </h2>
            <button onClick={() => setEditingSection(editingSection === 'education' ? null : 'education')}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              <Edit3 className="w-4 h-4 mr-1" />{editingSection === 'education' ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {editingSection === 'education' ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Education detected from your resume. You can edit or add more details.</p>
              {education.map((edu, index) => (
                <div key={edu.id || index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between mb-3">
                    <span className="font-medium text-gray-700">Education {index + 1}</span>
                    <button onClick={() => removeEducation(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Institution Name *" value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                    <input type="text" placeholder="Degree (e.g., Bachelor's, Master's)" value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                    <input type="text" placeholder="Field of Study" value={edu.field}
                      onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                    <input type="text" placeholder="Grade/GPA (optional)" value={edu.grade}
                      onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                    <input type="month" placeholder="Start Date" value={edu.start_date}
                      onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                    <input type="month" placeholder="End Date" value={edu.end_date}
                      onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                      className="px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              ))}
              
              <button onClick={addEducation}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center">
                <Plus className="w-5 h-5 mr-2" />Add Education
              </button>
              
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                  {saving ? <LoadingSpinner size="small" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {education.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No education detected yet</p>
                  <p className="text-sm mt-1">Upload a resume to auto-detect education, or add manually</p>
                  <button onClick={() => setEditingSection('education')} className="mt-2 text-blue-600 hover:underline">Add education manually</button>
                </div>
              ) : (
                education.map((edu, index) => (
                  <div key={edu.id || index} className="p-4 border-l-4 border-green-500 bg-gray-50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</h3>
                        {edu.institution && <p className="text-green-600 flex items-center"><GraduationCap className="w-4 h-4 mr-1" />{edu.institution}</p>}
                      </div>
                      {(edu.start_date || edu.end_date) && (
                        <span className="text-sm text-gray-500">
                          {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                        </span>
                      )}
                    </div>
                    {edu.grade && <p className="text-sm text-gray-600 mt-1">Grade: {edu.grade}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Skills Section */}
      {isCandidate && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Code className="w-5 h-5 mr-2 text-blue-600" />Skills
              {hasResume && formData.skills.length > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">From Resume</span>
              )}
            </h2>
            <button onClick={() => setEditingSection(editingSection === 'skills' ? null : 'skills')}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              <Edit3 className="w-4 h-4 mr-1" />{editingSection === 'skills' ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {editingSection === 'skills' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Skills extracted from your resume. You can add, remove, or modify them.</p>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                    {skill}
                    <button onClick={() => removeSkill(index)} className="ml-2 text-blue-600 hover:text-blue-800">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input type="text" placeholder="Add a skill..." value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() }}}
                  className="flex-1 px-3 py-2 border rounded-lg" />
                <button onClick={addSkill}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                  {saving ? <LoadingSpinner size="small" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              {formData.skills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No skills detected yet</p>
                  <p className="text-sm mt-1">Upload a resume to auto-detect skills, or add them manually</p>
                  <button onClick={() => setEditingSection('skills')} className="mt-2 text-blue-600 hover:underline">Add skills manually</button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Scroll Down Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-8 right-8 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </button>
      )}
    </div>
  )
}

// Helper component for displaying info items
const InfoItem = ({ icon, label, value, isLink }) => {
  if (!value) {
    return (
      <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-dashed">
        {icon}
        <span className="ml-3 text-gray-400 text-sm">{label} not provided</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
      {icon}
      <div className="ml-3">
        <div className="text-xs text-gray-500">{label}</div>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium text-sm flex items-center">
            View <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        ) : (
          <span className="font-medium text-gray-900 text-sm">{value}</span>
        )}
      </div>
    </div>
  )
}

export default Profile
