const powerPointMediaType = "application/vnd.ms-powerpoint";
// The files the agent reads from the chat: images as they are, and
// documents (PDF, Word, Excel, PowerPoint, OpenDocument, RTF, EPUB, CSV and
// plain text) as their text, which the server reads once when the message
// arrives (readAgentChatDocumentText). Browsers name some of these types
// differently or not at all, so the extension decides a document's type.

const agentChatDocumentTypes: ReadonlyMap<string, string> = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [
    ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  [".docm", "application/vnd.ms-word.document.macroenabled.12"],
  [".xls", "application/vnd.ms-excel"],
  [
    ".xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  [".xlsm", "application/vnd.ms-excel.sheet.macroenabled.12"],
  [".xlsb", "application/vnd.ms-excel.sheet.binary.macroenabled.12"],
  [".ppt", powerPointMediaType],
  [
    ".pptx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  [".pptm", "application/vnd.ms-powerpoint.presentation.macroenabled.12"],
  [".pps", powerPointMediaType],
  [".pot", powerPointMediaType],
  [
    ".ppsx",
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  ],
  [".ppsm", "application/vnd.ms-powerpoint.slideshow.macroenabled.12"],
  [".odt", "application/vnd.oasis.opendocument.text"],
  [".ods", "application/vnd.oasis.opendocument.spreadsheet"],
  [".odp", "application/vnd.oasis.opendocument.presentation"],
  [".rtf", "application/rtf"],
  [".epub", "application/epub+zip"],
  [".csv", "text/csv"],
  [".txt", "text/plain"],
  [".md", "text/markdown"],
]);

const agentChatDocumentMediaTypes = new Set(agentChatDocumentTypes.values());

/**
 * Whether the agent reads files of this type as documents (their text).
 *
 * @param mediaType - The file's media type.
 * @returns Whether it is a document type.
 */
export const isAgentChatDocumentType = (mediaType: string) =>
  agentChatDocumentMediaTypes.has(mediaType);

/**
 * The type the agent reads a file as, or null for a file it cannot read.
 *
 * @param file - The file's name and type.
 * @returns The media type, or null.
 */
export const agentChatFileMediaType = (file: {
  name: string;
  type: string;
}) => {
  if (file.type.startsWith("image/")) {
    return file.type;
  }

  const dot = file.name.lastIndexOf(".");

  return dot === -1
    ? null
    : (agentChatDocumentTypes.get(file.name.slice(dot).toLowerCase()) ?? null);
};

// The file picker's accept list.
export const agentChatAcceptedFiles = [
  "image/*",
  ...agentChatDocumentTypes.keys(),
].join(",");
