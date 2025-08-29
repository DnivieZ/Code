
import React, { useState, useEffect, useCallback } from "react";
import { Conversation, UserStats, User } from "@/entities/all";
import { Trophy, Crown, Medal, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function FriendsLeaderboard({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    if (!user) return; // Ensure user is available before proceeding
    
    try {
      // Get all conversations (friends)
      const conversations = await Conversation.filter({ participants: user.email });
      
      // Get unique friend emails
      const friendEmails = new Set();
      conversations.forEach(conv => {
        conv.participants.forEach(email => {
          if (email !== user.email) {
            friendEmails.add(email);
          }
        });
      });

      // Get user stats for each friend
      const friendsStats = [];
      for (const email of friendEmails) {
        try {
          const userStats = await UserStats.filter({ created_by: email });
          const userData = await User.filter({ email });
          
          if (userStats.length > 0 && userData.length > 0) {
            friendsStats.push({
              email,
              name: userData[0].full_name || userData[0].email.split('@')[0],
              level: userStats[0].level || 1,
              videos_posted: userStats[0].videos_posted || 0,
              viral_videos: userStats[0].viral_videos || 0,
              total_views: userStats[0].total_views || 0
            });
          }
        } catch (error) {
          // Skip if user stats not found
        }
      }

      // Sort by level (descending), then by videos posted
      friendsStats.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.videos_posted - a.videos_posted;
      });

      setLeaderboard(friendsStats);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Add user to useCallback's dependency array

  useEffect(() => {
    // loadLeaderboard is now a stable function reference,
    // and its internal logic correctly depends on `user`.
    loadLeaderboard();
  }, [loadLeaderboard]); // Depend on the memoized loadLeaderboard function

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Trophy className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRankColors = (index) => {
    switch (index) {
      case 0: return "from-yellow-500/20 to-orange-500/20 border-yellow-500/30";
      case 1: return "from-gray-400/20 to-gray-600/20 border-gray-400/30";
      case 2: return "from-amber-600/20 to-amber-800/20 border-amber-600/30";
      default: return "from-purple-500/10 to-pink-500/10 border-gray-600/30";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Friends Leaderboard</h3>
        </div>
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold">Friends Leaderboard</h3>
      </div>
      
      {leaderboard.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No friends to compare yet</p>
          <p className="text-xs">Start chatting to build your network!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {leaderboard.slice(0, 10).map((friend, index) => (
            <motion.div
              key={friend.email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r ${getRankColors(index)} border`}
            >
              <div className="flex items-center gap-2">
                {getRankIcon(index)}
                <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                {friend.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{friend.name}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Level {friend.level}</span>
                  <span>{friend.videos_posted} videos</span>
                  {friend.viral_videos > 0 && (
                    <span className="text-orange-400">{friend.viral_videos}x viral</span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-bold text-white">Lv.{friend.level}</div>
                <div className="text-xs text-gray-400">{friend.total_views} views</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
