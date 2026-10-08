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
    isLoggedIn,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    avatarUrl,
    joinedAt,
    savedSuccess,
    setSavedSuccess,
    saveError,
    isSaving,
    isLoading,
    retryLoadProfile,
    hasLoadedProfile,
    handleSave,
    totalPlansCount,
    confirmedPlansCount,
    publishedPlansCount,
    serverTrips,
    serverTotal,
    serverTotalPages,
    activityPage,
    activityPageSize,
    handleActivityPageChange,
    isLoadingActivity,
    activityError,
    retryLoadActivity,
  } = useProfileController();

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      <ProfileHeader
        formData={formData}
        avatarUrl={avatarUrl}
        joinedAt={joinedAt}
        totalPlansCount={totalPlansCount}
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
          saveError={saveError}
          isSaving={isSaving}
          isLoading={isLoading}
          onRetry={retryLoadProfile}
          hasLoadedProfile={hasLoadedProfile}
          handleSave={handleSave}
          isLoggedIn={isLoggedIn}
        />
      )}

      {activeTab === 'dna' && <ProfileDnaTab />}

      {activeTab === 'subscription' && <ProfileSubscriptionTab />}

      {activeTab === 'activity' && (
        <ProfileActivityTab
          isLoggedIn={isLoggedIn}
          serverTrips={serverTrips}
          isLoadingServerTrips={isLoadingActivity}
          serverTripsError={activityError}
          serverTotal={serverTotal}
          serverTotalPages={serverTotalPages}
          currentPage={activityPage}
          pageSize={activityPageSize}
          onPageChange={handleActivityPageChange}
          onRetry={retryLoadActivity}
        />
      )}

      {activeTab === 'feedback' && <ProfileFeedbackTab />}
    </div>
  );
}
