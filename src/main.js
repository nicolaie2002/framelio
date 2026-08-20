import './style.css';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { createClient } from '@supabase/supabase-js';

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;

const FREE_LIMITS = {
  image: {
    maxTargetBytes: 2 * MEGABYTE,
    maxDailyActions: 3,
  },
  video: {
    maxTargetBytes: 8 * MEGABYTE,
    maxDailyActions: 2,
  },
};

const MODES = {
  image: {
    title: 'Trage imaginea aici',
    button: 'Comprimă imaginea',
    inputAccept: 'image/jpeg,image/png,image/webp',
    limits: 'JPG, PNG sau WebP · maximum 50 MB',
    maximumBytes: 50 * MEGABYTE,
    targetHint: 'Alege limita de care ai nevoie.',
    defaultTarget: MEGABYTE,
  },
  video: {
    title: 'Trage videoclipul aici',
    button: 'Comprimă videoclipul',
    inputAccept: 'video/mp4,video/quicktime,video/webm,video/x-m4v,video/*',
    limits: 'MP4, MOV sau WebM · maximum 250 MB',
    maximumBytes: 250 * MEGABYTE,
    targetHint: 'Mai mic înseamnă un fișier mai ușor de trimis.',
    defaultTarget: 16 * MEGABYTE,
  },
};

const PLATFORM_OPTIONS = {
  image: {
    general: {
      label: 'General',
      hint: 'Pentru uploaduri normale, web și trimiteri rapide.',
      defaultTarget: MEGABYTE,
      presets: [
        { label: '500 KB', bytes: 500 * KILOBYTE },
        { label: '1 MB', bytes: MEGABYTE },
        { label: '2 MB', bytes: 2 * MEGABYTE },
        { label: '5 MB', bytes: 5 * MEGABYTE },
      ],
    },
    instagram: {
      label: 'Instagram',
      hint: 'Postări Instagram: ideal sub 2 MB. Story/ reels: recomandat sub 1–2 MB.',
      defaultTarget: 2 * MEGABYTE,
      presets: [
        { label: '1 MB', bytes: MEGABYTE },
        { label: '2 MB', bytes: 2 * MEGABYTE },
        { label: '4 MB', bytes: 4 * MEGABYTE },
        { label: '8 MB', bytes: 8 * MEGABYTE },
      ],
    },
    discord: {
      label: 'Discord',
      hint: 'Pentru fișiere trimise în Discord, de obicei sub 8 MB pentru o experiență bună.',
      defaultTarget: 8 * MEGABYTE,
      presets: [
        { label: '1 MB', bytes: MEGABYTE },
        { label: '2 MB', bytes: 2 * MEGABYTE },
        { label: '4 MB', bytes: 4 * MEGABYTE },
        { label: '8 MB', bytes: 8 * MEGABYTE },
      ],
    },
    whatsapp: {
      label: 'WhatsApp',
      hint: 'WhatsApp acceptă imagini mari, dar 2–5 MB oferă trimiteri mai rapide.',
      defaultTarget: 2 * MEGABYTE,
      presets: [
        { label: '500 KB', bytes: 500 * KILOBYTE },
        { label: '1 MB', bytes: MEGABYTE },
        { label: '2 MB', bytes: 2 * MEGABYTE },
        { label: '5 MB', bytes: 5 * MEGABYTE },
      ],
    },
  },
  video: {
    general: {
      label: 'General',
      hint: 'Pentru distribuire generală și trimiteri rapide.',
      defaultTarget: 16 * MEGABYTE,
      presets: [
        { label: '10 MB', bytes: 10 * MEGABYTE },
        { label: '16 MB', bytes: 16 * MEGABYTE },
        { label: '25 MB', bytes: 25 * MEGABYTE },
        { label: '50 MB', bytes: 50 * MEGABYTE },
      ],
    },
    instagram: {
      label: 'Instagram',
      hint: 'Reel/short: de obicei sub 16–25 MB pentru mai multă stabilitate.',
      defaultTarget: 16 * MEGABYTE,
      presets: [
        { label: '8 MB', bytes: 8 * MEGABYTE },
        { label: '16 MB', bytes: 16 * MEGABYTE },
        { label: '25 MB', bytes: 25 * MEGABYTE },
        { label: '50 MB', bytes: 50 * MEGABYTE },
      ],
    },
    discord: {
      label: 'Discord',
      hint: 'Pentru partajare rapidă în servere: recomandat sub 8–16 MB.',
      defaultTarget: 8 * MEGABYTE,
      presets: [
        { label: '4 MB', bytes: 4 * MEGABYTE },
        { label: '8 MB', bytes: 8 * MEGABYTE },
        { label: '16 MB', bytes: 16 * MEGABYTE },
        { label: '25 MB', bytes: 25 * MEGABYTE },
      ],
    },
    tiktok: {
      label: 'TikTok',
      hint: 'TikTok este mai tolerant, dar 16–25 MB îmbunătățește uploadul și experiența.',
      defaultTarget: 16 * MEGABYTE,
      presets: [
        { label: '8 MB', bytes: 8 * MEGABYTE },
        { label: '16 MB', bytes: 16 * MEGABYTE },
        { label: '25 MB', bytes: 25 * MEGABYTE },
        { label: '50 MB', bytes: 50 * MEGABYTE },
      ],
    },
  },
};

const elements = {
  modeTabs: [...document.querySelectorAll('.type-tab')],
  categoryList: document.querySelector('#category-list'),
  planPillText: document.querySelector('#plan-pill-text'),
  upgradeButton: document.querySelector('#upgrade-button'),
  accountButton: document.querySelector('#account-button'),
  upgradeModal: document.querySelector('#upgrade-modal'),
  closeUpgrade: document.querySelector('#close-upgrade'),
  activatePro: document.querySelector('#activate-pro'),
  dropZone: document.querySelector('#drop-zone'),
  fileInput: document.querySelector('#file-input'),
  uploadTitle: document.querySelector('#upload-title'),
  uploadLimits: document.querySelector('#upload-limits'),
  browseButton: document.querySelector('#browse-button'),
  fileCard: document.querySelector('#file-card'),
  imagePreview: document.querySelector('#image-preview'),
  fileName: document.querySelector('#file-name'),
  fileMeta: document.querySelector('#file-meta'),
  removeFile: document.querySelector('#remove-file'),
  targetHint: document.querySelector('#target-hint'),
  presetList: document.querySelector('#preset-list'),
  customTargetInput: document.querySelector('#custom-target-input'),
  customTargetUnit: document.querySelector('#custom-target-unit'),
  applyCustomTarget: document.querySelector('#apply-custom-target'),
  compressButton: document.querySelector('#compress-button'),
  compressLabel: document.querySelector('#compress-label'),
  statusCard: document.querySelector('#status-card'),
  statusDot: document.querySelector('#status-dot'),
  statusText: document.querySelector('#status-text'),
  progressPercent: document.querySelector('#progress-percent'),
  progressTrack: document.querySelector('.progress-track'),
  progressBar: document.querySelector('#progress-bar'),
  resultCard: document.querySelector('#result-card'),
  resultSummary: document.querySelector('#result-summary'),
  originalSize: document.querySelector('#original-size'),
  finalSize: document.querySelector('#final-size'),
  downloadLink: document.querySelector('#download-link'),
  startOver: document.querySelector('#start-over'),
  authModal: document.querySelector('#auth-modal'),
  closeAuth: document.querySelector('#close-auth'),
  authForm: document.querySelector('#auth-form'),
  authEmail: document.querySelector('#auth-email'),
  authPassword: document.querySelector('#auth-password'),
  authMessage: document.querySelector('#auth-message'),
  signUp: document.querySelector('#sign-up'),
  signOut: document.querySelector('#sign-out'),
};

const state = {
  mode: null,
  platform: 'general',
  file: null,
  selectedTarget: MODES.image.defaultTarget,
  isProcessing: false,
  resultUrl: null,
  previewUrl: null,
  ffmpeg: null,
  ffmpegLogs: [],
  videoPass: 0,
  isPro: false,
};

const BILLING = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

const supabase = BILLING.supabaseUrl && BILLING.supabaseAnonKey
  ? createClient(BILLING.supabaseUrl, BILLING.supabaseAnonKey)
  : null;

function formatBytes(bytes) {
  if (bytes < KILOBYTE) return `${bytes} B`;
  if (bytes < MEGABYTE) return `${(bytes / KILOBYTE).toFixed(bytes < 100 * KILOBYTE ? 1 : 0)} KB`;
  return `${(bytes / MEGABYTE).toFixed(bytes < 10 * MEGABYTE ? 2 : 1)} MB`;
}

function getExtension(fileName) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
}

function baseFileName(fileName) {
  return fileName.replace(/\.[^/.]+$/, '') || 'file';
}

function isAcceptedFile(file, mode) {
  const extension = getExtension(file.name);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const videoExtensions = ['mp4', 'mov', 'webm', 'm4v'];

  const hasAcceptedExtension = mode === 'image'
    ? imageExtensions.includes(extension)
    : videoExtensions.includes(extension);
  const hasAcceptedType = !file.type || (mode === 'image' ? file.type.startsWith('image/') : file.type.startsWith('video/'));

  return hasAcceptedExtension && hasAcceptedType;
}

function clearObjectUrl(property) {
  if (state[property]) {
    URL.revokeObjectURL(state[property]);
    state[property] = null;
  }
}

function getSelectedPlatform() {
  const modePlatform = PLATFORM_OPTIONS[state.mode];
  return modePlatform?.[state.platform] ? state.platform : 'general';
}

function renderPlatformOptions() {
  const modePlatforms = PLATFORM_OPTIONS[state.mode];
  if (!modePlatforms) return;

  const activePlatform = getSelectedPlatform();
  elements.categoryList.replaceChildren(
    ...Object.entries(modePlatforms).map(([platformKey, config]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `category-option${platformKey === activePlatform ? ' is-selected' : ''}`;
      button.textContent = config.label;
      button.setAttribute('aria-pressed', String(platformKey === activePlatform));
      button.addEventListener('click', () => {
        if (state.isProcessing) return;
        state.platform = platformKey;
        state.selectedTarget = config.defaultTarget;
        renderPlatformOptions();
        renderPresets();
        elements.targetHint.textContent = config.hint;
      });
      return button;
    }),
  );
}

function readDailyUsage() {
  const today = new Date().toISOString().slice(0, 10);
  const saved = localStorage.getItem('framelio-daily-usage');
  if (!saved) return { date: today, count: 0 };

  try {
    const parsed = JSON.parse(saved);
    if (parsed.date !== today) return { date: today, count: 0 };
    return { date: today, count: Number(parsed.count) || 0 };
  } catch {
    return { date: today, count: 0 };
  }
}

function writeDailyUsage(count) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('framelio-daily-usage', JSON.stringify({ date: today, count }));
}

function getCurrentFreeLimitForMode() {
  return state.mode ? FREE_LIMITS[state.mode] : null;
}

function canUseCurrentPlan() {
  if (state.isPro) return { allowed: true, reason: null };

  const freeLimit = getCurrentFreeLimitForMode();
  if (!freeLimit) return { allowed: true, reason: null };

  if (state.selectedTarget > freeLimit.maxTargetBytes) {
    return {
      allowed: false,
      reason: `Planul Free permite până la ${formatBytes(freeLimit.maxTargetBytes)} pentru ${state.mode === 'image' ? 'imagini' : 'video'}. Upgrade la Pro pentru limite mai mari.`,
    };
  }

  const usage = readDailyUsage();
  if (usage.count >= freeLimit.maxDailyActions) {
    return {
      allowed: false,
      reason: `Ai atins limita gratuită: ${freeLimit.maxDailyActions} compresii / zi. Upgrade to Pro pentru nelimitat.`,
    };
  }

  return { allowed: true, reason: null };
}

function updatePlanBadge() {
  elements.planPillText.textContent = state.isPro ? 'Pro' : 'Free';
  elements.upgradeButton.textContent = state.isPro ? 'Pro enabled' : 'Upgrade to Pro';
}

function openUpgradeModal() {
  elements.upgradeModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeUpgradeModal() {
  elements.upgradeModal.hidden = true;
  document.body.classList.remove('modal-open');
}

async function startStripeCheckout() {
  if (!supabase) {
    setStatus('warning', 'Configurează Supabase și Stripe pentru a activa Pro.');
    return;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      closeUpgradeModal();
      openAuthModal();
      return;
    }
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Checkout unavailable');
    }

    const payload = await response.json();
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    throw new Error('No checkout URL returned');
  } catch (error) {
    setStatus('error', error instanceof Error ? error.message : 'Checkout-ul nu este disponibil.');
  }
}

function openAuthModal() {
  elements.authModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeAuthModal() {
  elements.authModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function setAuthMessage(message, kind = '') {
  elements.authMessage.textContent = message;
  elements.authMessage.dataset.kind = kind;
}

async function refreshAccount() {
  if (!supabase) {
    elements.accountButton.textContent = 'Cont';
    return;
  }
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  elements.accountButton.textContent = session?.user.email?.split('@')[0] || 'Cont';
  elements.signOut.hidden = !session;
  elements.authForm.hidden = Boolean(session);
  if (!session) return;

  const response = await fetch('/api/verify-license', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) return;
  const license = await response.json();
  state.isPro = license.isPro;
  updatePlanBadge();
}

async function signIn(event) {
  event.preventDefault();
  if (!supabase) {
    setAuthMessage('Configurează variabilele Supabase pentru autentificare.', 'error');
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: elements.authEmail.value,
    password: elements.authPassword.value,
  });
  if (error) {
    setAuthMessage(error.message, 'error');
    return;
  }
  setAuthMessage('Autentificare reușită.', 'success');
  await refreshAccount();
}

async function signUp() {
  if (!supabase) {
    setAuthMessage('Configurează variabilele Supabase pentru autentificare.', 'error');
    return;
  }
  const { error } = await supabase.auth.signUp({
    email: elements.authEmail.value,
    password: elements.authPassword.value,
    options: { emailRedirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin },
  });
  setAuthMessage(error ? error.message : 'Verifică emailul pentru confirmarea contului.', error ? 'error' : 'success');
}

function renderPresets() {
  const activePlatform = getSelectedPlatform();
  const presets = PLATFORM_OPTIONS[state.mode][activePlatform].presets;
  if (!presets.some((preset) => preset.bytes === state.selectedTarget)) {
    state.selectedTarget = PLATFORM_OPTIONS[state.mode][activePlatform].defaultTarget;
  }

  elements.presetList.replaceChildren(
    ...presets.map((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `preset${preset.bytes === state.selectedTarget ? ' is-selected' : ''}`;
      button.textContent = preset.label;
      button.setAttribute('aria-pressed', String(preset.bytes === state.selectedTarget));
      button.addEventListener('click', () => {
        if (state.isProcessing) return;
        state.selectedTarget = preset.bytes;
        elements.customTargetInput.value = '';
        renderPresets();
      });
      return button;
    }),
  );
}

function applyCustomTarget() {
  const value = Number(elements.customTargetInput.value);
  const unit = elements.customTargetUnit.value;

  if (!Number.isFinite(value) || value <= 0) {
    setStatus('warning', 'Introdu o valoare validă pentru dimensiunea personalizată.');
    return;
  }

  const bytes = unit === 'kb' ? value * KILOBYTE : value * MEGABYTE;
  const maxBytes = MODES[state.mode].maximumBytes;
  if (bytes > maxBytes) {
    setStatus('error', `Valoarea maximă acceptată este ${formatBytes(maxBytes)}.`);
    return;
  }

  state.selectedTarget = Math.round(bytes);
  elements.customTargetInput.value = value;
  renderPresets();
  setStatus('success', `Țintă personalizată setată la ${formatBytes(state.selectedTarget)}.`, 100);
}

function updateActionAvailability() {
  elements.compressButton.disabled = !state.file || state.isProcessing;
}

function setStatus(kind, message, progress = null) {
  elements.statusCard.hidden = false;
  elements.statusCard.dataset.kind = kind;
  elements.statusText.textContent = message;
  elements.statusDot.className = `status-dot ${kind}`;

  if (progress === null) {
    elements.progressPercent.textContent = '';
    elements.progressTrack.setAttribute('aria-valuenow', '0');
    elements.progressBar.style.width = '0%';
    return;
  }

  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  elements.progressPercent.textContent = `${safeProgress}%`;
  elements.progressTrack.setAttribute('aria-valuenow', String(safeProgress));
  elements.progressBar.style.width = `${safeProgress}%`;
}

function hideStatus() {
  elements.statusCard.hidden = true;
  elements.statusCard.removeAttribute('data-kind');
}

function clearResult() {
  clearObjectUrl('resultUrl');
  elements.resultCard.hidden = true;
  elements.downloadLink.removeAttribute('href');
}

function clearFile() {
  if (state.isProcessing) return;
  state.file = null;
  clearObjectUrl('previewUrl');
  elements.imagePreview.replaceChildren();
  elements.imagePreview.hidden = true;
  elements.fileCard.hidden = true;
  elements.dropZone.hidden = false;
  elements.fileInput.value = '';
  clearResult();
  hideStatus();
  updateActionAvailability();
}

function setMode(mode) {
  if (state.mode === mode || state.isProcessing) return;
  clearFile();
  state.mode = mode;
  state.platform = 'general';
  state.selectedTarget = MODES[mode].defaultTarget;
  const modeConfig = MODES[mode];

  elements.modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  elements.uploadTitle.textContent = modeConfig.title;
  elements.uploadLimits.textContent = modeConfig.limits;
  elements.targetHint.textContent = PLATFORM_OPTIONS[mode][state.platform].hint;
  elements.compressLabel.textContent = modeConfig.button;
  elements.fileInput.accept = modeConfig.inputAccept;
  renderPlatformOptions();
  renderPresets();
}

function showImagePreview(file) {
  clearObjectUrl('previewUrl');
  state.previewUrl = URL.createObjectURL(file);
  const image = document.createElement('img');
  image.src = state.previewUrl;
  image.alt = '';
  elements.imagePreview.replaceChildren(image);
  elements.imagePreview.hidden = false;
}

function selectFile(file) {
  const modeConfig = MODES[state.mode];
  if (!isAcceptedFile(file, state.mode)) {
    setStatus('error', state.mode === 'image' ? 'Alege un fișier JPG, PNG sau WebP.' : 'Alege un fișier MP4, MOV sau WebM.');
    return;
  }
  if (file.size > modeConfig.maximumBytes) {
    setStatus('error', `Fișierul depășește limita de ${formatBytes(modeConfig.maximumBytes)} pentru acest MVP.`);
    return;
  }

  state.file = file;
  clearResult();
  hideStatus();
  elements.dropZone.hidden = true;
  elements.fileCard.hidden = false;
  elements.fileName.textContent = file.name;
  elements.fileMeta.textContent = `${formatBytes(file.size)} · ${state.mode === 'image' ? 'imagine' : 'video'}`;
  if (state.mode === 'image') showImagePreview(file);
  else {
    clearObjectUrl('previewUrl');
    elements.imagePreview.replaceChildren();
    elements.imagePreview.hidden = true;
  }
  updateActionAvailability();
}

function outputName(file, extension) {
  return `${baseFileName(file.name)}-framelio.${extension}`;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Browserul nu a putut crea imaginea comprimată.'))), type, quality);
  });
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Imaginea nu a putut fi citită.'));
      element.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressImage(file, targetBytes) {
  if (file.size <= targetBytes) {
    return { blob: file, name: file.name, alreadyFits: true };
  }

  const source = await loadBitmap(file);
  const longestSide = Math.max(source.width, source.height);
  const initialScale = Math.min(1, 6000 / longestSide);
  let width = Math.max(1, Math.round(source.width * initialScale));
  let height = Math.max(1, Math.round(source.height * initialScale));
  const preserveTransparency = file.type === 'image/png' || file.type === 'image/webp';
  const outputType = preserveTransparency ? 'image/webp' : 'image/jpeg';
  let smallestBlob = null;

  try {
    for (let scaleAttempt = 0; scaleAttempt < 12; scaleAttempt += 1) {
      setStatus('processing', `Optimizez imaginea (${scaleAttempt + 1}/12)…`, 8 + scaleAttempt * 7);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: preserveTransparency });
      if (!context) throw new Error('Browserul nu poate procesa imaginea în acest mod.');
      if (!preserveTransparency) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(source, 0, 0, width, height);

      let low = 0.12;
      let high = 0.95;
      let bestForScale = null;

      for (let qualityAttempt = 0; qualityAttempt < 8; qualityAttempt += 1) {
        const quality = (low + high) / 2;
        const blob = await canvasToBlob(canvas, outputType, quality);
        if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob;

        if (blob.size <= targetBytes) {
          bestForScale = blob;
          low = quality;
        } else {
          high = quality;
        }
      }

      if (bestForScale) {
        return {
          blob: bestForScale,
          name: outputName(file, outputType === 'image/webp' ? 'webp' : 'jpg'),
          alreadyFits: false,
        };
      }

      if (width <= 160 || height <= 160) break;
      width = Math.max(160, Math.round(width * 0.82));
      height = Math.max(160, Math.round(height * 0.82));
    }
  } finally {
    source.close?.();
  }

  if (!smallestBlob) throw new Error('Nu am putut comprima această imagine.');
  return {
    blob: smallestBlob,
    name: outputName(file, outputType === 'image/webp' ? 'webp' : 'jpg'),
    alreadyFits: false,
  };
}

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const timeout = window.setTimeout(() => cleanup(new Error('Citirea duratei videoclipului a expirat.')), 20000);
    const cleanup = (error, duration = video.duration) => {
      window.clearTimeout(timeout);
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      if (error) reject(error);
      else resolve(duration);
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => cleanup(undefined, video.duration);
    video.onerror = () => cleanup(new Error('Browserul nu poate citi acest videoclip. Încearcă un MP4, MOV sau WebM standard.'));
    video.src = url;
  });
}

function getVideoSettings(duration, targetBytes) {
  const totalKbps = (targetBytes * 8) / duration / 1000;
  const audioKbps = Math.max(32, Math.min(128, Math.floor(totalKbps * 0.12)));
  const videoKbps = Math.floor((totalKbps - audioKbps) * 0.88);
  if (videoKbps < 40) {
    throw new Error('Videoclipul este prea lung pentru această dimensiune țintă. Alege o țintă mai mare.');
  }
  return { videoKbps, audioKbps };
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

async function ensureFfmpeg() {
  if (state.ffmpeg?.loaded) return state.ffmpeg;
  if (!state.ffmpeg) {
    state.ffmpeg = new FFmpeg();
    state.ffmpeg.on('log', ({ message }) => {
      state.ffmpegLogs = [...state.ffmpegLogs.slice(-39), message];
    });
    state.ffmpeg.on('progress', ({ progress }) => {
      const start = state.videoPass === 1 ? 24 : 62;
      const range = state.videoPass === 1 ? 32 : 33;
      const message = state.videoPass === 1 ? 'Analizez videoclipul…' : 'Comprim videoclipul…';
      setStatus('processing', message, start + progress * range);
    });
  }

  if (!state.ffmpeg.loaded) {
    setStatus('processing', 'Pregătesc motorul video local (prima dată poate dura puțin)…', 6);
    const coreURL = new URL('/ffmpeg/ffmpeg-core.js', window.location.origin).toString();
    const wasmURL = new URL('/ffmpeg/ffmpeg-core.wasm', window.location.origin).toString();
    try {
      await withTimeout(
        state.ffmpeg.load({ coreURL, wasmURL }),
        45000,
        'Motorul video nu a putut fi încărcat pe acest dispozitiv. Reîncarcă pagina sau încearcă un browser mai recent.',
      );
    } catch (error) {
      state.ffmpeg.terminate();
      state.ffmpeg = null;
      throw error;
    }
  }
  return state.ffmpeg;
}

function videoErrorFromLogs(exitCode) {
  const logs = state.ffmpegLogs.join('\n');
  if (logs.includes("Unknown encoder 'libx264'")) {
    return 'Acest browser nu poate porni encoderul video local. Încearcă cea mai recentă versiune de Chrome, Edge sau Firefox.';
  }
  if (logs.includes('Invalid data found when processing input')) {
    return 'Videoclipul nu poate fi citit. Încearcă să exporți fișierul ca MP4 înainte de compresie.';
  }
  if (logs.includes('Conversion failed')) {
    return 'Conversia video nu a reușit. Încearcă un MP4 mai mic sau o țintă mai mare.';
  }
  return `Compresia video s-a oprit (cod FFmpeg ${exitCode}). Încearcă din nou cu un alt fișier.`;
}

async function runFfmpeg(ffmpeg, argumentsList) {
  const exitCode = await ffmpeg.exec(argumentsList);
  if (exitCode !== 0) throw new Error(videoErrorFromLogs(exitCode));
}

async function deleteFfmpegFiles(ffmpeg, fileNames) {
  await Promise.all(fileNames.map(async (fileName) => {
    try {
      await ffmpeg.deleteFile(fileName);
    } catch {
      // Some temporary ffmpeg files are not created for every input.
    }
  }));
}

async function encodeVideo(ffmpeg, inputName, outputName, passLog, settings) {
  state.videoPass = 1;
  setStatus('processing', 'Analizez videoclipul…', 24);
  await runFfmpeg(ffmpeg, [
    '-i', inputName,
    '-c:v', 'libx264',
    '-b:v', `${settings.videoKbps}k`,
    '-preset', 'veryfast',
    '-pass', '1',
    '-passlogfile', passLog,
    '-an',
    '-f', 'null',
    '-',
  ]);

  state.videoPass = 2;
  setStatus('processing', 'Comprim videoclipul…', 62);
  await runFfmpeg(ffmpeg, [
    '-i', inputName,
    '-c:v', 'libx264',
    '-b:v', `${settings.videoKbps}k`,
    '-maxrate', `${settings.videoKbps}k`,
    '-bufsize', `${settings.videoKbps * 2}k`,
    '-preset', 'veryfast',
    '-pass', '2',
    '-passlogfile', passLog,
    '-c:a', 'aac',
    '-b:a', `${settings.audioKbps}k`,
    '-movflags', '+faststart',
    outputName,
  ]);
}

async function compressVideo(file, targetBytes) {
  if (file.size <= targetBytes) {
    return { blob: file, name: file.name, alreadyFits: true };
  }

  setStatus('processing', 'Citesc informațiile videoclipului…', 2);
  const duration = await getVideoDuration(file);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('Nu am putut determina durata videoclipului.');
  }

  const ffmpeg = await ensureFfmpeg();
  const extension = getExtension(file.name) || 'mp4';
  const inputName = `input-${Date.now()}.${extension}`;
  const videoOutputName = `output-${Date.now()}.mp4`;
  const passLog = `framelio-pass-${Date.now()}`;
  let settings = getVideoSettings(duration, targetBytes);

  try {
    setStatus('processing', 'Pregătesc videoclipul în browser…', 18);
    state.ffmpegLogs = [];
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await encodeVideo(ffmpeg, inputName, videoOutputName, passLog, settings);
    let output = await ffmpeg.readFile(videoOutputName);

    if (output.length > targetBytes) {
      await deleteFfmpegFiles(ffmpeg, [videoOutputName, `${passLog}-0.log`, `${passLog}-0.log.mbtree`]);
      settings = { ...settings, videoKbps: Math.max(40, Math.floor(settings.videoKbps * (targetBytes / output.length) * 0.9)) };
      await encodeVideo(ffmpeg, inputName, videoOutputName, passLog, settings);
      output = await ffmpeg.readFile(videoOutputName);
    }

    if (output.length > targetBytes) {
      throw new Error('Nu am putut aduce videoclipul sub limita aleasă fără să îi reduc prea mult calitatea. Încearcă o țintă mai mare.');
    }

    return {
      blob: new Blob([output], { type: 'video/mp4' }),
      name: `${baseFileName(file.name)}-framelio.mp4`,
      alreadyFits: false,
    };
  } finally {
    await deleteFfmpegFiles(ffmpeg, [
      inputName,
      videoOutputName,
      `${passLog}-0.log`,
      `${passLog}-0.log.mbtree`,
    ]);
  }
}

function showResult(result) {
  clearResult();
  state.resultUrl = URL.createObjectURL(result.blob);
  elements.downloadLink.href = state.resultUrl;
  elements.downloadLink.download = result.name;
  elements.originalSize.textContent = formatBytes(state.file.size);
  elements.finalSize.textContent = formatBytes(result.blob.size);
  elements.resultSummary.textContent = result.alreadyFits
    ? 'Fișierul era deja în limita aleasă.'
    : result.blob.size <= state.selectedTarget
      ? `Încape în limita de ${formatBytes(state.selectedTarget)}.`
      : 'Am redus fișierul cât a permis browserul.';
  elements.resultCard.hidden = false;
  setStatus(
    result.blob.size <= state.selectedTarget ? 'success' : 'warning',
    result.blob.size <= state.selectedTarget ? 'Compresie finalizată.' : 'Fișierul este redus, dar nu a atins complet limita.',
    100,
  );
}

async function startCompression() {
  if (!state.file || state.isProcessing) return;

  const access = canUseCurrentPlan();
  if (!access.allowed) {
    setStatus('warning', access.reason);
    openUpgradeModal();
    return;
  }

  state.isProcessing = true;
  clearResult();
  updateActionAvailability();
  elements.compressButton.classList.add('is-processing');

  try {
    const result = state.mode === 'image'
      ? await compressImage(state.file, state.selectedTarget)
      : await compressVideo(state.file, state.selectedTarget);

    if (!state.isPro) {
      const usage = readDailyUsage();
      writeDailyUsage(usage.count + 1);
    }

    showResult(result);
  } catch (error) {
    console.error(error);
    setStatus('error', error instanceof Error ? error.message : 'A apărut o eroare în timpul procesării.');
  } finally {
    state.isProcessing = false;
    state.videoPass = 0;
    elements.compressButton.classList.remove('is-processing');
    updateActionAvailability();
  }
}

function bindUpgradeFlow() {
  elements.upgradeButton.addEventListener('click', () => openUpgradeModal());
  elements.closeUpgrade.addEventListener('click', () => closeUpgradeModal());
  elements.activatePro.addEventListener('click', () => {
    elements.activatePro.disabled = true;
    elements.activatePro.textContent = 'Preparing checkout…';
    startStripeCheckout().finally(() => {
      elements.activatePro.disabled = false;
      elements.activatePro.textContent = 'Continuă către checkout';
    });
  });
  elements.upgradeModal.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.closeUpgrade === 'true') {
      closeUpgradeModal();
    }
  });
}

function bindAuthFlow() {
  elements.accountButton.addEventListener('click', openAuthModal);
  elements.closeAuth.addEventListener('click', closeAuthModal);
  elements.authForm.addEventListener('submit', signIn);
  elements.signUp.addEventListener('click', signUp);
  elements.signOut.addEventListener('click', async () => {
    await supabase?.auth.signOut();
    state.isPro = false;
    updatePlanBadge();
    setAuthMessage('Ai ieșit din cont.', 'success');
    await refreshAccount();
  });
  elements.authModal.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.closeAuth === 'true') closeAuthModal();
  });
  supabase?.auth.onAuthStateChange(() => refreshAccount());
}

updatePlanBadge();

elements.modeTabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
elements.browseButton.addEventListener('click', (event) => {
  event.stopPropagation();
  elements.fileInput.click();
});
elements.dropZone.addEventListener('click', () => elements.fileInput.click());
elements.dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    elements.fileInput.click();
  }
});
elements.fileInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) selectFile(file);
});
['dragenter', 'dragover'].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (!state.isProcessing) elements.dropZone.classList.add('is-dragging');
  });
});
['dragleave', 'drop'].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove('is-dragging');
  });
});
elements.dropZone.addEventListener('drop', (event) => {
  const [file] = event.dataTransfer.files;
  if (file && !state.isProcessing) selectFile(file);
});
elements.removeFile.addEventListener('click', clearFile);
elements.compressButton.addEventListener('click', startCompression);
elements.startOver.addEventListener('click', clearFile);
bindUpgradeFlow();
bindAuthFlow();

setMode('image');
refreshAccount();
