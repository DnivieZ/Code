import React, { useState, useRef } from "react";
import { Video, UserStats, Achievement } from "@/entities/all";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Video as VideoIcon, Sparkles, Crown, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [willGoViral, setWillGoViral] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setVideoPreview(previewUrl);
    }
  };

  const checkIfWillGoViral = async () => {
    try {
      const user = await User.me();
      let userStats = await UserStats.filter({ created_by: user.email });
      
      if (userStats.length === 0) {
        // Create initial stats
        await UserStats.create({
          videos_posted: 0,
          total_views: 0,
          total_likes: 0,
          viral_videos: 0,
          achievements_unlocked: 0,
          level: 1
        });
        return false;
      }

      const stats = userStats[0];
      const nextPostNumber = (stats.videos_posted || 0) + 1;
      
      // Every 10th video goes viral
      return nextPostNumber % 10 === 0;
    } catch (error) {
      return false;
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const user = await User.me();
      
      // Check if this will be a viral video
      const viral = await checkIfWillGoViral();
      setWillGoViral(viral);
      
      setUploadProgress(30);

      // Upload the file
      const { file_url } = await UploadFile({ file });
      setUploadProgress(70);

      // Get user stats
      let userStats = await UserStats.filter({ created_by: user.email });
      let stats = userStats.length > 0 ? userStats[0] : null;
      
      if (!stats) {
        stats = await UserStats.create({
          videos_posted: 0,
          total_views: 0,
          total_likes: 0,
          viral_videos: 0,
          achievements_unlocked: 0,
          level: 1
        });
      }

      const postNumber = (stats.videos_posted || 0) + 1;
      
      // Create the video
      const videoData = {
        title: title.trim(),
        description: description.trim(),
        video_url: file_url,
        views: viral ? 1000 : Math.floor(Math.random() * 50) + 10, // Viral videos start with more views
        likes: viral ? 50 : Math.floor(Math.random() * 10),
        is_viral: viral,
        post_number: postNumber,
        hashtags: hashtags.split(' ').filter(tag => tag.startsWith('#')).map(tag => tag.slice(1))
      };

      await Video.create(videoData);
      setUploadProgress(90);

      // Update user stats
      await UserStats.update(stats.id, {
        videos_posted: postNumber,
        viral_videos: viral ? (stats.viral_videos || 0) + 1 : stats.viral_videos,
        level: Math.floor(postNumber / 5) + 1
      });

      // Check and unlock achievements
      await checkAndUnlockAchievements(postNumber, viral);

      setUploadProgress(100);
      setShowSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setFile(null);
        setTitle("");
        setDescription("");
        setHashtags("");
        setVideoPreview(null);
        setShowSuccess(false);
        setWillGoViral(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 3000);

    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const checkAndUnlockAchievements = async (postNumber, isViral) => {
    const achievementsToCheck = [
      { name: "First Video", requirement: 1, category: "posting" },
      { name: "Getting Started", requirement: 5, category: "posting" },
      { name: "Content Creator", requirement: 10, category: "posting" },
      { name: "Influencer", requirement: 25, category: "posting" },
      { name: "Viral Sensation", requirement: 1, category: "viral" }
    ];

    for (const achievement of achievementsToCheck) {
      if (
        (achievement.category === "posting" && postNumber >= achievement.requirement) ||
        (achievement.category === "viral" && isViral)
      ) {
        // Check if already unlocked
        const existing = await Achievement.filter({ 
          name: achievement.name, 
          created_by: (await User.me()).email 
        });
        
        if (existing.length === 0) {
          await Achievement.create({
            ...achievement,
            icon: achievement.category === "viral" ? "flame" : "star",
            description: `Unlocked for ${achievement.category === "viral" ? "posting a viral video" : `posting ${achievement.requirement} videos`}`,
            unlocked: true,
            unlocked_date: new Date().toISOString().split('T')[0]
          });
        }
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto hide-scrollbar p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text mb-2">Create Your Video</h1>
          <p className="text-gray-400">Share your moment with the world</p>
        </div>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                {willGoViral ? (
                  <Flame className="w-10 h-10 text-white" />
                ) : (
                  <Sparkles className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {willGoViral ? "🔥 VIRAL VIDEO POSTED!" : "✨ Video Posted!"}
              </h2>
              <p className="text-gray-400">
                {willGoViral ? "This is your viral moment!" : "Your video is now live"}
              </p>
              {willGoViral && (
                <div className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 inline-block">
                  <span className="text-purple-400 font-medium">Every 10th video goes viral! 🚀</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* File Upload Area */}
              <div className="gradient-border">
                <div className="gradient-border-inner p-6">
                  {!videoPreview ? (
                    <div
                      className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">Tap to select video</p>
                      <p className="text-sm text-gray-500">MP4, MOV, AVI up to 100MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <video
                        src={videoPreview}
                        className="w-full h-64 object-cover rounded-lg"
                        controls
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setVideoPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-black/50 border-gray-600"
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Details */}
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="What's your video about?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {title.length}/100
                  </div>
                </div>

                <div>
                  <Textarea
                    placeholder="Tell your story... (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-24 resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {description.length}/500
                  </div>
                </div>

                <Input
                  placeholder="#hashtags #optional"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || !title.trim() || isUploading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Uploading {uploadProgress}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    <span>Post Video</span>
                  </div>
                )}
              </Button>

              {/* Pro Tip */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-500">Pro Tip</span>
                </div>
                <p className="text-xs text-gray-400">
                  Every 10th video you post automatically goes viral with boosted views and engagement! 🚀
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
