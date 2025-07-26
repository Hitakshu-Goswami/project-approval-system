import { useState } from 'react';
import { AuthWrapper } from '@/components/AuthWrapper';
import { ProjectForm } from '@/components/ProjectForm';
import { ProjectsList } from '@/components/ProjectsList';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProjectSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AuthWrapper>
      {(user) => (
        <div className="space-y-8">
          <ProjectForm user={user} onProjectSubmitted={handleProjectSubmitted} />
          <ProjectsList user={user} refreshTrigger={refreshTrigger} />
        </div>
      )}
    </AuthWrapper>
  );
};

export default Index;
