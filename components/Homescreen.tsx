import React from 'react';
import ToolCard from './ToolCard';
import PlannerIcon from './PlannerIcon';
import OneRepMaxIcon from './OneRepMaxIcon';
import WarmupGeneratorIcon from './WarmupGeneratorIcon';
import VelocityProfileIcon from './VelocityProfileIcon';
import TechniqueScoreIcon from './TechniqueScoreIcon';
import TimerIcon from './TimerIcon';

interface HomescreenProps {
  onNavigateToPlanner: () => void;
  onNavigateToOneRepMax: () => void;
  onNavigateToWarmupGenerator: () => void;
  onNavigateToVelocityProfile: () => void;
  onNavigateToTechniqueScore: () => void;
  onNavigateToWorkoutTimer: () => void;
}

const Homescreen: React.FC<HomescreenProps> = ({ 
    onNavigateToPlanner, 
    onNavigateToOneRepMax, 
    onNavigateToWarmupGenerator, 
    onNavigateToVelocityProfile, 
    onNavigateToTechniqueScore,
    onNavigateToWorkoutTimer
}) => {
  return (
    <main className="flex-1 min-w-0 p-8 animate-fadeIn">
        <div className="max-w-xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                <ToolCard 
                    icon={<PlannerIcon />}
                    title="Competition Planner"
                    onClick={onNavigateToPlanner}
                />
                <ToolCard 
                    icon={<TimerIcon />}
                    title="Workout Timer"
                    onClick={onNavigateToWorkoutTimer}
                />
                <ToolCard 
                    icon={<OneRepMaxIcon />}
                    title="1RM & Training Load"
                    onClick={onNavigateToOneRepMax}
                />
                <ToolCard 
                    icon={<WarmupGeneratorIcon />}
                    title="Warm-up Generator"
                    onClick={onNavigateToWarmupGenerator}
                />
                <ToolCard 
                    icon={<VelocityProfileIcon />}
                    title="Velocity Profile"
                    onClick={onNavigateToVelocityProfile}
                />
                <ToolCard 
                    icon={<TechniqueScoreIcon />}
                    title="Technique Score"
                    onClick={onNavigateToTechniqueScore}
                />
                {/* Future tools will be added here */}
            </div>
        </div>
    </main>
  );
};

export default Homescreen;