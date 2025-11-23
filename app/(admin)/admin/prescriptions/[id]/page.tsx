'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, Plus, Edit, Trash2, ShoppingCart } from 'lucide-react'

interface PrescriptionItem {
  id: string
  genericName: string
  strength?: string
  quantity: number
  note?: string
  medicineId?: string
  medicine?: {
    id: string
    name: string
    genericName?: string
    strength?: string
    sellingPrice: number
  }
}

interface Prescription {
  id: string
  name: string
  phone: string
  zoneId?: string
  fileUrl: string
  fileType?: string
  status: string
  notes?: string
  createdAt: string
  user: {
    id: string
    name: string
    phone: string
    email?: string
  }
  items: PrescriptionItem[]
  order?: {
    id: string
    orderNumber: string
    status: string
    total: number
  }
}

const STATUS_OPTIONS = ['NEW', 'REVIEWING', 'QUOTED', 'ORDERED', 'COMPLETED', 'CANCELLED'] as const

export default function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)
  const [prescriptionId, setPrescriptionId] = useState<string>('')
  const [editingItem, setEditingItem] = useState<PrescriptionItem | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemForm, setItemForm] = useState({
    genericName: '',
    strength: '',
    quantity: 1,
    note: '',
    medicineId: '',
  })

  useEffect(() => {
    params.then(p => setPrescriptionId(p.id))
  }, [params])

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [authStatus, router])

  useEffect(() => {
    if (session && prescriptionId) {
      fetchPrescription()
    }
  }, [session, prescriptionId])

  async function fetchPrescription() {
    try {
      const response = await fetch(`/api/admin/prescriptions/${prescriptionId}`)
      const data = await response.json()
      setPrescription(data.prescription)
    } catch (error) {
      console.error('Failed to fetch prescription:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(status: string) {
    try {
      const response = await fetch(`/api/admin/prescriptions/${prescriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setPrescription(prev => prev ? { ...prev, status } : null)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  async function updateNotes(notes: string) {
    try {
      await fetch(`/api/admin/prescriptions/${prescriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
    } catch (error) {
      console.error('Failed to update notes:', error)
    }
  }

  async function handleAddItem() {
    try {
      const response = await fetch(`/api/admin/prescriptions/${prescriptionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          quantity: Number(itemForm.quantity),
          medicineId: itemForm.medicineId || undefined,
        }),
      })

      if (response.ok) {
        setShowAddItem(false)
        setItemForm({ genericName: '', strength: '', quantity: 1, note: '', medicineId: '' })
        fetchPrescription()
      }
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  async function handleUpdateItem() {
    if (!editingItem) return

    try {
      const response = await fetch(`/api/admin/prescriptions/${prescriptionId}/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          quantity: Number(itemForm.quantity),
          medicineId: itemForm.medicineId || null,
        }),
      })

      if (response.ok) {
        setEditingItem(null)
        setItemForm({ genericName: '', strength: '', quantity: 1, note: '', medicineId: '' })
        fetchPrescription()
      }
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/admin/prescriptions/${prescriptionId}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPrescription()
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  async function handleCreateOrder() {
    if (!prescription) return

    if (prescription.items.filter(i => i.medicineId).length === 0) {
      alert('Please map at least one item to a medicine before creating an order')
      return
    }

    if (!confirm('Create order from this prescription?')) return

    try {
      const response = await fetch(`/api/admin/prescriptions/${prescriptionId}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: prescription.zoneId || '1', // Default zone if not specified
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Order created successfully! Order #${data.order.orderNumber}`)
        fetchPrescription()
      } else {
        alert(`Failed to create order: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to create order')
    }
  }

  function startEditItem(item: PrescriptionItem) {
    setEditingItem(item)
    setItemForm({
      genericName: item.genericName,
      strength: item.strength || '',
      quantity: item.quantity,
      note: item.note || '',
      medicineId: item.medicineId || '',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Prescription not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Prescription Details</h1>
          <button
            onClick={() => router.push('/admin/prescriptions')}
            className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Back to List
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Customer Info & Status */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Customer Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{prescription.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{prescription.phone}</p>
                </div>
                {prescription.user.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{prescription.user.email}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-sm text-gray-600">{prescription.user.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted</label>
                  <p className="text-gray-900">{new Date(prescription.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Status & Notes */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Status & Notes</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={prescription.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Internal Notes</label>
                  <textarea
                    value={prescription.notes || ''}
                    onChange={(e) => setPrescription(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    onBlur={(e) => updateNotes(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    rows={4}
                    placeholder="Add internal notes..."
                  />
                </div>
              </div>
            </div>

            {/* Linked Order */}
            {prescription.order && (
              <div className="rounded-lg bg-green-50 p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold text-green-900">Linked Order</h2>
                <div className="space-y-2">
                  <p className="text-green-800">
                    <span className="font-medium">Order Number:</span> {prescription.order.orderNumber}
                  </p>
                  <p className="text-green-800">
                    <span className="font-medium">Status:</span> {prescription.order.status}
                  </p>
                  <p className="text-green-800">
                    <span className="font-medium">Total:</span> ৳{prescription.order.total.toFixed(2)}
                  </p>
                  <button
                    onClick={() => router.push(`/admin/orders/${prescription.order!.id}`)}
                    className="mt-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  >
                    View Order
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Prescription File & Items */}
          <div className="space-y-6">
            {/* Prescription File */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Prescription File</h2>
              <button
                onClick={() => window.open(prescription.fileUrl, '_blank')}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
              >
                <Eye className="mr-2 h-5 w-5" />
                View / Download File
              </button>
              {prescription.fileType && (
                <p className="mt-2 text-sm text-gray-500">Type: {prescription.fileType}</p>
              )}
            </div>

            {/* Prescription Items */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Prescription Items</h2>
                {!prescription.order && (
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="flex items-center rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Item
                  </button>
                )}
              </div>

              {/* Add/Edit Item Form */}
              {(showAddItem || editingItem) && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 font-medium">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Generic Name *"
                      value={itemForm.genericName}
                      onChange={(e) => setItemForm({ ...itemForm, genericName: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Strength (e.g., 500mg)"
                      value={itemForm.strength}
                      onChange={(e) => setItemForm({ ...itemForm, strength: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Quantity *"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                      className="w-full rounded border px-3 py-2"
                      min="1"
                    />
                    <input
                      type="text"
                      placeholder="Medicine ID (optional)"
                      value={itemForm.medicineId}
                      onChange={(e) => setItemForm({ ...itemForm, medicineId: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                    />
                    <textarea
                      placeholder="Note (optional)"
                      value={itemForm.note}
                      onChange={(e) => setItemForm({ ...itemForm, note: e.target.value })}
                      className="w-full rounded border px-3 py-2"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={editingItem ? handleUpdateItem : handleAddItem}
                        className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
                      >
                        {editingItem ? 'Update' : 'Add'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddItem(false)
                          setEditingItem(null)
                          setItemForm({ genericName: '', strength: '', quantity: 1, note: '', medicineId: '' })
                        }}
                        className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              {prescription.items.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No items added yet</p>
              ) : (
                <div className="space-y-3">
                  {prescription.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.genericName}</p>
                          {item.strength && <p className="text-sm text-gray-600">Strength: {item.strength}</p>}
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          {item.medicine && (
                            <p className="text-sm text-green-600">
                              Mapped: {item.medicine.name} (৳{item.medicine.sellingPrice})
                            </p>
                          )}
                          {item.note && <p className="text-sm text-gray-500">Note: {item.note}</p>}
                        </div>
                        {!prescription.order && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditItem(item)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create Order Button */}
              {!prescription.order && prescription.items.length > 0 && (
                <button
                  onClick={handleCreateOrder}
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Create Order from Prescription
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
