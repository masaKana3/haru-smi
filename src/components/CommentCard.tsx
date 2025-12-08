import React from "react";

type CommentModel = {
  id: string;
  postId: string;
  text: string;
  createdAt: string;
  likes: number;
};

type Props = {
  comment: CommentModel;
  onLike?: () => void;
  liked?: boolean;
};

export default function CommentCard({ comment, onLike, liked }: Props) {
  return (
    <div className="w-full bg-brandBg rounded-card px-3 py-2 space-y-1">
      <div className="text-sm font-semibold text-brandText">ユーザー</div>
      <div className="text-sm text-brandText whitespace-pre-line leading-relaxed">
        {comment.text}
      </div>
      <div className="flex items-center justify-between text-xs text-brandMuted">
        <span>{new Date(comment.createdAt).toLocaleString()}</span>
        <button
          onClick={onLike}
          className="text-xs text-brandAccent hover:opacity-80 transition-opacity"
        >
          👍 {comment.likes} {liked ? "★" : ""}
        </button>
      </div>
    </div>
  );
}
