import api from '../api'

export interface ResolvedLocationDto {
  cityId: number
  cityName?: string
  zoneId?: number
  zoneName?: string
  podId?: number
  podName?: string
}

/**
 * Resolve a raw lat/lng into SERVICHAYA master data (city/zone/pod).
 *
 * NOTE: Backend endpoint `/location/resolve` is assumed to exist or will be
 * implemented later. This function is safe to call now – if the endpoint is
 * missing or fails, it will just throw and caller can handle gracefully.
 */
export const resolveLocation = async (
  latitude: number,
  longitude: number
): Promise<ResolvedLocationDto> => {
  const response = await api.post('/location/resolve', {
    latitude,
    longitude,
  })
  return response.data.data
}

