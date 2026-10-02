import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import ProfileForm from './ProfileForm';
import PostComposer from './PostComposer';
import PostFeed from './PostFeed';

const SECTIONS = ['Profile', 'Success Story', 'Job Portal', 'Requests', '1:1 Mentorship'];

const AlumniDashboard = () => {
  const [activeSection, setActiveSection] = useState('Profile');
  // bumped after a new post so the feed below the composer reloads
  const [postsVersion, setPostsVersion] = useState(0);

  const reloadPosts = () => setPostsVersion((version) => version + 1);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'Success Story':
        return (
          <>
            <PostComposer type="success_story" onPosted={reloadPosts} />
            <PostFeed type="success_story" refreshKey={postsVersion} />
          </>
        );
      case 'Job Portal':
        return (
          <>
            <PostComposer type="job" onPosted={reloadPosts} />
            <PostFeed type="job" refreshKey={postsVersion} />
          </>
        );
      case 'Requests':
        return <p className="text-gray-400">Mentorship requests will appear here.</p>;
      case '1:1 Mentorship':
        return <p className="text-gray-400">Conversations with your students will appear here.</p>;
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

export default AlumniDashboard;
