'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Heart, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createCommentAction, deleteCommentAction, likeCommentAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  parent_comment_id?: string;
  user: {
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
  likeCount: number;
  replies?: Comment[];
}

interface CommentSectionProps {
  comments: Comment[];
  reviewId: string;
  currentUserId: string | null;
}

export function CommentSection({ comments, reviewId, currentUserId }: CommentSectionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [displayComments, setDisplayComments] = useState<Comment[]>(comments);
  const router = useRouter();

  // Sync displayComments when comments prop changes
  useEffect(() => {
    console.log('📥 CommentSection received comments:', comments);
    setDisplayComments(comments);
  }, [comments]);

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    
    const result = await createCommentAction(reviewId, replyText, commentId);
    if (result.success) {
      setReplyText('');
      setReplyingTo(null);
      router.refresh();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Delete this comment?')) {
      const result = await deleteCommentAction(commentId);
      if (result.success) {
        router.refresh();
      }
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const result = await likeCommentAction(commentId);
    if (result.success) {
      if (result.liked) {
        setLikedComments(prev => new Set([...prev, commentId]));
        // Update comment like count
        updateCommentLikeCount(commentId, 1);
      } else {
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        // Update comment like count
        updateCommentLikeCount(commentId, -1);
      }
    }
  };

  const updateCommentLikeCount = (commentId: string, delta: number) => {
    setDisplayComments(prevComments =>
      prevComments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, likeCount: Math.max(0, (comment.likeCount || 0) + delta) };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId
                ? { ...reply, likeCount: Math.max(0, (reply.likeCount || 0) + delta) }
                : reply
            ),
          };
        }
        return comment;
      })
    );
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {displayComments.map((comment) => (
        <div key={comment.id}>
          {/* Parent Comment */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/profile/${comment.user?.username}`} className="flex items-center gap-2 hover:opacity-80">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.profile_picture_url} />
                  <AvatarFallback>{comment.user?.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{comment.user?.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{comment.user?.username}</p>
                </div>
              </Link>

              {currentUserId === comment.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            <p className="text-sm text-foreground">{comment.text}</p>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleLikeComment(comment.id)}
                className={likedComments.has(comment.id) ? 'text-red-500' : ''}
              >
                <Heart 
                  className={`h-4 w-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`}
                />
                <span className="ml-1 text-xs">{comment.likeCount || 0}</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-4 w-4" />
                <span className="ml-1 text-xs">Reply</span>
              </Button>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full min-h-[80px] p-2 text-sm border rounded-md bg-background"
                />
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyText.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-4 mt-2 space-y-2">
              {expandedReplies.has(comment.id) ? (
                <>
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-muted/10 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/profile/${reply.user?.username}`} className="flex items-center gap-2 hover:opacity-80">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={reply.user?.profile_picture_url} />
                            <AvatarFallback>{reply.user?.display_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-xs">{reply.user?.display_name}</p>
                            <p className="text-xs text-muted-foreground">@{reply.user?.username}</p>
                          </div>
                        </Link>

                        {currentUserId === reply.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(reply.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-foreground">{reply.text}</p>

                      <div className="flex gap-2 pt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => handleLikeComment(reply.id)}
                          style={likedComments.has(reply.id) ? { color: 'rgb(239, 68, 68)' } : {}}
                        >
                          <Heart 
                            className={`h-3 w-3 ${likedComments.has(reply.id) ? 'fill-current' : ''}`}
                          />
                          <span className="ml-1">{reply.likeCount || 0}</span>
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                        >
                          <Reply className="h-3 w-3" />
                          <span className="ml-1">Reply</span>
                        </Button>
                      </div>

                      {/* Reply to Reply Input */}
                      {replyingTo === reply.id && (
                        <div className="mt-2 pt-2 border-t space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full min-h-[60px] p-2 text-xs border rounded-md bg-background"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyText.trim()}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReplies(comment.id)}
                    className="text-xs"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Hide replies
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleReplies(comment.id)}
                  className="text-xs"
                >
                  <ChevronDown className="h-3 w-3" />
                  Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
