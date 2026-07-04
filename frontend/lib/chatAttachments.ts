import api from './api';

export interface ChatAttachment {
  url: string;
  type: 'image' | 'video' | 'raw';
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

// Executable formats have no legitimate place in a brief/reference-file exchange.
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.apk', '.scr', '.com'];

const resourceTypeFor = (file: File): ChatAttachment['type'] => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'raw';
};

export function validateChatFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  if (BLOCKED_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
    return `"${file.name}" can't be shared — that file type isn't allowed.`;
  }
  const type = resourceTypeFor(file);
  if (type === 'image' && file.size > MAX_IMAGE_SIZE) return 'Images must be under 10 MB.';
  if (type === 'video' && file.size > MAX_VIDEO_SIZE) return 'Videos must be under 100 MB.';
  if (type === 'raw' && file.size > MAX_FILE_SIZE) return 'Files must be under 25 MB.';
  return null;
}

// Uploads directly to Cloudinary using the same signed, unsigned-from-browser
// pattern as profile pictures / portfolio items, then returns attachment
// metadata to attach to a chat message.
export async function uploadChatAttachment(file: File, dealId: string): Promise<ChatAttachment> {
  const type = resourceTypeFor(file);

  const sigRes = await api.get(`/api/upload/signature?context=chat-attachment&dealId=${dealId}`);
  const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', signature);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', apiKey);
  formData.append('folder', folder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await uploadRes.json();
  if (data.error) throw new Error(data.error.message);

  const thumbnailUrl = type === 'video'
    ? data.secure_url.replace('/upload/', '/upload/so_0/').replace(/\.[^/.]+$/, '.jpg')
    : undefined;

  return {
    url: data.secure_url,
    type,
    thumbnailUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Routes every attachment download (image/video/raw) through our own backend
// so we can force a real download (Content-Disposition: attachment) with the
// original file name — a plain Cloudinary URL just opens inline in the
// browser (image viewer / PDF viewer / video player) instead of saving.
export function downloadUrlFor(attachment: ChatAttachment): string {
  const base = api.defaults.baseURL || '';
  const params = new URLSearchParams({ url: attachment.url, filename: attachment.fileName || 'file' });
  return `${base}/api/messages/download?${params.toString()}`;
}
