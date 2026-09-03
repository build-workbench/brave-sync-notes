/**
 * 发送端单调序号
 *
 * 每个 roomId 一个严格递增计数器,持久化在 localStorage。
 * 存储被清后用当前毫秒做基线——毫秒值必然大于此前所有小序号,
 * 保证同一设备新会话不会复用旧序号区间。
 *
 * 注意:该序号仅保证发送端单调,服务端不校验、接收端不跟踪水位,
 * 因此**不构成重放防护**(恶意服务器仍可原样重放旧信封);
 * 完整防重放需要服务端 per-device 状态机,属已知设计局限。
 */

import { SEQ_KEY_PREFIX } from './constants';

export { SEQ_KEY_PREFIX };

let _lastBaseline = 0;
const BASELINE_FALLBACK = () => {
  const now = Date.now();
  _lastBaseline = Math.max(now, _lastBaseline + 1);
  return _lastBaseline;
};

function readStored(roomId) {
  try {
    const raw = localStorage.getItem(SEQ_KEY_PREFIX + roomId);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}

function writeStored(roomId, seq) {
  try {
    localStorage.setItem(SEQ_KEY_PREFIX + roomId, String(seq));
  } catch {
    // 写入失败:计数器仅存内存,重启后从基线重新开始(仍安全)
  }
}

/**
 * 取下一个序号(先自增再返回,严格单调)。
 * @param {string} roomId
 * @returns {number}
 */
export function nextSeq(roomId) {
  const stored = readStored(roomId);
  const current = stored ?? BASELINE_FALLBACK();
  const next = current + 1;
  writeStored(roomId, next);
  return next;
}
