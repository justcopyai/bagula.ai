'use client';

import { useOrganization, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Check, Zap } from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  priceId?: string;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    price: '$29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER,
    features: [
      '10K sessions/month',
      '50K LLM calls/month',
      '5 team members',
      'Email support',
      '7-day data retention',
    ],
  },
  {
    name: 'Pro',
    price: '$99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
    features: [
      '50K sessions/month',
      '250K LLM calls/month',
      'Unlimited team members',
      'Priority support',
      '90-day data retention',
      'Advanced analytics',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Unlimited sessions',
      'Unlimited LLM calls',
      'SSO (SAML/OIDC)',
      'Dedicated support',
      'Custom SLA (99.9%+)',
      'On-premise option',
    ],
  },
];

export default function BillingPage() {
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    if (organization) {
      fetchUsage();
    }
  }, [organization]);

  const fetchUsage = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/billing/organizations/${organization?.id}/usage`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const handleUpgrade = async (priceId?: string) => {
    if (!priceId) {
      // Contact sales for enterprise
      window.location.href = 'mailto:sales@bagula.ai';
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/billing/organizations/${organization?.id}/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId,
            successUrl: `${window.location.origin}/dashboard/billing?success=true`,
            cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
          }),
        }
      );

      if (response.ok) {
        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Please select an organization
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and view usage
        </p>
      </div>

      {/* Current Usage */}
      {usage && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Current Billing Period
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {usage.usage?.reduce(
                  (sum: number, day: any) => sum + Number(day.session_count || 0),
                  0
                ) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">LLM Calls</p>
              <p className="text-2xl font-bold text-gray-900">
                {usage.usage?.reduce(
                  (sum: number, day: any) => sum + Number(day.llm_call_count || 0),
                  0
                ) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {usage.usage
                  ?.reduce(
                    (sum: number, day: any) => sum + Number(day.total_cost_usd || 0),
                    0
                  )
                  .toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-lg shadow p-6 ${
              plan.highlighted ? 'ring-2 ring-blue-600' : ''
            }`}
          >
            {plan.highlighted && (
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  Most Popular
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">
                {plan.price}
              </span>
              {plan.price !== 'Custom' && (
                <span className="text-gray-600">/month</span>
              )}
            </div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade(plan.priceId)}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                plan.highlighted
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Loading...' : plan.price === 'Custom' ? 'Contact Sales' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
