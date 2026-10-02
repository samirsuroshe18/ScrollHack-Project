import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import ProfileForm from './ProfileForm';
import PostFeed from './PostFeed';

const SECTIONS = ['Profile', 'Success Story', 'Job Portal', 'Find Mentor', '1:1 Mentorship'];

const StudentDashboard = () => {
  const [activeSection, setActiveSection] = useState('Profile');

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'Success Story':
        return <PostFeed type="success_story" />;
      case 'Job Portal':
        return <PostFeed type="job" />;
      case 'Find Mentor':
        return <p className="text-gray-400">Mentor search will appear here.</p>;
      case '1:1 Mentorship':
        return <p className="text-gray-400">Conversations with your mentors will appear here.</p>;
      default:
        return <ProfileForm />;
    }
  };

  return (
    <DashboardLayout sections={SECTIONS} active={activeSection} onSelect={setActiveSection}>
      {renderSectionContent()}
    </DashboardLayout>
  );
};

export default StudentDashboard;
