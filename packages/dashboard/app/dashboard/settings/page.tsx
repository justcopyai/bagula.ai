import { OrganizationProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your organization settings and team members
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <OrganizationProfile
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none',
            },
          }}
        />
      </div>
    </div>
  );
}
