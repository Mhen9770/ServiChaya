'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { BadgeCheck, Mail, MapPin, Phone, Save, ShieldCheck, UserCircle2, Edit, TrendingUp, ArrowRight, X } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerProfile, type CustomerProfileDto, updateCustomerProfile, createCustomerAddress, type CreateAddressRequest } from '@/lib/services/customer'
import { getAllActiveCities, getZonesByCity, getPodsByZone, type CityMasterDto, type ZoneMasterDto, type PodMasterDto } from '@/lib/services/admin'
import { resolveLocation } from '@/lib/services/location'
import Loader, { ButtonLoader } from '@/components/ui/Loader'
import LocationPicker from '@/components/map/LocationPicker'

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<CustomerProfileDto | null>(null)
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  
  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingZones, setLoadingZones] = useState(false)
  const [loadingPods, setLoadingPods] = useState(false)
  const [cities, setCities] = useState<CityMasterDto[]>([])
  const [zones, setZones] = useState<ZoneMasterDto[]>([])
  const [pods, setPods] = useState<PodMasterDto[]>([])
  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({
    addressLabel: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    cityId: 0,
    zoneId: undefined,
    podId: undefined,
    pincode: '',
    latitude: undefined,
    longitude: undefined,
    isPrimary: false,
  })
  const [resolvingLocation, setResolvingLocation] = useState(false)
  const [resolvedLocationInfo, setResolvedLocationInfo] = useState<{ cityName?: string; zoneName?: string; podName?: string } | null>(null)
  const resolveLocationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) return
    load(user.userId)
    loadCities()
  }, [])

  const loadCities = async () => {
    try {
      setLoadingCities(true)
      const cityRes = await getAllActiveCities()
      setCities(cityRes)
    } catch {
      toast.error('Failed to load cities')
    } finally {
      setLoadingCities(false)
    }
  }

  const handleCityChange = async (cityId: number) => {
    setAddressForm(prev => ({ ...prev, cityId, zoneId: undefined, podId: undefined, latitude: undefined, longitude: undefined }))
    setZones([])
    setPods([])
    if (!cityId) return
    try {
      setLoadingZones(true)
      const zoneRes = await getZonesByCity(cityId)
      setZones(zoneRes)
    } catch {
      toast.error('Failed to load zones')
    } finally {
      setLoadingZones(false)
    }
  }

  const handleZoneChange = async (zoneId: number) => {
    setAddressForm(prev => ({ ...prev, zoneId, podId: undefined, latitude: undefined, longitude: undefined }))
    setPods([])
    if (!zoneId) return
    try {
      setLoadingPods(true)
      const podRes = await getPodsByZone(zoneId)
      setPods(podRes)
    } catch {
      toast.error('Failed to load PODs')
    } finally {
      setLoadingPods(false)
    }
  }

  // Helper function to resolve location and update form
  const resolveAndUpdateLocation = async (latitude: number, longitude: number, showToast = true) => {
    try {
      setResolvingLocation(true)
      const resolved = await resolveLocation(latitude, longitude)

      setAddressForm(prev => ({
        ...prev,
        cityId: resolved.cityId,
        zoneId: resolved.zoneId,
        podId: resolved.podId,
        latitude,
        longitude,
      }))

      // Update resolved location info for display
      setResolvedLocationInfo({
        cityName: resolved.cityName,
        zoneName: resolved.zoneName,
        podName: resolved.podName,
      })

      // Load dropdown data based on resolved IDs
      if (resolved.cityId) {
        const zoneRes = await getZonesByCity(resolved.cityId)
        setZones(zoneRes)
        if (resolved.zoneId) {
          const podRes = await getPodsByZone(resolved.zoneId)
          setPods(podRes)
        } else {
          setPods([])
        }
      }

      if (showToast) {
        const locationParts = [
          resolved.podName,
          resolved.zoneName,
          resolved.cityName,
        ].filter(Boolean)
        toast.success(`Location detected: ${locationParts.join(', ')}`)
      }
    } catch (err: any) {
      console.error('Failed to resolve location', err)
      setResolvedLocationInfo(null)
      if (showToast) {
        toast.error(err?.response?.data?.message || 'Could not detect area from location')
      }
    } finally {
      setResolvingLocation(false)
    }
  }

  const useCurrentLocationForAddress = async () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported in this browser')
      return
    }

    // Show loader immediately
    setResolvingLocation(true)

    try {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude } = pos.coords
              await resolveAndUpdateLocation(latitude, longitude, true)
            } catch (err) {
              // Error already handled in resolveAndUpdateLocation
            } finally {
              resolve()
            }
          },
          (err) => {
            console.error('Geolocation error', err)
            toast.error('Unable to access current location')
            setResolvingLocation(false)
            resolve()
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        )
      })
    } catch (err) {
      console.error('Error getting current location', err)
      setResolvingLocation(false)
    }
  }

  // Debounced location resolution when map pin moves
  const handleMapLocationChange = ({ lat, lng }: { lat: number; lng: number }) => {
    // Update lat/lng immediately
    setAddressForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }))

    // Debounce the resolution call (wait 1 second after user stops moving pin)
    if (resolveLocationTimeoutRef.current) {
      clearTimeout(resolveLocationTimeoutRef.current)
    }
    
    resolveLocationTimeoutRef.current = setTimeout(() => {
      resolveAndUpdateLocation(lat, lng, false) // Don't show toast on every pin move
    }, 1000)
  }

  const load = async (customerId: number) => {
    try {
      setLoading(true)
      const response = await getCustomerProfile(customerId)
      setProfile(response)
      setName(response.name || response.fullName || '')
      setImageUrl(response.profileImageUrl || '')
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    const user = getCurrentUser()
    if (!user) return

    try {
      setSaving(true)
      const updated = await updateCustomerProfile(user.userId, { name, profileImageUrl: imageUrl })
      setProfile(updated)
      toast.success('Profile updated')
    } catch {
      toast.error('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const addAddress = async () => {
    const user = getCurrentUser()
    if (!user) return

    if (!addressForm.addressLine1 || !addressForm.cityId) {
      toast.error('Please fill address line 1 and select city')
      return
    }

    try {
      setSavingAddress(true)
      const newAddress = await createCustomerAddress(user.userId, {
        ...addressForm,
        cityId: Number(addressForm.cityId) || 0,
        zoneId: addressForm.zoneId,
        podId: addressForm.podId,
      })
      setProfile(prev => prev ? { ...prev, addresses: [...(prev.addresses || []), newAddress] } : prev)
      toast.success('Address added successfully')
      setShowAddressForm(false)
      // Reset form
      setAddressForm({
        addressLabel: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        cityId: 0,
        zoneId: undefined,
        podId: undefined,
        pincode: '',
        latitude: undefined,
        longitude: undefined,
        isPrimary: false,
      })
      setZones([])
      setPods([])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not add address')
    } finally {
      setSavingAddress(false)
    }
  }

  const completion = useMemo(() => {
    if (!profile) return 0
    let points = 40
    if (name.trim()) points += 20
    if (imageUrl.trim()) points += 20
    if (profile.addresses?.length) points += 20
    return Math.min(100, points)
  }, [profile, name, imageUrl])

  if (loading) return <Loader fullScreen text="Loading profile..." />
  if (!profile) return <div className="w-full px-4 sm:px-6 lg:px-8 py-6 text-white">Profile not found.</div>

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-7 border border-slate-800"
      >
        <p className="text-xs uppercase tracking-wide text-slate-300">Profile Management</p>
        <h1 className="text-3xl font-bold mt-2">Customer Profile & Trust</h1>
        <p className="text-sm text-slate-300 mt-2">Keep your profile complete to get better matching and smoother service communication.</p>
      </motion.section>

      <section className="grid lg:grid-cols-3 gap-5">
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass-dark border border-white/10 p-6"
        >
          <div className="flex flex-col items-center text-center">
            {imageUrl ? (
              <img src={imageUrl} alt="profile" className="h-24 w-24 rounded-full border-4 border-primary-main/30 object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary-main/20 text-primary-light flex items-center justify-center">
                <UserCircle2 className="w-10 h-10" />
              </div>
            )}
            <p className="text-lg font-bold mt-3 text-white">{name || 'Customer'}</p>
            <p className="text-xs text-slate-300">User ID: {profile.userId}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs px-2 py-1 font-semibold">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified account
            </span>
          </div>

          <div className="mt-6 space-y-2 text-sm text-slate-300">
            <p className="inline-flex items-center gap-2"><Mail className="w-4 h-4" />{profile.email}</p>
            <p className="inline-flex items-center gap-2"><Phone className="w-4 h-4" />{profile.mobileNumber}</p>
          </div>
        </motion.aside>

        <div className="lg:col-span-2 space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass-dark border border-white/10 p-6"
          >
            <h2 className="text-lg font-bold text-white">Edit profile details</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Field label="Display name" value={name} onChange={setName} />
              <Field label="Profile image URL" value={imageUrl} onChange={setImageUrl} />
            </div>

            <motion.button
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              onClick={saveProfile} 
              disabled={saving} 
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2.5 font-semibold disabled:opacity-60 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save profile'}
            </motion.button>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl glass-dark border border-white/10 p-6"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-light" />
                <p className="font-semibold text-white">Profile completion</p>
              </div>
              <p className="text-sm font-bold text-primary-light">{completion}%</p>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary-main to-primary-light"
              />
            </div>
            <p className="text-xs text-slate-300 mt-2 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-green" /> More complete profiles lead to better matching context.
            </p>
          </motion.section>

          <section className="grid sm:grid-cols-3 gap-3">
            <Link href="/customer/jobs">
              <Stat label="Total Jobs" value={profile.totalJobs || 0} />
            </Link>
            <Link href="/customer/jobs?status=COMPLETED">
              <Stat label="Completed" value={profile.completedJobs || 0} />
            </Link>
            <Stat label="Total Spend" value={`₹${(profile.totalSpent || 0).toLocaleString()}`} />
          </section>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl glass-dark border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Saved addresses</h3>
          {!showAddressForm && (
            <button
              type="button"
              onClick={() => setShowAddressForm(true)}
              className="text-xs text-primary-light hover:text-primary-main inline-flex items-center gap-1"
            >
              Add new <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {showAddressForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl glass border border-primary-main/30 p-4 mb-4 bg-primary-main/5"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Add New Address</h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(false)
                  setAddressForm({
                    addressLabel: '',
                    addressLine1: '',
                    addressLine2: '',
                    landmark: '',
                    cityId: 0,
                    zoneId: undefined,
                    podId: undefined,
                    pincode: '',
                    isPrimary: false,
                  })
                  setZones([])
                  setPods([])
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">Address Label (optional)</label>
                <input
                  type="text"
                  value={addressForm.addressLabel || ''}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, addressLabel: e.target.value }))}
                  placeholder="Home, Office, etc."
                  className="w-full rounded-lg glass border border-white/20 px-3 py-2 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">City *</label>
                <select
                  value={addressForm.cityId || 0}
                  onChange={(e) => handleCityChange(Number(e.target.value))}
                  disabled={loadingCities}
                  className="w-full rounded-lg glass border border-white/20 px-3 py-2 text-sm text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary-main/50 disabled:opacity-50"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value={0}>Select city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-300">
                  You can also let SERVICHAYA detect your area automatically.
                </p>
                <motion.button
                  type="button"
                  whileHover={{ scale: resolvingLocation ? 1 : 1.02 }}
                  whileTap={{ scale: resolvingLocation ? 1 : 0.98 }}
                  onClick={useCurrentLocationForAddress}
                  disabled={resolvingLocation}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary-main/50 px-3 py-1.5 text-[11px] text-primary-light hover:bg-primary-main/10 disabled:opacity-60"
                >
                  {resolvingLocation ? (
                    <>
                      <ButtonLoader size="sm" />
                      <span>Detecting location...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3" />
                      <span>Use current location</span>
                    </>
                  )}
                </motion.button>
              </div>
              
              {resolvingLocation && (
                <div className="md:col-span-2 flex items-center gap-2 text-xs text-slate-400 bg-primary-main/5 border border-primary-main/20 rounded-lg px-3 py-2 mt-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-main border-t-transparent" />
                  <span>Getting your location and detecting area...</span>
                </div>
              )}
              
              {addressForm.cityId > 0 && zones.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-white">Zone (optional)</label>
                  <select
                    value={addressForm.zoneId || ''}
                    onChange={(e) => handleZoneChange(e.target.value ? Number(e.target.value) : 0)}
                    disabled={loadingZones}
                    className="w-full rounded-lg glass border border-white/20 px-3 py-2 text-sm text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary-main/50 disabled:opacity-50"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">Select zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {addressForm.zoneId && pods.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-white">POD (optional)</label>
                  <select
                    value={addressForm.podId || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, podId: e.target.value ? Number(e.target.value) : undefined }))}
                    disabled={loadingPods}
                    className="w-full rounded-lg glass border border-white/20 px-3 py-2 text-sm text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary-main/50 disabled:opacity-50"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">Select POD</option>
                    {pods.map((pod) => (
                      <option key={pod.id} value={pod.id}>{pod.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Map-based precise location picker */}
              {(addressForm.cityId > 0 || addressForm.podId) && (
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold mb-1 text-white">
                    Exact location on map <span className="text-[10px] font-normal text-slate-300">(optional but recommended)</span>
                  </label>
                  {resolvingLocation && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                      Detecting area...
                    </div>
                  )}
                  {resolvedLocationInfo && !resolvingLocation && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                      <BadgeCheck className="h-3 w-3" />
                      <span>
                        {[resolvedLocationInfo.podName, resolvedLocationInfo.zoneName, resolvedLocationInfo.cityName]
                          .filter(Boolean)
                          .join(' → ')}
                      </span>
                    </div>
                  )}
                  <LocationPicker
                    center={
                      (() => {
                        const selectedPod = pods.find(p => p.id === addressForm.podId)
                        if (selectedPod) {
                          return { lat: selectedPod.latitude, lng: selectedPod.longitude }
                        }
                        const selectedCity = cities.find(c => c.id === addressForm.cityId)
                        if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
                          return { lat: selectedCity.latitude, lng: selectedCity.longitude }
                        }
                        // Fallback: some neutral coordinates (e.g. India center)
                        return { lat: 22.9734, lng: 78.6569 }
                      })()
                    }
                    radiusKm={
                      (() => {
                        const selectedPod = pods.find(p => p.id === addressForm.podId)
                        return selectedPod?.serviceRadiusKm
                      })()
                    }
                    value={
                      addressForm.latitude !== undefined && addressForm.longitude !== undefined
                        ? { lat: addressForm.latitude, lng: addressForm.longitude }
                        : undefined
                    }
                    onChange={handleMapLocationChange}
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-white">Address Line 1 *</label>
                <input
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                  placeholder="Street address, building name"
                  className="w-full rounded-lg glass border border-white/20 px-3 py-2 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-white">Address Line 2 (optional)</label>
                <input
                  type="text"
                  value={addressForm.addressLine2 || ''}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                  placeholder="Apartment, suite, unit, etc."
                  className="w-full rounded-lg glass border border-white/20 px-3 py-2 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">Landmark (optional)</label>
                <input
                  type="text"
                  value={addressForm.landmark || ''}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                  placeholder="Nearby landmark"
                  className="w-full rounded-lg glass border border-white/20 px-3 py-2 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">Pincode (optional)</label>
                <input
                  type="text"
                  value={addressForm.pincode || ''}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className="w-full rounded-lg glass border border-white/20 px-3 py-2 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-xs text-white">
                  <input
                    type="checkbox"
                    checked={addressForm.isPrimary || false}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="rounded"
                  />
                  Set as default address
                </label>
              </div>
              
              <div className="md:col-span-2 flex gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: savingAddress ? 1 : 1.02 }}
                  whileTap={{ scale: savingAddress ? 1 : 0.98 }}
                  onClick={addAddress}
                  disabled={savingAddress}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2 text-sm font-semibold disabled:opacity-60 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
                >
                  {savingAddress ? (
                    <>
                      <ButtonLoader size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Address
                    </>
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAddressForm(false)
                    setAddressForm({
                      addressLabel: '',
                      addressLine1: '',
                      addressLine2: '',
                      landmark: '',
                      cityId: 0,
                      zoneId: undefined,
                      podId: undefined,
                      pincode: '',
                      isPrimary: false,
                    })
                    setZones([])
                    setPods([])
                  }}
                  className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        {profile.addresses?.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {profile.addresses.map((address, index) => (
              <motion.article
                key={address.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl glass border border-white/10 p-4 hover:border-primary-main/50 transition-all"
              >
                <p className="font-semibold text-sm inline-flex items-center gap-1 text-white">
                  <MapPin className="w-4 h-4 text-primary-light" />{address.addressLine1}
                </p>
                {address.addressLine2 && <p className="text-xs text-slate-300 mt-1">{address.addressLine2}</p>}
                <p className="text-xs text-slate-300 mt-1">{address.cityName} {address.pincode ? `- ${address.pincode}` : ''}</p>
                {address.isDefault && (
                  <span className="inline-block mt-2 text-xs rounded-full bg-primary-main/20 px-2 py-1 text-primary-light font-semibold border border-primary-main/30">
                    Default
                  </span>
                )}
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <MapPin className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
            <p className="text-sm text-slate-300 mb-3">No saved addresses available.</p>
            {!showAddressForm && (
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2 text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all"
              >
                Add address
              </button>
            )}
          </div>
        )}
      </motion.section>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-white">{label}</label>
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50" 
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <motion.article
      whileHover={{ scale: 1.05, y: -5 }}
      className="rounded-xl glass-dark border border-white/10 p-4"
    >
      <p className="text-xs text-slate-300">{label}</p>
      <p className="text-xl font-bold mt-1 text-white">{value}</p>
    </motion.article>
  )
}
