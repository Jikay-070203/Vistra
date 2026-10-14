'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    isLoaded,
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

  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      router.replace('/login?next=/profile');
    }
  }, [isLoaded, isLoggedIn, router]);

  if (!isLoaded) {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#205BD6] border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm text-[#4B5875]">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-16 text-center">
        <p className="text-sm text-[#4B5875]">Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
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

      <section
        id="profile-tabpanel"
        role="tabpanel"
        aria-labelledby={`profile-tab-${activeTab}`}
        tabIndex={0}
        className="mt-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#205BD6] sm:mt-6"
      >
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
      </section>
    </div>
  );
}
