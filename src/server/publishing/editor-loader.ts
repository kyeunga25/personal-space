import type { MediaRecord, PostRecord, PostRevision } from "./domain";
import type { RevisionPage, RevisionPageCursor } from "./revision-pagination";

export interface StudioPostReader {
  findMedia(id: string, owner?: boolean): Promise<MediaRecord | null>;
  findOwnerPost(id: string): Promise<PostRecord | null>;
  listRevisionPage(
    postId: string,
    cursor: RevisionPageCursor | null,
  ): Promise<RevisionPage>;
}

export interface StudioPostEditorState {
  media: MediaRecord | null;
  nextRevisionCursor: RevisionPageCursor | null;
  post: PostRecord;
  revisions: PostRevision[];
}

export async function loadStudioPostEditor(
  reader: StudioPostReader,
  id: string,
  revisionCursor: RevisionPageCursor | null = null,
): Promise<StudioPostEditorState | null> {
  if (!id) return null;

  const post = await reader.findOwnerPost(id);
  if (!post) return null;

  const [revisionPage, media] = await Promise.all([
    reader.listRevisionPage(post.id, revisionCursor),
    post.heroMediaId
      ? reader.findMedia(post.heroMediaId, true)
      : Promise.resolve(null),
  ]);
  return {
    media,
    nextRevisionCursor: revisionPage.nextCursor,
    post,
    revisions: revisionPage.revisions,
  };
}
