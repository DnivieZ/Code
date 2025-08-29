import React, { useState, useEffect, useRef, useCallback } from "react";
import { Video, Like, Comment, User, Conversation } from "@/entities/all";
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, Send, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommentItem from "../components/comments/CommentItem"; // New import

function CommentSheet({ video, isOpen, onOpenChange, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const loadComments = useCallback(async () => {
    if (video?.id) {
      // Fetch all comments related to the video, including replies
      const fetchedComments = await Comment.filter({ video_id: video.id }, "-created_date");
      setComments(fetchedComments);
    }
  }, [video?.id]);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, loadComments]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsPosting(true);
    try {
      await Comment.create({ video_id: video.id, content: newComment });
      setNewComment("");
      await loadComments();
      // Update the comment count on the video object itself
      // Note: In a real app, this might trigger a parent component re-render or state update
      if (video?.id) {
        await Video.update(video.id, { comment_count: (video.comment_count || 0) + 1 });
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleReply = async (parentCommentId, replyContent) => {
    if (!user || !replyContent.trim()) return;
    try {
      await Comment.create({ 
        video_id: video.id, 
        content: replyContent,
        reply_to: parentCommentId 
      });
      await loadComments(); // Reload all comments to show the new reply
      if (video?.id) {
        await Video.update(video.id, { comment_count: (video.comment_count || 0) + 1 });
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    }
  };

  // Get only top-level comments (no reply_to field)
  const topLevelComments = comments.filter(comment => !comment.reply_to);
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-gray-900 text-white border-t-gray-800 h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-white">Comments ({video?.comment_count || 0})</SheetTitle>
        </SheetHeader>
        {/* This div acts as the main content area, managing its own scrollable comments and fixed input */}
        <div className="flex-1 flex flex-col pt-4">
          {/* Scrollable comments area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-4">
            {topLevelComments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={comments} // Pass all comments to allow CommentItem to find its children
                onReply={handleReply}
                user={user}
                level={0} // Initial level for top-level comments
              />
            ))}
            
            {topLevelComments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            )}
          </div>
          
          {user && (
            <div className="py-4 border-t border-gray-800 flex items-center gap-2">
              <Input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePostComment()} // Allows pressing Enter to post
                placeholder="Add a comment..." 
                className="bg-gray-800 border-gray-700 text-white flex-grow"
              />
              <Button 
                onClick={handlePostComment} 
                disabled={isPosting || !newComment.trim()} 
                size="icon" 
                className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ videos: [], users: [] });
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length > 2) {
      const handleSearch = setTimeout(async () => {
        const videoResults = await Video.filter({ title: { $regex: query, $options: 'i' } });
        const userResults = await User.filter({ full_name: { $regex: query, $options: 'i' } });
        setResults({ videos: videoResults, users: userResults });
      }, 500);
      return () => clearTimeout(handleSearch);
    } else {
      setResults({ videos: [], users: [] });
    }
  }, [query]);

  const handleVideoClick = (videoId) => {
    // This is a simplified approach. In a real app, you might want to navigate to a specific video page
    // or jump to that video in the feed. For this context, we'll just close search.
    onClose();
    // Potentially navigate or update currentVideoIndex in parent if feasible
  };

  const handleUserClick = (userId) => {
    navigate(createPageUrl(`Profile?userId=${userId}`));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 p-4 pt-20 overflow-auto"
          onClick={onClose}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Input 
              placeholder="Search for videos or users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-gray-800 border-purple-500 text-white text-lg"
              autoFocus
            />
            <div className="mt-6">
              {results.videos.length > 0 && <div className="mb-6">
                <h3 className="text-purple-400 font-bold mb-2">Videos</h3>
                <div className="space-y-2">
                  {results.videos.map(v => (
                    <button key={v.id} onClick={() => handleVideoClick(v.id)} className="text-white text-left block w-full py-2 px-3 rounded-md hover:bg-gray-700 transition-colors">
                      {v.title}
                      <span className="text-gray-400 text-sm ml-2">@{v.created_by?.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>}
              {results.users.length > 0 && <div>
                <h3 className="text-pink-400 font-bold mb-2">Users</h3>
                <div className="space-y-2">
                  {results.users.map(u => (
                    <button key={u.id} onClick={() => handleUserClick(u.id)} className="text-white text-left block w-full py-2 px-3 rounded-md hover:bg-gray-700 transition-colors">
                      {u.full_name} <span className="text-gray-400 text-sm">@{u.email?.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>}
              {query.length > 2 && results.videos.length === 0 && results.users.length === 0 && (
                <p className="text-gray-400 text-center mt-8">No results found.</p>
              )}
              {query.length <= 2 && (
                <p className="text-gray-400 text-center mt-8">Type at least 3 characters to search.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState(new Map()); // Map<videoId, likeId>
  const [showComments, setShowComments] = useState(false);
  const [activeVideoForComment, setActiveVideoForComment] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Autoplay logic when currentVideoIndex changes
    if (videoRef.current) {
      if (currentVideoIndex === videos.findIndex(v => v.id === activeVideoForComment?.id)) {
        // Don't autoplay if comments are open for this video
        setIsPlaying(false);
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.log("Autoplay prevented:", error);
          setIsPlaying(false); // Set to false if autoplay fails (e.g., due to browser policies)
        });
        setIsPlaying(true);
      }
    }
  }, [currentVideoIndex, videos, activeVideoForComment]);

  const loadData = async () => {
    const fetchedVideos = await Video.list('-created_date', 50);
    setVideos(fetchedVideos);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (fetchedVideos.length > 0) {
        const videoIds = fetchedVideos.map(v => v.id);
        const userLikes = await Like.filter({ video_id: { $in: videoIds }, created_by: currentUser.email });
        const likedMap = new Map();
        userLikes.forEach(like => likedMap.set(like.video_id, like.id));
        setLikedVideos(likedMap);
      }
    } catch (error) {
      console.log("User not logged in");
    }
  };

  const handleLike = async (video) => {
    if (!user) {
      User.login(); // Redirects to login page
      return;
    }
    const isLiked = likedVideos.has(video.id);
    const newLikedVideos = new Map(likedVideos);

    // Optimistically update UI
    setVideos(prev => prev.map(v => 
      v.id === video.id ? {...v, likes: isLiked ? (v.likes || 1) - 1 : (v.likes || 0) + 1} : v
    ));

    if (isLiked) {
      const likeId = likedVideos.get(video.id);
      await Like.delete(likeId);
      newLikedVideos.delete(video.id);
    } else {
      const newLike = await Like.create({ video_id: video.id });
      newLikedVideos.set(video.id, newLike.id);
    }
    setLikedVideos(newLikedVideos);
  };
  
  const handleStartChat = async (creatorEmail) => {
    if (!user) {
      User.login();
      return;
    }
    if (user.email === creatorEmail) return;

    try {
      const existing = await Conversation.filter({ participants: { $all: [user.email, creatorEmail] }});
      if (existing.length > 0) {
        navigate(createPageUrl(`Chat?convId=${existing[0].id}`));
      } else {
        const otherUser = await User.filter({ email: creatorEmail });
        if (otherUser.length === 0) {
          console.error("Creator user not found for chat.");
          return;
        }
        const newConv = await Conversation.create({
          participants: [user.email, creatorEmail],
          participant_details: [
            { email: user.email, full_name: user.full_name },
            { email: otherUser[0].email, full_name: otherUser[0].full_name },
          ],
        });
        navigate(createPageUrl(`Chat?convId=${newConv.id}`));
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
      // Optionally show a user-friendly error message
    }
  };
  
  const handleOpenComments = (video) => {
    setActiveVideoForComment(video);
    setShowComments(true);
    // Pause video when comments open
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const videoHeight = window.innerHeight - 136; // Account for header/nav
    const newIndex = Math.round(scrollTop / videoHeight);
    
    if (newIndex !== currentVideoIndex && newIndex < videos.length) {
      setCurrentVideoIndex(newIndex);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // When sheet closes, potentially resume play based on Feed's isPlaying state
  const handleCommentSheetOpenChange = (open) => {
    setShowComments(open);
    if (!open && videoRef.current && isPlaying) {
      videoRef.current.play().catch(e => console.log("Play on close failed:", e));
    }
  };

  if (videos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading amazing videos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-[60]">
        <Button size="icon" className="rounded-full bg-white/10 backdrop-blur-sm" onClick={() => setShowSearch(true)}>
          <Search className="w-5 h-5 text-white" />
        </Button>
      </div>
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      {/* Retain handleCommentSheetOpenChange to manage video playback state on sheet close */}
      <CommentSheet video={activeVideoForComment} isOpen={showComments} onOpenChange={handleCommentSheetOpenChange} user={user} />
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        onScroll={handleScroll}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="relative w-full snap-start snap-always"
            style={{ height: 'calc(100vh - 136px)' }}
          >
            {/* Video Background */}
            <div className="absolute inset-0 bg-gray-900">
              {video.video_url ? (
                <video
                  ref={index === currentVideoIndex ? videoRef : null}
                  className="w-full h-full object-cover"
                  src={video.video_url}
                  loop
                  muted={isMuted}
                  autoPlay={index === currentVideoIndex && isPlaying} // Keep isPlaying check for correct behavior
                  onClick={togglePlayPause}
                  playsInline // Important for iOS autoplay
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                  <Play className="w-24 h-24 text-white opacity-50" />
                </div>
              )}
            </div>

            {/* Video Controls Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>

            {/* Video Info Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              {/* Right Side Actions */}
              <div className="absolute right-4 bottom-20 flex flex-col gap-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLike(video)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${likedVideos.has(video.id) ? 'bg-pink-500' : 'bg-white/10 backdrop-blur-sm'}`}>
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">
                    {video.likes || 0}
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleOpenComments(video)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">{video.comment_count || 0}</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    {isMuted ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-4 left-4 right-20">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {video.created_by?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      @{video.created_by?.split('@')[0] || 'user'}
                    </span>
                    {user && user.email !== video.created_by && (
                      <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => handleStartChat(video.created_by)}>
                        <Send className="w-4 h-4 text-gray-300" />
                      </Button>
                    )}
                    {video.is_viral && (
                      <div className="px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold">
                        VIRAL 🔥
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-white font-semibold text-lg mb-2">
                  {video.title}
                </h3>
                
                {video.description && (
                  <p className="text-gray-200 text-sm mb-2 line-clamp-2">
                    {video.description}
                  </p>
                )}

                {video.hashtags && video.hashtags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {video.hashtags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-purple-400 text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-300">
                  <span>{video.views || 0} views</span>
                  <span>{video.created_date && new Date(video.created_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
