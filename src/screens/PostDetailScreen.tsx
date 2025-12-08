import React, { useEffect, useMemo, useRef, useState } from "react";
import CommentCard from "../components/CommentCard";
import { getPostById, likePost } from "../logic/communityLogic";
import { Post } from "../types/community";

type Props = {
  postId: string;
  onBack: () => void;
};

type LocalComment = {
  id: string;
  postId: string;
  text: string;
  createdAt: string;
  likes: number;
};

const COMMENT_KEY = "haru_comments";

function loadAllComments(): LocalComment[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMMENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalComment[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAllComments(list: LocalComment[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(COMMENT_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export default function PostDetailScreen({ postId, onBack }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const load = () => setPost(getPostById(postId));

  const comments = useMemo(
    () =>
      loadAllComments()
        .filter((c) => c.postId === postId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [postId, comment, likedComments]
  );

  useEffect(() => {
    load();
  }, [postId]);

  if (!post) {
    return (
      <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
        <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm space-y-4">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            ← コミュニティ
          </button>
          <div className="text-sm text-brandMuted">投稿が見つかりませんでした。</div>
        </div>
      </div>
    );
  }

  const handleAddComment = () => {
    const text = comment.trim();
    if (!text) return;
    const list = loadAllComments();
    const newComment: LocalComment = {
      id: `c_${Math.random().toString(36).slice(2, 9)}`,
      postId,
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    saveAllComments([newComment, ...list]);
    setComment("");
    setLikedComments((prev) => ({ ...prev }));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleLikePost = () => {
    likePost(post.id);
    load();
  };

  const handleLikeComment = (id: string) => {
    const list = loadAllComments();
    const target = list.find((c) => c.id === id);
    if (!target) return;
    target.likes += 1;
    saveAllComments(list);
    setLikedComments((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            ← コミュニティ
          </button>
          <div className="text-md font-semibold">
            {post.title || (post.type === "diary" ? "日記" : "投稿")}
          </div>
          <div className="w-10" />
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-brandMuted">
            <span>{post.type === "diary" ? "日記" : "テーマ投稿"}</span>
            <span className="px-2 py-[2px] bg-brandAccentAlt/20 rounded-full text-[11px]">
              {post.visibility === "public" ? "公開" : "非公開"}
            </span>
          </div>
          <div className="text-base font-semibold text-brandText">
            {post.title || "タイトルなし"}
          </div>
          <div className="text-sm text-brandText leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
          <div className="flex items-center justify-between text-xs text-brandMuted">
            <span>{new Date(post.createdAt).toLocaleString()}</span>
            <button
              onClick={handleLikePost}
              className="text-xs text-brandAccent hover:opacity-80 transition-opacity"
            >
              👍 {post.likes}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-3">
          <div className="text-sm font-semibold">コメント</div>

          <div className="flex items-start gap-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border border-brandAccentAlt rounded-card px-3 py-2 text-sm min-h-[80px]"
              placeholder="コメントを入力"
              ref={inputRef}
            />
            <button
              onClick={handleAddComment}
              className="text-xs px-3 py-2 bg-brandAccent text-white rounded-button"
            >
              送信
            </button>
          </div>

          <div className="space-y-2">
            {comments.map((cmt) => (
              <CommentCard
                key={cmt.id}
                comment={cmt}
                onLike={() => handleLikeComment(cmt.id)}
                liked={likedComments[cmt.id]}
              />
            ))}
            {comments.length === 0 && (
              <div className="text-xs text-brandMuted">まだコメントがありません。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
