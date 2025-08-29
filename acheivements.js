import React, { useState, useEffect } from "react";
import { Achievement, UserStats } from "@/entities/all";
import { User } from "@/entities/User";
import { Trophy, Star, Flame, Crown, Medal, Award, Zap, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const achievementIcons = {
  star: Star,
  flame: Flame,
  crown: Crown,
  medal: Medal,
  award: Award,
  zap: Zap,
  target: Target
};

const predefinedAchievements = [
  {
    name: "First Video",
    description: "Posted your very first video",
    icon: "star",
    category: "posting",
    requirement: 1,
    points: 10
  },
  {
    name: "Getting Started", 
    description: "Posted 5 videos",
    icon: "target",
    category: "posting",
    requirement: 5,
    points: 25
  },
  {
    name: "Content Creator",
    description: "Posted 10 videos",
    icon: "award",
    category: "posting", 
    requirement: 10,
    points: 50
  },
  {
    name: "Influencer",
    description: "Posted 25 videos",
    icon: "crown",
    category: "posting",
    requirement: 25,
    points: 100
  },
  {
    name: "Video Master",
    description: "Posted 50 videos",
    icon: "medal",
    category: "posting",
    requirement: 50,
    points: 200
  },
  {
    name: "Viral Sensation",
    description: "Had your first viral video",
    icon: "flame",
    category: "viral",
    requirement: 1,
    points: 75
  },
  {
    name: "Viral King",
    description: "Had 5 viral videos",
    icon: "zap",
    category: "viral",
    requirement: 5,
    points: 250
  }
];

export default function Achievements() {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load unlocked achievements
      const achievements = await Achievement.filter({ created_by: currentUser.email });
      setUnlockedAchievements(achievements);

      // Load user stats
      const stats = await UserStats.filter({ created_by: currentUser.email });
      if (stats.length > 0) {
        setUserStats(stats[0]);
      }

    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAchievementUnlocked = (achievement) => {
    return unlockedAchievements.some(unlocked => unlocked.name === achievement.name);
  };

  const getProgress = (achievement) => {
    if (!userStats) return 0;
    
    if (achievement.category === "posting") {
      return Math.min(((userStats.videos_posted || 0) / achievement.requirement) * 100, 100);
    } else if (achievement.category === "viral") {
      return Math.min(((userStats.viral_videos || 0) / achievement.requirement) * 100, 100);
    }
    return 0;
  };

  const getTotalPoints = () => {
    return unlockedAchievements.reduce((total, achievement) => {
      const predefined = predefinedAchievements.find(p => p.name === achievement.name);
      return total + (predefined?.points || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Join ViralStream</h2>
          <p className="text-gray-400 mb-6">Sign in to unlock achievements</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto hide-scrollbar p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Achievements</h1>
          <p className="text-gray-400">Unlock rewards as you create content</p>
        </div>

        {/* Stats Overview */}
        <div className="gradient-border mb-8">
          <div className="gradient-border-inner p-6 text-center">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold gradient-text">{unlockedAchievements.length}</div>
                <div className="text-xs text-gray-400">Unlocked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">{getTotalPoints()}</div>
                <div className="text-xs text-gray-400">Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {Math.round((unlockedAchievements.length / predefinedAchievements.length) * 100)}%
                </div>
                <div className="text-xs text-gray-400">Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-4">
          <AnimatePresence>
            {predefinedAchievements.map((achievement, index) => {
              const isUnlocked = isAchievementUnlocked(achievement);
              const progress = getProgress(achievement);
              const IconComponent = achievementIcons[achievement.icon] || Star;

              return (
                <motion.div
                  key={achievement.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative overflow-hidden rounded-xl border ${
                    isUnlocked 
                      ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10' 
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  <div className="p-4 flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isUnlocked 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                        : 'bg-gray-700'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${
                        isUnlocked ? 'text-white' : 'text-gray-400'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold ${
                          isUnlocked ? 'text-white' : 'text-gray-400'
                        }`}>
                          {achievement.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-yellow-500">{achievement.points}</span>
                        </div>
                      </div>
                      
                      <p className={`text-sm ${
                        isUnlocked ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {achievement.description}
                      </p>

                      {/* Progress Bar */}
                      {!isUnlocked && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>
                              {achievement.category === "posting" ? (userStats?.videos_posted || 0) : (userStats?.viral_videos || 0)} / {achievement.requirement}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {isUnlocked && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Trophy className="w-3 h-3" />
                            <span className="text-xs font-medium">Unlocked!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shine Effect for Unlocked */}
                  {isUnlocked && (
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      style={{ 
                        transform: 'skew(-20deg)',
                        width: '50%'
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Motivational Message */}
        <div className="mt-8 mb-20 text-center bg-gray-800/30 rounded-lg p-6 border border-gray-700">
          <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-white mb-2">Keep Creating!</h3>
          <p className="text-sm text-gray-400">
            {unlockedAchievements.length === 0 
              ? "Post your first video to unlock your first achievement!"
              : `${predefinedAchievements.length - unlockedAchievements.length} achievements left to unlock!`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
