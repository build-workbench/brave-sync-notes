/**
 * 设备稳定 ID
 * v2 信封的 deviceId:localStorage 生成一次后持久复用,
 * 用于服务端成员标识与客户端防重放的 per-device seq 跟踪。
 */

export const DEVICE_ID_KEY = 'notesync-device-id';
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;

function randomDeviceId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const base64 = btoa(String.fromCharCode(...bytes));
  // URL-safe 化并去掉 padding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let cached = null;

/**
 * 获取当前设备 ID(无则生成并写入 localStorage)
 * @returns {string} [a-zA-Z0-9_-]{8,64}
 */
export function getDeviceId() {
  let stored = null;
  try {
    stored = localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    // localStorage 不可用(隐私模式等):会话内缓存一个临时 ID
    if (!cached || !DEVICE_ID_PATTERN.test(cached)) {
      cached = randomDeviceId();
    }
    return cached;
  }

  // localStorage 可读时以存储值为准(测试/多标签页可能直接改写)
  if (stored && DEVICE_ID_PATTERN.test(stored)) {
    cached = stored;
    return cached;
  }

  cached = randomDeviceId();
  try {
    localStorage.setItem(DEVICE_ID_KEY, cached);
  } catch {
    // 写入失败也接受临时 ID
  }
  return cached;
}
