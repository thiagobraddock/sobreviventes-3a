import { promises as fs } from "node:fs";
import path from "node:path";

const PUBLIC_UPLOAD_PREFIX = "/uploads";
const DEFAULT_UPLOAD_DIR = path.resolve(process.cwd(), ".data", "uploads");

function ensureInsideUploadRoot(absolutePath: string) {
  const uploadRoot = getUploadRoot();

  if (
    absolutePath !== uploadRoot &&
    !absolutePath.startsWith(`${uploadRoot}${path.sep}`)
  ) {
    throw new Error("Caminho de upload invalido.");
  }
}

export function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR);
}

export function buildPublicUploadPath(...segments: string[]) {
  return `${PUBLIC_UPLOAD_PREFIX}/${segments
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export function resolveUploadPath(...segments: string[]) {
  const absolutePath = path.resolve(getUploadRoot(), ...segments);
  ensureInsideUploadRoot(absolutePath);
  return absolutePath;
}

export function getUploadSegmentsFromPublicPath(publicPath: string) {
  if (!publicPath.startsWith(`${PUBLIC_UPLOAD_PREFIX}/`)) {
    return null;
  }

  const relativePath = publicPath.slice(PUBLIC_UPLOAD_PREFIX.length + 1);

  if (!relativePath) {
    return null;
  }

  return relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
}

export async function writeUploadFile(segments: string[], contents: Buffer) {
  const absolutePath = resolveUploadPath(...segments);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents);

  return {
    absolutePath,
    publicPath: buildPublicUploadPath(...segments),
  };
}

export async function readUploadFile(segments: string[]) {
  const absolutePath = resolveUploadPath(...segments);
  return fs.readFile(absolutePath);
}

export async function deleteUploadByPublicPath(publicPath: string) {
  const segments = getUploadSegmentsFromPublicPath(publicPath);

  if (!segments) {
    return;
  }

  const absolutePath = resolveUploadPath(...segments);
  await fs.rm(absolutePath, { force: true });
}

export function getContentType(fileName: string) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
