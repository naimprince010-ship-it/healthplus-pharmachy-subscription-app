'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  LandingPageSection,
  LandingPageSectionType,
  sectionTypeLabels,
  createSection,
  HeroSectionConfig,
  ProblemSectionConfig,
  BenefitsSectionConfig,
  HowItWorksSectionConfig,
  PricingSectionConfig,
  TestimonialsSectionConfig,
  FAQSectionConfig,
  FinalCTASectionConfig,
} from '@/lib/landing-page/types'

interface LandingPageEditorProps {
  initialData?: {
    id?: string
    title: string
    slug: string
    sections: LandingPageSection[]
    metaTitle?: string | null
    metaDescription?: string | null
    primaryColor?: string | null
  }
  isEdit?: boolean
}

export default function LandingPageEditor({ initialData, isEdit = false }: LandingPageEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    primaryColor: initialData?.primaryColor || '#036666',
  })
  
  const [sections, setSections] = useState<LandingPageSection[]>(
    initialData?.sections || []
  )

  const handleAddSection = (type: LandingPageSectionType) => {
    const newSection = createSection(type, sections.length)
    setSections([...sections, newSection])
  }

  const handleRemoveSection = (index: number) => {
    if (!confirm('Are you sure you want to remove this section?')) return
    const newSections = sections.filter((_, i) => i !== index)
    // Update order numbers
    newSections.forEach((s, i) => (s.order = i))
    setSections(newSections)
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sections.length - 1) return

    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
    // Update order numbers
    newSections.forEach((s, i) => (s.order = i))
    setSections(newSections)
  }

    const handleUpdateSectionConfig = (index: number, config: Record<string, unknown>) => {
      const newSections = [...sections]
      // We know at runtime that `config` matches section.config's shape
      // because each SectionConfigEditor enforces that shape.
      newSections[index] = { ...newSections[index], config } as unknown as LandingPageSection
      setSections(newSections)
    }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: isEdit ? formData.slug : generateSlug(title),
    })
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required')
      return
    }

    setSaving(true)
    try {
      const url = isEdit
        ? `/api/admin/landing-pages/${initialData?.id}`
        : '/api/admin/landing-pages'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sections,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(isEdit ? 'Landing page updated' : 'Landing page created')
        if (!isEdit && data.landingPage?.id) {
          router.push(`/admin/landing-pages/${data.landingPage.id}/edit`)
        }
      } else {
        toast.error(data.error || 'Failed to save landing page')
      }
    } catch {
      toast.error('Failed to save landing page')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Landing Page' : 'Create Landing Page'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Build your promotional landing page with customizable sections
            </p>
          </div>
          <div className="flex gap-3">
            {isEdit && initialData?.id && (
              <a
                href={`/admin/landing-pages/${initialData.id}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                Preview
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g., Halalzi Summer Sale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                  /campaign/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="block w-full rounded-r-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="halalzi-summer-sale"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Primary Color
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="#036666"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meta Title (SEO)
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Page title for search engines"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Meta Description (SEO)
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Page description for search engines"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sections ({sections.length})</h2>
            <AddSectionDropdown onAdd={handleAddSection} />
          </div>

          {sections.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">No sections yet. Add your first section to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                                <SectionCard
                                  key={section.id}
                                  section={section}
                                  index={index}
                                  totalSections={sections.length}
                                  onMove={(dir) => handleMoveSection(index, dir)}
                                  onRemove={() => handleRemoveSection(index)}
                                  onUpdateConfig={(config) => handleUpdateSectionConfig(index, config)}
                                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Add Section Dropdown
function AddSectionDropdown({ onAdd }: { onAdd: (type: LandingPageSectionType) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const sectionTypes: LandingPageSectionType[] = [
    'hero',
    'problem',
    'benefits',
    'howItWorks',
    'pricing',
    'testimonials',
    'faq',
    'finalCta',
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        <Plus className="h-4 w-4" />
        Add Section
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              {sectionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    onAdd(type)
                    setIsOpen(false)
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  {sectionTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Section Card Component
interface SectionCardProps {
  section: LandingPageSection
  index: number
  totalSections: number
  onMove: (direction: 'up' | 'down') => void
  onRemove: () => void
  onUpdateConfig: (config: Record<string, unknown>) => void
}

function SectionCard({
  section,
  index,
  totalSections,
  onMove,
  onRemove,
  onUpdateConfig,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
            {index + 1}
          </span>
          <span className="font-medium text-gray-900">{sectionTypeLabels[section.type]}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
            title="Move Up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === totalSections - 1}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
            title="Move Down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
            title="Remove Section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
            {isExpanded && (
              <div className="p-4">
                <SectionConfigEditor
                  section={section}
                  onUpdateConfig={onUpdateConfig}
                />
              </div>
            )}
    </div>
  )
}

// Section Config Editor
interface SectionConfigEditorProps {
  section: LandingPageSection
  onUpdateConfig: (config: Record<string, unknown>) => void
}

function SectionConfigEditor({ section, onUpdateConfig }: SectionConfigEditorProps) {
  const updateField = (field: string, value: unknown) => {
    const currentConfig = section.config as unknown as Record<string, unknown>
    onUpdateConfig({ ...currentConfig, [field]: value })
  }

  // Use type narrowing based on section.type to pass the correct config type
  switch (section.type) {
    case 'hero':
      return <HeroConfigEditor config={section.config} updateField={updateField} />
    case 'problem':
      return <ProblemConfigEditor config={section.config} updateField={updateField} />
    case 'benefits':
      return <BenefitsConfigEditor config={section.config} updateField={updateField} />
    case 'howItWorks':
      return <HowItWorksConfigEditor config={section.config} updateField={updateField} />
    case 'pricing':
      return <PricingConfigEditor config={section.config} updateField={updateField} />
    case 'testimonials':
      return <TestimonialsConfigEditor config={section.config} updateField={updateField} />
    case 'faq':
      return <FAQConfigEditor config={section.config} updateField={updateField} />
    case 'finalCta':
      return <FinalCTAConfigEditor config={section.config} updateField={updateField} />
    default:
      return <div className="text-gray-500">Unknown section type</div>
  }
}

// Individual Section Config Editors
function HeroConfigEditor({ config, updateField }: { config: HeroSectionConfig; updateField: (field: string, value: unknown) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Headline</label>
        <input
          type="text"
          value={config.headline || ''}
          onChange={(e) => updateField('headline', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Main headline text"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Subheadline</label>
        <textarea
          value={config.subheadline || ''}
          onChange={(e) => updateField('subheadline', e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Supporting text below headline"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Badge Text</label>
        <input
          type="text"
          value={config.badge || ''}
          onChange={(e) => updateField('badge', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Limited Time Offer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Button Text</label>
        <input
          type="text"
          value={config.ctaText || ''}
          onChange={(e) => updateField('ctaText', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Order Now"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">CTA Link</label>
        <input
          type="text"
          value={config.ctaLink || ''}
          onChange={(e) => updateField('ctaLink', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="/product/xyz or https://..."
        />
      </div>
    </div>
  )
}

function ProblemConfigEditor({ config, updateField }: { config: ProblemSectionConfig; updateField: (field: string, value: unknown) => void }) {
  const pains = config.pains || ['']

  const updatePain = (index: number, value: string) => {
    const newPains = [...pains]
    newPains[index] = value
    updateField('pains', newPains)
  }

  const addPain = () => {
    updateField('pains', [...pains, ''])
  }

  const removePain = (index: number) => {
    updateField('pains', pains.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Common Problems"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pain Points</label>
        {pains.map((pain, index) => (
          <div key={index} className="mb-2 flex gap-2">
            <input
              type="text"
              value={pain}
              onChange={(e) => updatePain(index, e.target.value)}
              className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder={`Pain point ${index + 1}`}
            />
            {pains.length > 1 && (
              <button
                onClick={() => removePain(index)}
                className="rounded p-2 text-gray-400 hover:bg-red-100 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addPain}
          className="mt-2 text-sm text-teal-600 hover:text-teal-700"
        >
          + Add Pain Point
        </button>
      </div>
    </div>
  )
}

function BenefitsConfigEditor({ config, updateField }: { config: BenefitsSectionConfig; updateField: (field: string, value: unknown) => void }) {
  const items = config.items || [{ icon: 'check', title: '', description: '' }]

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateField('items', newItems)
  }

  const addItem = () => {
    updateField('items', [...items, { icon: 'check', title: '', description: '' }])
  }

  const removeItem = (index: number) => {
    updateField('items', items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Why Choose Us"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
        {items.map((item, index) => (
          <div key={index} className="mb-3 rounded-lg border border-gray-200 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(index, 'title', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Benefit title"
              />
              <input
                type="text"
                value={item.icon}
                onChange={(e) => updateItem(index, 'icon', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Icon (e.g., check, star)"
              />
            </div>
            <textarea
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
              rows={2}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Benefit description"
            />
            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addItem}
          className="mt-2 text-sm text-teal-600 hover:text-teal-700"
        >
          + Add Benefit
        </button>
      </div>
    </div>
  )
}

function HowItWorksConfigEditor({ config, updateField }: { config: HowItWorksSectionConfig; updateField: (field: string, value: unknown) => void }) {
  const steps = config.steps || [{ number: '1', title: '', description: '' }]

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    updateField('steps', newSteps)
  }

  const addStep = () => {
    updateField('steps', [...steps, { number: String(steps.length + 1), title: '', description: '' }])
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    // Renumber steps
    newSteps.forEach((step, i) => (step.number = String(i + 1)))
    updateField('steps', newSteps)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., How It Works"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
        {steps.map((step, index) => (
          <div key={index} className="mb-3 rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                {step.number}
              </span>
              <input
                type="text"
                value={step.title}
                onChange={(e) => updateStep(index, 'title', e.target.value)}
                className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Step title"
              />
            </div>
            <textarea
              value={step.description}
              onChange={(e) => updateStep(index, 'description', e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Step description"
            />
            {steps.length > 1 && (
              <button
                onClick={() => removeStep(index)}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addStep}
          className="mt-2 text-sm text-teal-600 hover:text-teal-700"
        >
          + Add Step
        </button>
      </div>
    </div>
  )
}

function PricingConfigEditor({ config, updateField }: { config: PricingSectionConfig; updateField: (field: string, value: unknown) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Special Offer"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={config.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="Pricing description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <input
          type="text"
          value={config.price || ''}
          onChange={(e) => updateField('price', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., 999"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Original Price (strikethrough)</label>
        <input
          type="text"
          value={config.originalPrice || ''}
          onChange={(e) => updateField('originalPrice', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., 1499"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Button Text</label>
        <input
          type="text"
          value={config.ctaText || ''}
          onChange={(e) => updateField('ctaText', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Order Now"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Link</label>
        <input
          type="text"
          value={config.ctaLink || ''}
          onChange={(e) => updateField('ctaLink', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="/product/xyz"
        />
      </div>
    </div>
  )
}

function TestimonialsConfigEditor({ config, updateField }: { config: TestimonialsSectionConfig; updateField: (field: string, value: unknown) => void }) {
  const items = config.items || [{ name: '', location: '', quote: '', rating: 5 }]

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateField('items', newItems)
  }

  const addItem = () => {
    updateField('items', [...items, { name: '', location: '', quote: '', rating: 5 }])
  }

  const removeItem = (index: number) => {
    updateField('items', items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., What Our Customers Say"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Testimonials</label>
        {items.map((item, index) => (
          <div key={index} className="mb-3 rounded-lg border border-gray-200 p-3">
            <div className="grid gap-2 md:grid-cols-3">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Customer name"
              />
              <input
                type="text"
                value={item.location}
                onChange={(e) => updateItem(index, 'location', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Location"
              />
              <select
                value={item.rating}
                onChange={(e) => updateItem(index, 'rating', parseInt(e.target.value))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r} Stars</option>
                ))}
              </select>
            </div>
            <textarea
              value={item.quote}
              onChange={(e) => updateItem(index, 'quote', e.target.value)}
              rows={2}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Customer testimonial quote"
            />
            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addItem}
          className="mt-2 text-sm text-teal-600 hover:text-teal-700"
        >
          + Add Testimonial
        </button>
      </div>
    </div>
  )
}

function FAQConfigEditor({ config, updateField }: { config: FAQSectionConfig; updateField: (field: string, value: unknown) => void }) {
  const items = config.items || [{ question: '', answer: '' }]

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateField('items', newItems)
  }

  const addItem = () => {
    updateField('items', [...items, { question: '', answer: '' }])
  }

  const removeItem = (index: number) => {
    updateField('items', items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Section Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Frequently Asked Questions"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">FAQ Items</label>
        {items.map((item, index) => (
          <div key={index} className="mb-3 rounded-lg border border-gray-200 p-3">
            <input
              type="text"
              value={item.question}
              onChange={(e) => updateItem(index, 'question', e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Question"
            />
            <textarea
              value={item.answer}
              onChange={(e) => updateItem(index, 'answer', e.target.value)}
              rows={2}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Answer"
            />
            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addItem}
          className="mt-2 text-sm text-teal-600 hover:text-teal-700"
        >
          + Add FAQ
        </button>
      </div>
    </div>
  )
}

function FinalCTAConfigEditor({ config, updateField }: { config: FinalCTASectionConfig; updateField: (field: string, value: unknown) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Headline</label>
        <input
          type="text"
          value={config.headline || ''}
          onChange={(e) => updateField('headline', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Ready to Get Started?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Button Text</label>
        <input
          type="text"
          value={config.ctaText || ''}
          onChange={(e) => updateField('ctaText', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Order Now"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Link</label>
        <input
          type="text"
          value={config.ctaLink || ''}
          onChange={(e) => updateField('ctaLink', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="/product/xyz"
        />
      </div>
    </div>
  )
}
