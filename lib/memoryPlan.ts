type MemoryPlanUser = {
  plan_type?: string | null;
  premium_until?: Date | null;
} | null;

export function memoryPlanLimits(user: MemoryPlanUser) {
  const premiumIsActive =
    user?.plan_type === "premium" &&
    (!user.premium_until || user.premium_until > new Date());

  if (premiumIsActive) return { imageLimit: 50, videoLimit: 10, plan: "premium" as const };
  if (user?.plan_type === "starter") return { imageLimit: 20, videoLimit: 2, plan: "starter" as const };
  return { imageLimit: 10, videoLimit: 1, plan: "legacy" as const };
}
