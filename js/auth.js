// ═══════════════════════════════════════════════════════
// auth.js — Google認証まわり
// ═══════════════════════════════════════════════════════

let currentUser = null;

// ページ読み込み時：セッション確認
window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('auth_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showMainApp();
    } catch (e) {
      sessionStorage.removeItem('auth_user');
    }
  }
});

// GIS コールバック（Googleログイン成功時）
function handleGoogleCredential(response) {
  try {
    const payload = parseJwt(response.credential);
    const email = payload.email || '';
    if (!email.endsWith('@' + CONFIG.domain)) {
      showAuthError(
        'このアカウント（' + email + '）はご利用いただけません。' +
        '@' + CONFIG.domain + ' のアカウントでログインしてください。'
      );
      return;
    }
    currentUser = {
      name:    payload.name || email,
      email:   email,
      picture: payload.picture || '',
      initial: (payload.name || email).charAt(0).toUpperCase(),
    };
    sessionStorage.setItem('auth_user', JSON.stringify(currentUser));
    showMainApp();
  } catch (e) {
    showAuthError('認証に失敗しました。もう一度お試しください。');
  }
}

function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(
    decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    )
  );
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function showMainApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-header').style.display = 'flex';
  document.getElementById('upload-screen').style.display = 'block';

  if (currentUser) {
    document.getElementById('user-name-display').textContent =
      currentUser.name || currentUser.email;
    const placeholder = document.getElementById('user-avatar-placeholder');
    if (currentUser.picture) {
      placeholder.outerHTML =
        '<img class="user-avatar" src="' + currentUser.picture +
        '" alt="' + currentUser.name +
        '" referrerpolicy="no-referrer" id="user-avatar-placeholder">';
    } else {
      placeholder.textContent = currentUser.initial;
    }
  }
}

function signOut() {
  sessionStorage.removeItem('auth_user');
  currentUser = null;
  if (window.google && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }
  location.reload();
}
