/* ============================================================
   NKNP STUDIO — storage.js
   Chịu trách nhiệm duy nhất: đọc / ghi dữ liệu vào LocalStorage.
   Không chứa logic validate hay giao diện.
   ============================================================ */

const STORAGE_KEYS = {
  ACCOUNTS: "nknp_accounts",       // mảng các tài khoản đã đăng ký
  SESSION: "nknp_session",        // { isLoggedIn, email } — lưu VĨNH VIỄN (LocalStorage) khi tick "Ghi nhớ đăng nhập"
  SESSION_TEMP: "nknp_session_temp", // { isLoggedIn, email } — chỉ lưu TRONG PHIÊN trình duyệt (SessionStorage) khi KHÔNG tick nhớ
  LAST_EMAIL: "nknp_last_email",   // email đăng nhập gần nhất, dùng để tự điền sẵn ô Gmail
};

/**
 * Lấy toàn bộ danh sách tài khoản đã lưu.
 * @returns {Array<{username: string, email: string, password: string}>}
 */
function getAccounts() {
  const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // Dữ liệu hỏng -> coi như chưa có tài khoản nào, tránh crash app
    return [];
  }
}

/**
 * Ghi đè toàn bộ danh sách tài khoản.
 * @param {Array} accounts
 */
function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

/**
 * Thêm một tài khoản mới vào danh sách.
 * @param {{username: string, email: string, password: string}} account
 */
function addAccount(account) {
  const accounts = getAccounts();
  accounts.push(account);
  saveAccounts(accounts);
}

/**
 * Tìm tài khoản theo email (không phân biệt hoa/thường).
 * @param {string} email
 */
function findAccountByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return getAccounts().find((acc) => acc.email.toLowerCase() === normalized) || null;
}

/**
 * Cập nhật một hoặc nhiều trường của tài khoản đã tồn tại (vd: username,
 * password, balance...). Tìm theo email, merge các trường trong `updates`
 * vào tài khoản đó rồi lưu lại toàn bộ danh sách.
 * @param {string} email
 * @param {Object} updates - các trường cần cập nhật, vd: { username: "..." }
 * @returns {boolean} true nếu tìm thấy và cập nhật thành công
 */
function updateAccount(email, updates) {
  const normalized = email.trim().toLowerCase();
  const accounts = getAccounts();
  const index = accounts.findIndex((acc) => acc.email.toLowerCase() === normalized);

  if (index === -1) return false;

  accounts[index] = { ...accounts[index], ...updates };
  saveAccounts(accounts);
  return true;
}

/**
 * Lưu trạng thái phiên đăng nhập hiện tại.
 * @param {string} email
 * @param {boolean} remember - true: nhớ đăng nhập vĩnh viễn (LocalStorage,
 *   vẫn đăng nhập kể cả tắt trình duyệt rồi mở lại).
 *   false: chỉ nhớ trong phiên hiện tại (SessionStorage, đóng tab/trình
 *   duyệt là mất, lần sau mở lại phải đăng nhập lại — F5 vẫn còn).
 */
function setSession(email, remember) {
  const payload = JSON.stringify({ isLoggedIn: true, email });

  if (remember) {
    localStorage.setItem(STORAGE_KEYS.SESSION, payload);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TEMP); // dọn phiên tạm nếu có
  } else {
    sessionStorage.setItem(STORAGE_KEYS.SESSION_TEMP, payload);
    localStorage.removeItem(STORAGE_KEYS.SESSION); // đảm bảo không còn phiên nhớ vĩnh viễn cũ
  }
}

/**
 * Lấy phiên đăng nhập hiện tại (nếu có).
 * Ưu tiên phiên tạm (SessionStorage) trước, sau đó mới tới phiên nhớ
 * vĩnh viễn (LocalStorage).
 * @returns {{isLoggedIn: boolean, email: string} | null}
 */
function getSession() {
  const tempRaw = sessionStorage.getItem(STORAGE_KEYS.SESSION_TEMP);
  if (tempRaw) {
    try {
      return JSON.parse(tempRaw);
    } catch (err) {
      /* rơi xuống kiểm tra tiếp phiên vĩnh viễn */
    }
  }

  const persistentRaw = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!persistentRaw) return null;
  try {
    return JSON.parse(persistentRaw);
  } catch (err) {
    return null;
  }
}

/**
 * Xóa phiên đăng nhập (đăng xuất) — cả 2 loại. KHÔNG xóa tài khoản đã đăng ký.
 */
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  sessionStorage.removeItem(STORAGE_KEYS.SESSION_TEMP);
}

/**
 * Lưu lại email đăng nhập gần nhất (dùng để tự điền sẵn ô Gmail ở
 * lần truy cập sau, kể cả khi người dùng KHÔNG tick "Ghi nhớ đăng nhập").
 * @param {string} email
 */
function saveLastEmail(email) {
  localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
}

/**
 * Lấy email đăng nhập gần nhất (nếu có).
 * @returns {string}
 */
function getLastEmail() {
  return localStorage.getItem(STORAGE_KEYS.LAST_EMAIL) || "";
}