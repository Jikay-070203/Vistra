'use client';

import React from 'react';
import { useProfileController } from './useProfileController';
import ProfileHeader from './ProfileHeader';
import ProfileInfoTab from './ProfileInfoTab';
import ProfileDnaTab from './ProfileDnaTab';
import ProfileSubscriptionTab from './ProfileSubscriptionTab';
import ProfileActivityTab from './ProfileActivityTab';
import ProfileFeedbackTab from './ProfileFeedbackTab';

export default function ProfileScreen() {
  const {
    plans,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    savedSuccess,
    setSavedSuccess,
    handleSave,
    confirmedPlansCount,
    publishedPlansCount,
  } = useProfileController();

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      <ProfileHeader
        formData={formData}
        totalPlansCount={plans.length}
        confirmedPlansCount={confirmedPlansCount}
        publishedPlansCount={publishedPlansCount}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {activeTab === 'info' && (
        <ProfileInfoTab
          formData={formData}
          setFormData={setFormData}
          savedSuccess={savedSuccess}
          setSavedSuccess={setSavedSuccess}
          handleSave={handleSave}
        />
      )}

      {activeTab === 'dna' && <ProfileDnaTab />}

      {activeTab === 'subscription' && <ProfileSubscriptionTab />}

      {activeTab === 'activity' && <ProfileActivityTab plans={plans} />}

      {activeTab === 'feedback' && <ProfileFeedbackTab />}
    </div>
  );
}
