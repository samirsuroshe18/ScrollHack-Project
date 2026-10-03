import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import ProfileForm from './ProfileForm';
import PostComposer from './PostComposer';
import PostFeed from './PostFeed';
import ChatPanel from './ChatPanel';
import MentorshipRequests from './MentorshipRequests';

const SECTIONS = ['Profile', 'Success Story', 'Job Portal', 'Requests', '1:1 Mentorship'];

const AlumniDashboard = () => {
  const [activeSection, setActiveSection] = useState('Profile');
  // bumped after a new post so the feed below the composer reloads
  const [postsVersion, setPostsVersion] = useState(0);

  const reloadPosts = () => setPostsVersion((version) => version + 1);

  // the keys give each section its own composer, so a draft never moves between them
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'Success Story':
        return (
          <>
            <PostComposer key="success_story" type="success_story" onPosted={reloadPosts} />
            <PostFeed type="success_story" refreshKey={postsVersion} />
          </>
        );
      case 'Job Portal':
        return (
          <>
            <PostComposer key="job" type="job" onPosted={reloadPosts} />
            <PostFeed type="job" refreshKey={postsVersion} />
          </>
        );
      case 'Requests':
        return <MentorshipRequests />;
      case '1:1 Mentorship':
        return <ChatPanel />;
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
