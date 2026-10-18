/**
 * Device Session Helper
 * Generates and stores a unique session identifier per browser/device in localStorage.
 * Ensures strict privacy: each visitor starts in 'unauthenticated' state and only views
 * their own portal records.
 */

export function getDeviceSessionId() {
  if (typeof window !== 'undefined' && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const urlSid = params.get('sessionId');
    if (urlSid) {
      localStorage.setItem('chitkara_device_session_id', urlSid);
      return urlSid;
    }
  }

  let id = localStorage.getItem('chitkara_device_session_id');
  if (!id) {
    id = 'cu_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('chitkara_device_session_id', id);
  }
  return id;
}

export function clearDeviceSession() {
  localStorage.removeItem('chitkara_device_session_id');
  localStorage.removeItem('chitkara_session_data');
}
