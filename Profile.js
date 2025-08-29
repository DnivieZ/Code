import React, { useState, useEffect } from "react";
import { Video, UserStats } from "@/entities/all";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Crown, Play, Heart, Eye, TrendingUp, Calendar, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load user stats
      const userStats = await UserStats.filter({ created_by: currentUser.email });
      if (userStats.length > 0) {
        setStats(userStats[0]);
      } else {
        // Create initial stats if none exist
        const newStats = await UserStats.create({
          videos_posted: 0,
          total_views: 0,
          total_likes: 0,
          viral_videos: 0,
          achievements_unlocked: 0,
          level: 1
        });
        setStats(newStats);
      }

      // Load user's videos
      const videos = await Video.filter({ created_by: currentUser.email }, '-created_date');
      setUserVideos(videos);

    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getNextViralVideo = () => {
    const videosPosted = stats?.videos_posted || 0;
    const nextMilestone = Math.ceil((videosPosted + 1) / 10) * 10;
    return nextMilestone - videosPosted;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Join ViralStream</h2>
          <p className="text-gray-400 mb-6">Create your account to start posting videos</p>
          <Button
            onClick={() => User.login()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto hide-scrollbar">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-purple-900 to-pink-900"></div>
        
        <div className="absolute inset-x-0 -bottom-12 flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center border-4 border-black"
          >
            <span className="text-2xl font-bold text-white">
              {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </span>
          </motion.div>
        </div>
      </div>

      <div className="pt-16 px-4">
        {/* User Info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {user.full_name || "ViralStreamer"}
          </h1>
          <p className="text-gray-400 mb-2">@{user.email?.split('@')[0]}</p>
          
          {stats && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <span className="text-purple-400 font-medium">Level {stats.level}</span>
              </div>
              {stats.viral_videos > 0 && (
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                  <span className="text-orange-400 font-medium">{stats.viral_videos}x Viral</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="gradient-border"
            >
              <div className="gradient-border-inner p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Play className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.videos_posted || 0}</span>
                </div>
                <p className="text-gray-400 text-sm">Videos Posted</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="gradient-border"
            >
              <div className="gradient-border-inner p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Eye className="w-5 h-5 text-pink-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.total_views || 0}</span>
                </div>
                <p className="text-gray-400 text-sm">Total Views</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="gradient-border"
            >
              <div className="gradient-border-inner p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Heart className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.total_likes || 0}</span>
                </div>
                <p className="text-gray-400 text-sm">Total Likes</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="gradient-border"
            >
              <div className="gradient-border-inner p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.viral_videos || 0}</span>
                </div>
                <p className="text-gray-400 text-sm">Viral Videos</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Next Viral Counter */}
        {stats && (
          <div className="mb-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">Next Viral Video</span>
            </div>
            <p className="text-white text-sm">
              {getNextViralVideo()} more videos until your next viral moment! 🔥
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                style={{
                  width: `${((stats.videos_posted % 10) / 10) * 100}%`
                }}
              ></div>
            </div>
          </div>
        )}

        {/* My Videos Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">My Videos</h2>
          {userVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {userVideos.map((video) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800"
                >
                  {video.video_url ? (
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-50" />
                    </div>
                  )}
                  
                  {video.is_viral && (
                    <div className="absolute top-1 right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex items-center gap-2 text-xs text-white">
                      <Eye className="w-3 h-3" />
                      <span>{video.views || 0}</span>
                      <Heart className="w-3 h-3 ml-1" />
                      <span>{video.likes || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No videos yet</p>
              <Button
                onClick={() => window.location.href = '/Upload'}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                Post Your First Video
              </Button>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="space-y-3 mb-20">
          <Button
            variant="outline"
            className="w-full justify-start border-gray-700 text-gray-300 hover:text-white"
            onClick={() => {/* TODO: Settings */ }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start border-red-700 text-red-400 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
