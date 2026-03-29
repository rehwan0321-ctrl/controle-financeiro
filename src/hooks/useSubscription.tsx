import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const TRIAL_HOURS = 24;

export interface SubscriptionStatus {
  loading: boolean;
  hasAccess: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  hoursLeft: number; // hours remaining in trial (if in trial)
  subscriptionExpiresAt: string | null;
  trialStartedAt: string | null;
  planName: string | null;
}

export const useSubscription = (): SubscriptionStatus => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isModerator, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) { setLoading(false); return; }

    const fetchSubscription = async () => {
      // Try to get existing subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .select("trial_started_at, subscription_expires_at, plan_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        // If no record, create one now (fallback for users registered before trigger)
        const { data: newSub } = await supabase
          .from("subscriptions")
          .insert({ user_id: user.id, trial_started_at: new Date().toISOString() })
          .select("trial_started_at, subscription_expires_at, plan_name")
          .single();
        if (newSub) {
          setTrialStartedAt(newSub.trial_started_at);
          setSubscriptionExpiresAt(newSub.subscription_expires_at);
          setPlanName(newSub.plan_name);
        }
      } else {
        setTrialStartedAt(data.trial_started_at);
        setSubscriptionExpiresAt(data.subscription_expires_at);
        setPlanName(data.plan_name);
      }
      setLoading(false);
    };

    fetchSubscription();
  }, [user, authLoading, roleLoading]);

  if (authLoading || roleLoading || loading) {
    return { loading: true, hasAccess: false, isTrialActive: false, isTrialExpired: false, hoursLeft: 0, subscriptionExpiresAt: null, trialStartedAt: null, planName: null };
  }

  // Admins and moderators always have full access
  if (isAdmin || isModerator) {
    return { loading: false, hasAccess: true, isTrialActive: false, isTrialExpired: false, hoursLeft: 0, subscriptionExpiresAt, trialStartedAt, planName };
  }

  const now = new Date();

  // Check paid subscription
  if (subscriptionExpiresAt) {
    const expiry = new Date(subscriptionExpiresAt);
    if (expiry > now) {
      return { loading: false, hasAccess: true, isTrialActive: false, isTrialExpired: false, hoursLeft: 0, subscriptionExpiresAt, trialStartedAt, planName };
    }
  }

  // Check trial
  if (trialStartedAt) {
    const trialEnd = new Date(new Date(trialStartedAt).getTime() + TRIAL_HOURS * 60 * 60 * 1000);
    const msLeft = trialEnd.getTime() - now.getTime();
    const hoursLeft = Math.max(0, msLeft / (1000 * 60 * 60));

    if (msLeft > 0) {
      return { loading: false, hasAccess: true, isTrialActive: true, isTrialExpired: false, hoursLeft, subscriptionExpiresAt, trialStartedAt, planName };
    } else {
      return { loading: false, hasAccess: false, isTrialActive: false, isTrialExpired: true, hoursLeft: 0, subscriptionExpiresAt, trialStartedAt, planName };
    }
  }

  // No subscription record found
  return { loading: false, hasAccess: false, isTrialActive: false, isTrialExpired: true, hoursLeft: 0, subscriptionExpiresAt, trialStartedAt, planName };
};
